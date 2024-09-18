import { getCrawlDataDb } from "../db/mongo.js";
import "dotenv/config";
import { config } from "dotenv";
import { BATCH_TASK_TYPES, BATCHES } from "./productBatchProcessing.js";
import { checkForPendingProductsAndCreateBatchesForShops } from "../util/checkForPendingProductsAndCreateBatchesForShops.js";
import { checkAndProcessBatchesForShops } from "../util/checkAndProcessBatchesForShops.js";

config({
  path: [`.env`],
});

let intervalId = 0;

export const CURRENT_DETECT_QUANTITY_PROMPT_VERSION = "v03";

export const detectQuantityBatchInteration = async () => {
  clearInterval(intervalId);
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  const task = await tasksCol.findOne({
    type: BATCH_TASK_TYPES.DETECT_QUANTITY,
  });
  await tasksCol.updateOne(
    { type: BATCHES },
    { $set: { currentTask: BATCH_TASK_TYPES.DETECT_QUANTITY } }
  );

  console.log("Interval started... for " + BATCH_TASK_TYPES.DETECT_QUANTITY);

  if (!task)
    throw new Error(
      "No task found for type " + BATCH_TASK_TYPES.DETECT_QUANTITY
    );

  const { batches: batchesData } = task;

  if (batchesData.length === 0) {
    return await checkForPendingProductsAndCreateBatchesForShops(
      BATCH_TASK_TYPES.DETECT_QUANTITY
    );
  } else {
    const result = await checkAndProcessBatchesForShops(batchesData, BATCH_TASK_TYPES.DETECT_QUANTITY);
    if (result === "processed") {
      await tasksCol.updateOne(
        { type: BATCHES },
        { $set: { currentTask: BATCH_TASK_TYPES.MATCH_TITLES } }
      );
    }
  }
};
