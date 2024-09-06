import { getCrawlDataDb } from "./db/mongo.js";
import "dotenv/config";
import { config } from "dotenv";
import { checkAndProcessBatchesForShops } from "../util/quantities/checkAndProcessBatchesForShops.js";
import { checkForPendingProductsAndCreateBatchesForShops } from "../util/quantities/checkForPendingProductsAndCreateBatchesForShops.js";
import { TASK_TYPES } from "./productBatchProcessing.js";

config({
  path: [`.env`],
});

let intervalId = 0;

export const CURRENT_DETECT_QUANTITY_PROMPT_VERSION = "v03";

export const detectQuantityBatchInteration = async () => {
  clearInterval(intervalId);
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  const task = await tasksCol.findOne({ type: TASK_TYPES.DETECT_QUANTITY });
  await tasksCol.updateOne(
    { type: TASK_TYPES.BATCHES },
    { $set: { currentTask: TASK_TYPES.DETECT_QUANTITY } }
  );

  console.log("Interval started... for " + TASK_TYPES.DETECT_QUANTITY);

  if (!task)
    throw new Error("No task found for type " + TASK_TYPES.DETECT_QUANTITY);

  const { batches: batchesData } = task;

  if (batchesData.length === 0) {
    return await checkForPendingProductsAndCreateBatchesForShops();
  } else {
    const result = await checkAndProcessBatchesForShops(batchesData);
    if (result === "processed") {
      await tasksCol.updateOne(
        { type: TASK_TYPES.BATCHES },
        { $set: { currentTask: TASK_TYPES.MATCH_TITLES } }
      );
    }
  }
};
