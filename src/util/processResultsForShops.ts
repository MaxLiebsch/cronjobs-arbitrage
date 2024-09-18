import { MongoBulkWriteError } from "mongodb";
import { getArbispotterDb, getCrawlDataDb } from "../db/mongo.js";

import { Batch, BatchTaskTypes } from "../types/tasks.js";
import { DbProductRecord, ObjectId, safeJSONParse } from "@dipmaxtech/clr-pkg";
import { BatchResults } from "../types/batchResult.js";
import { BulkWrite } from "../types/BulkTypes.js";
import { processMatchTitleResult } from "./titles/processMatchTitleResult.js";
import { BATCH_TASK_TYPES } from "../services/productBatchProcessing.js";
import { processDetectQuantityResult } from "./quantities/processDetectQuantityResult.js";

export const processResultsForShops = async (
  fileContents: string,
  batchData: Batch,
  batchTaskType: BatchTaskTypes
) => {
  const { batchId } = batchData;
  const results = fileContents
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean) as BatchResults;

  const crawlDataDb = await getCrawlDataDb();
  const spotterDb = await getArbispotterDb();
  const bulkSpotterUpdates: BulkWrite[] = [];
  const batchMap = new Map<string, BatchResults>();
  results.forEach((result) => {
    const shopDomain = result.custom_id.split("-")[0];
    if (!batchMap.has(shopDomain)) {
      batchMap.set(shopDomain, []);
    }
    batchMap.get(shopDomain)!.push(result);
  });

  for (const [shopDomain, results] of batchMap.entries()) {
    const ids = results.map(
      (result) => new ObjectId(result.custom_id.split("-")[1])
    );

    const products = (await spotterDb
      .collection(shopDomain)
      .find({ _id: { $in: ids } })
      .toArray()) as DbProductRecord[];

    if (products.length) {
      for (let index = 0; index < results.length; index++) {
        const spotterSet: Partial<DbProductRecord> = {};
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
      try {
        await spotterDb.collection(shopDomain).bulkWrite(bulkSpotterUpdates);
      } catch (error) {
        console.error({
          name: "Error updating spotterDb: ",
          stack: `${error}`,
        });
        if (error instanceof MongoBulkWriteError) {
          console.error({
            name: "Mongo",
            error: JSON.stringify(error.writeErrors, null, 2),
          });
        }
      }
    } else {
      console.error({
        name: "No products found in spotterDb",
        shopDomain,
      });
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
