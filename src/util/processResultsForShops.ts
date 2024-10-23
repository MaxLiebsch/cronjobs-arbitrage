import { getCrawlDataDb, getProductsCol } from "../db/mongo.js";

import { Batch, BatchTaskTypes } from "../types/tasks.js";
import { DbProductRecord, ObjectId, safeJSONParse } from "@dipmaxtech/clr-pkg";
import { BatchResults } from "../types/batchResult.js";
import { BulkWrite } from "../types/BulkTypes.js";
import { processMatchTitleResult } from "./titles/processMatchTitleResult.js";
import { BATCH_TASK_TYPES } from "../services/productBatchProcessing.js";
import { processDetectQuantityResult } from "./quantities/processDetectQuantityResult.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";

const loggerName = CJ_LOGGER.BATCHES;

export const processResultsForShops = async (
  fileContents: string,
  batchData: Batch,
  batchTaskType: BatchTaskTypes
) => {
  const { batchId, shopDomains } = batchData;
  const results = fileContents
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean) as BatchResults;

  const crawlDataDb = await getCrawlDataDb();
  const productCol = await getProductsCol();
  const bulkSpotterUpdates: any[] = [];
  const batchMap = new Map<string, BatchResults>();
  results.forEach((result) => {
    const shopDomain = result.custom_id.split("-")[0];
    if (!batchMap.has(shopDomain)) {
      batchMap.set(shopDomain, []);
    }
    batchMap.get(shopDomain)!.push(result);
  });

  logGlobal(loggerName, `${results.length} Results in batch ${batchId}`);

  for (const [shopDomain, results] of batchMap.entries()) {
    const ids = results
      .filter((result) => {
        const isValid = ObjectId.isValid(result.custom_id.split("-")[1]);
        if (!isValid) {
          const id = result.custom_id.split("-")[2];
          const isValid = ObjectId.isValid(id);

          if (isValid) {
            return isValid;
          } else {
            logGlobal(
              loggerName,
              `Invalid product id found: ${result.custom_id} for ${shopDomain}`
            );
            return false;
          }
        }
        return isValid;
      })
      .map((result) => new ObjectId(result.custom_id.split("-")[1].trim()));

    logGlobal(
      loggerName,
      `${ids.length}/${results.length} valid product ids for ${shopDomain}`
    );

    const products = (await productCol
      .find({ _id: { $in: ids } })
      .toArray()) as DbProductRecord[];

    if (products.length) {
      for (let index = 0; index < results.length; index++) {
        const spotterSet: Partial<DbProductRecord> = {};
        processResults(
          batchTaskType,
          spotterSet,
          results,
          index,
          products,
          bulkSpotterUpdates
        );
      }
      try {
        const result = await productCol.bulkWrite(bulkSpotterUpdates);
        logGlobal(
          loggerName,
          `${batchTaskType} BulkWrite result: ${result.modifiedCount}/${products.length} modified for ${shopDomain}`
        );
      } catch (error) {
        logGlobal(
          loggerName,
          `Error updating spotterDb: ${(error as Error)?.message}`
        );
      }
    } else {
      logGlobal(loggerName, `No products found in spotterDb for ${shopDomain}`);
    }
  }

  const tasksCol = crawlDataDb.collection("tasks");
  await tasksCol.updateOne(
    { type: batchTaskType, "batches.batchId": batchId },
    {
      $pull: {
        batches: { batchId },
      },
    }
  );
};

function processResults(
  batchTaskType: string,
  spotterSet: Partial<DbProductRecord>,
  results: BatchResults,
  index: number,
  products: DbProductRecord[],
  bulkSpotterUpdates: BulkWrite[]
) {
  if (batchTaskType === BATCH_TASK_TYPES.MATCH_TITLES) {
    processMatchTitleResult(
      spotterSet,
      results[index],
      products,
      bulkSpotterUpdates
    );
  } else {
    processDetectQuantityResult(
      spotterSet,
      results[index],
      products,
      bulkSpotterUpdates
    );
  }
}
