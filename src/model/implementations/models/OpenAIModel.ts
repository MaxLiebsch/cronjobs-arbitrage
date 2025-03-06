import { DbProductRecord, ObjectId, safeJSONParse } from "@dipmaxtech/clr-pkg";
import pkg from 'fs-jetpack';
import { encodeChat } from "gpt-tokenizer";
import { ChatMessage } from "gpt-tokenizer/esm/GptEncoding";
import OpenAI from "openai";
import { APIPromise } from "openai/core";
import { OPENAI_TOKEN_LIMIT } from "../../../constants.js";
import { BatchResults } from "../../../types/batchResult.js";
import { createJSONlFile } from "../../../util/createJsonlFile.js";
import { extractId } from "../../../util/extractId.js";
import { retry } from "../../../util/retry.js";
import { AiTaskResult, AiTaskResultStatus } from "../../AITask.js";
import { BatchRequest, BatchStatus } from "../../BatchContext.js";
import { FileBasedProcessor } from "../../BatchProceessor.js";
import { Model, ModelLimitType, ModelType } from "../../Model.js";
import { PromptTemplate } from "../../PromptTemplate.js";
import { TaskContext } from "../../Taskcontext.js";
const { createReadStream } = pkg;

export class OpenAIModel extends Model<OpenAI> implements FileBasedProcessor {
  limit: number = OPENAI_TOKEN_LIMIT;
  name: ModelType;
  limitType: ModelLimitType = ModelLimitType.TOKENS;
  client: OpenAI = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
  });
  constructor(modelType: ModelType, private readonly taskContext: TaskContext) {
    super();
    this.name = modelType;
  }
  createBatchRequest(
    message: string,
    instruction: string,
    id: string
  ): BatchRequest & {
    custom_id: string;
    method: string;
    url: string;
    body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
  } {
    return {
      custom_id: id,
      method: "POST",
      url: "/v1/chat/completions",
      body: {
        model: this.name,
        messages: [
          {
            role: "system",
            content: instruction,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      },
    };
  }
  async startBatch(template: PromptTemplate, products: DbProductRecord[]) {
    try {
      const batchRequests: BatchRequest[] = [];
      let totalTokens = 0;
      for (const product of products) {
        const message = template.formatMessage(product);
        const instruction = template.formatInstruction(product);
        const request = this.createBatchRequest(
          message,
          instruction,
          product._id.toString()
        );
        const tokenCnt = encodeChat(
          request.body.messages as ChatMessage[],
          "gpt-4o-mini-2024-07-18"
        ).length;
        totalTokens += tokenCnt;
        if (totalTokens >= this.limit) {
          break;
        }
        batchRequests.push(request);
      }
      const filepath = await createJSONlFile(batchRequests, this.taskContext.provider);
      const file = await this.uploadFile(filepath);
      const batch = await retry(() => this.createBatch(file.id), 3, 1000);
      await this.taskContext.updateBatchContext({
        batchId: batch.id,
        status: this.batchStatus(batch.status),
        fileId: file.id,
        createdAt: batch.created_at,
        inputPath: filepath,
        dataIds: products.map((p) => p._id),
      });
      return {
        data: batch,
        batchSize: batchRequests.length,
        unusedProducts: products.filter(
          (p) => !batchRequests.some((r) => r.custom_id === p._id.toString())
        ),
      };
    } catch (error) {
      return { error: error as Error, unusedProducts: products };
    }
  }
  batchStatus(status: OpenAI.Batches.Batch["status"]): BatchStatus {
    switch (status) {
      case "completed":
        return BatchStatus.Completed;
      case 'in_progress':
      case 'validating':
      case 'finalizing':
        return BatchStatus.Processing;
      case "expired":
      case "failed":
      case "cancelled":
      case "cancelling":
        return BatchStatus.Failed;
      default:
        return BatchStatus.Processing;
    }
  }
  createBatch<F = APIPromise<OpenAI.Batches.Batch>>(fileId: string): F {
    return this.client.batches.create({
      input_file_id: fileId,
      endpoint: "/v1/chat/completions",
      completion_window: "24h",
    }) as F;
  }
  uploadFile<F = APIPromise<OpenAI.Files.FileObject>>(filepath: string): F {
    return this.client.files.create({
      file: createReadStream(filepath),
      purpose: "batch",
    }) as F;
  }
  deleteFile<F = APIPromise<OpenAI.Files.FileDeleted>>(fileId: string): F {
    return this.client.files.del(fileId) as F;
  }
  retrieveBatch<B = APIPromise<OpenAI.Batches.Batch>>(batchId: string): B {
    return this.client.batches.retrieve(batchId) as B;
  }
  retrieveContent<F = APIPromise<Response>>(fileId: string): F {
    return this.client.files.content(fileId) as F;
  }
  async getProgress() {
    if (!this.taskContext.batchContext?.batchId) {
      throw new Error("Batch ID is not set");
    }
    const batch = await this.retrieveBatch(
      this.taskContext.batchContext.batchId
    );
    await this.taskContext.updateBatchContext({
      status: this.batchStatus(batch.status),
      completedAt: batch.completed_at,
      progress: {
        total: batch.request_counts?.total ?? 0,
        completed: batch.request_counts?.completed ?? 0,
        failed: batch.request_counts?.failed ?? 0,
      },
    });
    return this.batchStatus(batch.status);
  }
  async getResults(): Promise<AiTaskResult[]> {
    if (!this.taskContext.batchContext?.batchId) {
      throw new Error("Batch ID is not set");
    }
    const batch = await this.retrieveBatch(
      this.taskContext.batchContext.batchId
    );
    if (!batch.output_file_id) {
      throw new Error("Output file ID is not set");
    }
    const file = await this.retrieveContent(batch.output_file_id);
    const content = await file.text();
    const rawResults = content
      .split("\n")
      .filter(Boolean)
      .map(safeJSONParse)
      .filter(Boolean) as BatchResults;

    const results = rawResults.reduce((acc, rawResult) => {
      const content = rawResult.response.body?.choices[0].message.content;
      if (!content) {
        acc.push({
          result: null,
          productId: new ObjectId(extractId(rawResult.custom_id)),
          status: AiTaskResultStatus.FAILED,
        });
        return acc;
      }
      const productId = extractId(rawResult.custom_id);
      const result = safeJSONParse(content);
      if (!result) {
        acc.push({
          result: null,
          productId: new ObjectId(productId),
          status: AiTaskResultStatus.FAILED,
        });
        return acc;
      }
      acc.push({
        result,
        productId: new ObjectId(productId),
        status: AiTaskResultStatus.SUCCESS,
      });
      return acc;
    }, [] as AiTaskResult[]);

    return results;
  }
}
