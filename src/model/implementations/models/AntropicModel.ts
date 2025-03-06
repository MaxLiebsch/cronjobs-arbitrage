import Anthropic from "@anthropic-ai/sdk";
import { APIPromise } from "@anthropic-ai/sdk/core";
import { JSONLDecoder } from "@anthropic-ai/sdk/internal/decoders/jsonl";
import {
  BatchCreateParams,
  MessageBatch,
  MessageBatchResult,
  TextBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { DbProductRecord, ObjectId, safeJSONParse } from "@dipmaxtech/clr-pkg";
import { ANTHROPIC_REQUEST_LIMIT } from "../../../constants.js";
import { extractId } from "../../../util/extractId.js";
import { retry } from "../../../util/retry.js";
import { AiTaskResult, AiTaskResultStatus } from "../../AITask.js";
import { BatchStatus } from "../../BatchContext.js";
import { ApiBasedProcessor } from "../../BatchProceessor.js";
import { Model, ModelLimitType, ModelType } from "../../Model.js";
import { PromptTemplate } from "../../PromptTemplate.js";
import { TaskContext } from "../../Taskcontext.js";

export class AntropicModel
  extends Model<Anthropic>
  implements ApiBasedProcessor
{
  limit: number = ANTHROPIC_REQUEST_LIMIT;
  name: ModelType;
  limitType: ModelLimitType = ModelLimitType.REQUESTS;
  client: Anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_KEY,
  });

  constructor(modelType: ModelType, private readonly taskContext: TaskContext) {
    super();
    this.name = modelType;
  }

  createBatchRequest(
    message: string,
    instruction: string,
    id: string
  ): BatchCreateParams.Request {
    return {
      custom_id: id,
      params: {
        model: this.name,
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        system: instruction,
      },
    };
  }

  async startBatch(template: PromptTemplate, products: DbProductRecord[]) {
    try {
      const batchRequests: Array<BatchCreateParams.Request> = [];

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

      // Create batch request
      const batch = await retry(() => this.createBatch(batchRequests), 3, 1000);

      await this.taskContext.updateBatchContext({
        batchId: batch.id,
        status: this.batchStatus(batch.processing_status),
        createdAt: Date.now(),
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

  batchStatus(status: MessageBatch["processing_status"]): BatchStatus {
    switch (status) {
      case "ended":
        return BatchStatus.Completed;
      case "canceling":
        return BatchStatus.Failed;
      default:
        return BatchStatus.Processing;
    }
  }

  createBatch<B = APIPromise<MessageBatch>>(
    requests: Array<BatchCreateParams.Request>
  ): B {
    return this.client.messages.batches.create({
      requests,
    }) as B;
  }

  retrieveBatch<B = APIPromise<Anthropic.Messages.Batches.MessageBatch>>(
    batchId: string
  ): B {
    return this.client.messages.batches.retrieve(batchId) as B;
  }

  retrieveContent<
    F = Promise<
      JSONLDecoder<Anthropic.Messages.Batches.MessageBatchIndividualResponse>
    >
  >(batchId: string): F {
    return this.client.messages.batches.results(batchId) as F;
  }

  async getProgress() {
    if (!this.taskContext.batchContext?.batchId) {
      throw new Error("Batch ID is not set");
    }

    const batch = await this.retrieveBatch(
      this.taskContext.batchContext.batchId
    );

    await this.taskContext.updateBatchContext({
      status: this.batchStatus(batch.processing_status),
      completedAt: batch.ended_at ? new Date(batch.ended_at).getTime() : 0,
      progress: {
        total: batch.request_counts.processing || 0,
        completed: batch.request_counts.succeeded || 0,
        failed: batch.request_counts.errored || 0,
      },
    });

    return this.batchStatus(batch.processing_status);
  }

  getResultStatus(result: MessageBatchResult): AiTaskResultStatus {
    switch (result.type) {
      case "succeeded":
        return AiTaskResultStatus.SUCCESS;
      case "canceled":
        return AiTaskResultStatus.FAILED;
      case "errored":
        return AiTaskResultStatus.FAILED;
      case "expired":
        return AiTaskResultStatus.FAILED;
    }
  }

  async getResults(): Promise<AiTaskResult[]> {
    if (!this.taskContext.batchContext?.batchId) {
      throw new Error("Batch ID is not set");
    }

    const batch = await this.retrieveBatch(
      this.taskContext.batchContext.batchId
    );

    if (batch.processing_status !== "ended") {
      throw new Error(`Batch is not completed: ${batch.processing_status}`);
    }

    const results: AiTaskResult[] = [];

    const decoder = await this.retrieveContent(batch.id);

    for await (const chunk of decoder) {
      const status = this.getResultStatus(chunk.result);
      const productId = extractId(chunk.custom_id);
      let result = null;
      if (chunk.result.type === "succeeded") {
        const content = (chunk.result.message.content[0] as TextBlock).text;
        const match = content.match(/{[^}]*}/g)
        if(match){
          result = safeJSONParse(match[0].replace(/[\n\r\t]/g, ''))
        }
      }

      if (!result) {
        results.push({
          result: null,
          productId: new ObjectId(productId),
          status: AiTaskResultStatus.FAILED,
        });
      }

      results.push({
        result,
        productId: new ObjectId(productId),
        status,
      });
    }

    return results;
  }
}
