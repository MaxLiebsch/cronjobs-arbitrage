import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
  DbProductRecord,
  findMappedCategory,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";

import { BATCH_SIZE, MINIMAL_QUANTITY_SCORE } from "../../../constants.js";
import { aiTaskLog } from "../../../util/aiTaskLog.js";
import { AiTask, AiTaskResult } from "../../AITask.js";
import { Model, ModelLimitType } from "../../Model.js";
import { ProductManager } from "../../ProductManager.js";
import { PromptTemplate } from "../../PromptTemplate.js";
import { TaskContext } from "../../Taskcontext.js";
import { AiTaskQuery } from "../query/index.js";
import { DetectQuantityTaskResult } from "../resultSchema/MatchTitleTaskResultSchema.js";

export class DetectQuantityTask extends AiTask<DbProductRecord> {
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
  async handleResults(results: AiTaskResult<DetectQuantityTaskResult>[]) {
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

      const update = result.result;
      if (!update) {
        bulkSpotterUpdates.push({
          updateOne: {
            filter: { _id: product._id },
            update: {
              $unset: { qty_prop: "" },
            },
          },
        });
        continue;
      }

      const set: Partial<DbProductRecord> = {};

      // Process quantities
      if (update.nm) {
        // Ensure numeric values for quantities
        const nmValue =
          typeof update.nm === "string" ? parseInt(update.nm) : update.nm;
        set["qty"] = !isNaN(nmValue) && nmValue > 0 ? nmValue : 1;
      }
      if (update.a_nm) {
        const a_nmValue =
          typeof update.a_nm === "string" ? parseInt(update.a_nm) : update.a_nm;
        set["a_qty"] = !isNaN(a_nmValue) && a_nmValue > 0 ? a_nmValue : 1;
      }
      if (update.e_nm) {
        const e_nmValue =
          typeof update.e_nm === "string" ? parseInt(update.e_nm) : update.e_nm;
        set["e_qty"] = !isNaN(e_nmValue) && e_nmValue > 0 ? e_nmValue : 1;
      }

      // Process product types
      if (update.nm_produktart) {
        set["nm_produktart"] = update.nm_produktart;
      }
      if (update.a_produktart) {
        set["a_produktart"] = update.a_produktart;
      }
      if (update.e_produktart) {
        set["e_produktart"] = update.e_produktart;
      }

      const { a_qty, e_qty, qty } = set;
      const {
        a_prc: aSellPrice,
        prc: buyPrice,
        e_prc: eSellPrice,
        costs,
        a_vrfd,
        e_vrfd,
        ebyCategories,
        tax,
      } = product;

      // Calculate unit price for buy product
      if (qty && qty > 0) {
        spotterSet["uprc"] = roundToTwoDecimals(buyPrice / qty);
      } else {
        spotterSet["uprc"] = buyPrice;
        set["qty"] = 1;
      }

      const qty_prop = "complete";

      // Process scores
      if (update.nm_score) {
        const nmScore = Number(update.nm_score);
        if (nmScore >= MINIMAL_QUANTITY_SCORE && !isNaN(nmScore)) {
          spotterSet["nm_vrfd"] = {
            qty_prop,
            qty_score: nmScore,
          };
        }
      }

      if (update.a_score) {
        const aScore = Number(update.a_score);
        if (aScore >= MINIMAL_QUANTITY_SCORE && !isNaN(aScore)) {
          if (a_qty && aSellPrice && costs && a_qty > 0) {
            spotterSet["a_uprc"] = roundToTwoDecimals(aSellPrice / a_qty);

            const factor = a_qty / qty!;
            const arbitrage = calculateAznArbitrage(
              buyPrice * factor,
              aSellPrice,
              costs,
              tax
            );
            Object.entries(arbitrage).forEach(([key, value]) => {
              (spotterSet as any)[key] = value;
            });
          }
          spotterSet["a_vrfd"] = {
            ...a_vrfd,
            qty_prop,
            mdl: this.taskContext.modelName,
            qty_score: aScore,
          };
        }
      }

      if (update.e_score) {
        const eScore = Number(update.e_score);
        if (eScore >= MINIMAL_QUANTITY_SCORE && !isNaN(eScore)) {
          if (
            e_qty &&
            eSellPrice &&
            ebyCategories &&
            ebyCategories.length > 0 &&
            e_qty > 0
          ) {
            spotterSet["e_uprc"] = roundToTwoDecimals(eSellPrice / e_qty);

            const mappedCategories = findMappedCategory(
              ebyCategories.reduce<number[]>((acc, curr) => {
                acc.push(curr.id);
                return acc;
              }, [])
            );

            const factor = e_qty / qty!;
            if (mappedCategories) {
              const arbitrage = calculateEbyArbitrage(
                mappedCategories,
                eSellPrice,
                buyPrice * factor
              );
              if (arbitrage) {
                Object.entries(arbitrage).forEach(([key, value]) => {
                  (spotterSet as any)[key] = value;
                });
              }
            }
          }
          spotterSet["e_vrfd"] = {
            ...e_vrfd,
            qty_prop,
            mdl: this.taskContext.modelName,
            qty_score: eScore,
          };
        }
      }

      bulkSpotterUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              ...set,
              ...spotterSet,
              qty_updatedAt: new Date().toISOString(),
            },
            $unset: {
              qty_prop: "",
            },
          },
        },
      });
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
