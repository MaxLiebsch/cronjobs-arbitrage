import { DbProductRecord, ObjectId, safeJSONParse } from "@dipmaxtech/clr-pkg";
import { Mistral } from "@mistralai/mistralai";
import {
  BatchJobOut,
  ChatCompletionRequest,
  ChatCompletionResponse,
  UploadFileOut,
} from "@mistralai/mistralai/models/components";
import { readFileSync } from "fs";
import { APIPromise } from "openai/core";
import { MISTRAL_REQUEST_LIMIT } from "../../../constants.js";
import { BatchResults } from "../../../types/batchResult.js";
import { aiTaskLog } from "../../../util/aiTaskLog.js";
import { retry } from "../../../util/checkAndProcessBatchesForShops.js";
import { createJSONlFile } from "../../../util/createJsonlFile.js";
import { extractId } from "../../../util/extractId.js";
import { AiTaskResult, AiTaskResultStatus } from "../../AITask.js";
import { BatchRequest, BatchStatus } from "../../BatchContext.js";
import { FileBasedProcessor } from "../../BatchProceessor.js";
import { Model, ModelLimitType, ModelType } from "../../Model.js";
import { PromptTemplate } from "../../PromptTemplate.js";
import { TaskContext } from "../../Taskcontext.js";

export class MistralModel extends Model<Mistral> implements FileBasedProcessor {
  limit: number = MISTRAL_REQUEST_LIMIT;
  name: ModelType;
  limitType: ModelLimitType = ModelLimitType.REQUESTS;
  client: Mistral = new Mistral({ apiKey: process.env.MISTRAL_KEY || "" });

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
    body: ChatCompletionRequest;
  } {
    return {
      custom_id: id,
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
      },
    };
  }

  async startBatch(template: PromptTemplate, products: DbProductRecord[]) {
    try {
      const batchRequests: BatchRequest[] = [];
      for (const product of products) {
        const message = template.formatMessage(product);
        const instruction = template.formatInstruction(product);
        const request = this.createBatchRequest(
          message,
          instruction,
          product._id.toString()
        );
        batchRequests.push(request);
      }
      const filepath = await createJSONlFile(
        batchRequests,
        this.taskContext.provider
      );
      const file = await this.uploadFile(filepath);
      const batch = await retry(() => this.createBatch(file.id), 3, 1000);
      await this.taskContext.updateBatchContext({
        batchId: batch.id,
        status: this.batchStatus(batch.status),
        fileId: file.id,
        createdAt: batch.createdAt,
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
      aiTaskLog(`Error starting batch: ${error}`);
      return { error: error as Error, unusedProducts: products };
    }
  }

  batchStatus(status: BatchJobOut["status"]): BatchStatus {
    switch (status) {
      case "SUCCESS":
        return BatchStatus.Completed;
      case "FAILED":
      case "CANCELLED":
      case "TIMEOUT_EXCEEDED":
      case "CANCELLATION_REQUESTED":
        return BatchStatus.Failed;
      default:
        return BatchStatus.Processing;
    }
  }

  createBatch<F = Promise<BatchJobOut>>(fileId: string): F {
    return this.client.batch.jobs.create({
      inputFiles: [fileId],
      model: this.name,
      endpoint: "/v1/chat/completions",
      timeoutHours: 24,
    }) as F;
  }

  uploadFile<F = Promise<UploadFileOut>>(filepath: string): F {
    const fileBuffer = readFileSync(filepath);
    return this.client.files.upload({
      file: {
        fileName: `${this.taskContext.provider}-${Date.now()}.jsonl`,
        content: new Uint8Array(fileBuffer),
      },
      purpose: "batch",
    }) as F;
  }
  deleteFile<F = APIPromise<any>>(fileId: string): F {
    return this.client.files.delete({ fileId }) as F;
  }
  retrieveBatch<B = Promise<BatchJobOut>>(batchId: string): B {
    return this.client.batch.jobs.get({ jobId: batchId }) as B;
  }

  retrieveContent<F = Promise<ReadableStream<Uint8Array>>>(fileId: string): F {
    return this.client.files.download({ fileId }) as F;
  }

  async getProgress() {
    try {
      if (!this.taskContext.batchContext?.batchId) {
        throw new Error("Batch ID is not set");
      }
      const batch = await this.retrieveBatch(
        this.taskContext.batchContext.batchId
      );
      await this.taskContext.updateBatchContext({
        status: this.batchStatus(batch.status),
        completedAt: new Date(batch.completedAt ?? 0).getTime(),
        progress: {
          total: batch.totalRequests,
          completed: batch.completedRequests,
          failed: batch.failedRequests,
        },
      });
      return this.batchStatus(batch.status);
    } catch (error) {
      console.log("error:", error);
      return BatchStatus.Failed;
    }
  }

  async getJsonFromStream(stream: ReadableStream<Uint8Array>) {
    // Create a reader from the stream
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    // Read all chunks
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Concatenate chunks into a single Uint8Array
    const concatenated = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let position = 0;
    for (const chunk of chunks) {
      concatenated.set(chunk, position);
      position += chunk.length;
    }

    // Convert to text and parse JSON
    const text = new TextDecoder().decode(concatenated);
    return text
  }
  async getResults(): Promise<AiTaskResult[]> {
    if (!this.taskContext.batchContext?.batchId) {
      throw new Error("Batch ID is not set");
    }
    const batch = await this.retrieveBatch(
      this.taskContext.batchContext.batchId
    );
    if (!batch.outputFile) {
      throw new Error("Output file ID is not set");
    }
    const file = await this.retrieveContent(batch.outputFile);
    const content = (await this.getJsonFromStream(file));
    const rawResults = content
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean) as (BatchResults & RawResult)[]
    const results = rawResults.reduce((acc, rawResult) => {
      const cleanedContent = (
        rawResult.response.body.choices?.[0].message.content as string
      )?.replace(/```json\n|```/g, "")?.trim()
      const content = safeJSONParse(cleanedContent);
      const productId = extractId(rawResult.custom_id);
      if (!content) {
        acc.push({
          result: null,
          productId: new ObjectId(productId),
          status: AiTaskResultStatus.FAILED,
        });
        return acc;
      }

      acc.push({
        result: content,
        productId: new ObjectId(productId),
        status: AiTaskResultStatus.SUCCESS,
      });
      return acc;
    }, [] as AiTaskResult[]);

    return results;
  }
}

export interface RawResult {
  id: string
  custom_id: string
  response: Response
  error: any
}

export interface Response {
  status_code: number
  body: ChatCompletionResponse
}
