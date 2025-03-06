import {
  DbProductRecord,
  resetAznProductQuery,
  resetEbyProductQuery,
} from "@dipmaxtech/clr-pkg";
import { BATCH_SIZE } from "../../../constants.js";
import { aiTaskLog } from "../../../util/aiTaskLog.js";
import { AiTask, AiTaskResult } from "../../AITask.js";
import { Model, ModelLimitType } from "../../Model.js";
import { ProductManager } from "../../ProductManager.js";
import { PromptTemplate } from "../../PromptTemplate.js";
import { TaskContext } from "../../Taskcontext.js";
import { AiTaskQuery } from "../query/index.js";
import { MatchTitleTaskResult } from "../resultSchema/MatchTitleTaskResultSchema.js";

export class MatchTitlesTask extends AiTask<DbProductRecord> {
  constructor(
    readonly model: Model<any>,
    readonly promptTemplate: PromptTemplate<unknown>,
    readonly taskContext: TaskContext,
    readonly productManager: ProductManager,
    readonly query: AiTaskQuery
  ) {
    super(promptTemplate, model, taskContext, productManager);
  }
  async execute(): Promise<void> {
    const limit: number =
      this.model.limitType === ModelLimitType.REQUESTS
        ? this.model.limit
        : BATCH_SIZE;
    const products = await this.productManager.getDataset(this.query(limit));

    if (products.length === 0) {
      return;
    }

    const batch = await this.model.startBatch(this.template, products);
    if ("error" in batch) {
      aiTaskLog(
        `Error starting batch for ${this.taskContext.taskType} for ${this.taskContext.provider}: ${batch.error}`
      );
      await this.productManager.unlockProducts(batch.unusedProducts);
      return;
    }
    aiTaskLog(
      `Batch started for ${this.taskContext.taskType} for ${this.taskContext.provider}`
    );
    const { batchSize, unusedProducts } = batch;
    await this.taskContext.aiTaskTotal.addToTotal(batchSize);
    await this.productManager.unlockProducts(unusedProducts);
  }
  async handleResults(results: AiTaskResult<MatchTitleTaskResult>[]) {
    const products = await this.productManager.getProducts(
      results.map((r) => r.productId)
    );
    const bulkSpotterUpdates: any[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const spotterSet: Partial<DbProductRecord> = {};

      const productId = result.productId;
      const product = products.find((p) => p._id.equals(productId));

      if (!product) {
        continue;
      }

      const { a_vrfd, e_vrfd } = product;
      const update = result.result;
      const bulkUpdate: any = {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $unset: { nm_prop: "" },
          },
        },
      };

      if (!update) {
        // mark product as failed
        bulkSpotterUpdates.push(bulkUpdate);
        continue;
      }

      let deleteAzn = false;
      let deleteEby = false;
      const nm_prop = "complete";

      if ("a_score" in update && "a_isMatch" in update) {
        const aScore = Number(update.a_score);
        if (aScore < 0.7) {
          // MINIMAL_SCORE
          deleteAzn = true;
        } else if (!isNaN(aScore)) {
          spotterSet["a_vrfd"] = {
            ...a_vrfd,
            nm_prop,
            mdl: this.taskContext.modelName,
            score: aScore,
            isMatch: update.a_isMatch,
          };
        }
      }

      if ("e_score" in update && "e_isMatch" in update) {
        const eScore = Number(update.e_score);
        if (eScore < 0.7) {
          // MINIMAL_SCORE
          deleteEby = true;
        } else if (!isNaN(eScore)) {
          spotterSet["e_vrfd"] = {
            ...e_vrfd,
            mdl: this.taskContext.modelName,
            nm_prop,
            score: eScore,
            isMatch: update.e_isMatch,
          };
        }
      }

      if (Object.keys(spotterSet).length > 0) {
        bulkUpdate.updateOne.update["$set"] = {
          ...spotterSet,
          nm_updatedAt: new Date().toISOString(),
        };
      }

      if (deleteAzn) {
        bulkUpdate.updateOne.update["$unset"] = {
          ...bulkUpdate.updateOne.update.$unset,
          ...resetAznProductQuery().$unset,
        };
      }

      if (deleteEby) {
        bulkUpdate.updateOne.update["$unset"] = {
          ...bulkUpdate.updateOne.update.$unset,
          ...resetEbyProductQuery().$unset,
        };
      }

      bulkSpotterUpdates.push(bulkUpdate);
    }

    if (bulkSpotterUpdates.length) {
      await this.productManager.bulkWrite(bulkSpotterUpdates);
    }
  }
  async handleError(error: Error) {
    const dataIds = this.taskContext.batchContext.dataIds;
    if (dataIds) {
      await this.productManager.unlockProducts(
        dataIds.map((id) => ({ _id: id })) as DbProductRecord[]
      );
    }
  }
}
