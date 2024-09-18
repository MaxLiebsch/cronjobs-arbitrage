import { getCrawlDataDb } from "../db/mongo.js";
import "dotenv/config";
import { config } from "dotenv";
import { checkForPendingProductsAndCreateBatchesForShops } from "../util/checkForPendingProductsAndCreateBatchesForShops.js";
import { checkAndProcessBatchesForShops } from "../util/checkAndProcessBatchesForShops.js";
import { BATCH_TASK_TYPES, BATCHES } from "./productBatchProcessing.js";
import { BatchTask } from "../types/tasks.js";
config({
  path: [`.env`],
});

let intervalId = 0;

export const CURRENT_MATCH_TITLES_PROMPT_VERSION = "v01";

export const matchTitlesBatchInteration = async () => {
  clearInterval(intervalId);
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection<BatchTask>("tasks");

  console.log("Interval started... for " + BATCH_TASK_TYPES.MATCH_TITLES);
  const task = await tasksCol.findOne({ type: BATCH_TASK_TYPES.MATCH_TITLES });
  await tasksCol.updateOne(
    { type: BATCHES },
    { $set: { currentTask: BATCH_TASK_TYPES.MATCH_TITLES } }
  );

  if (!task)
    throw new Error("No task found for type " + BATCH_TASK_TYPES.MATCH_TITLES);

  const { batches: batchesData } = task;

  if (batchesData.length === 0) {
    return await checkForPendingProductsAndCreateBatchesForShops(
      BATCH_TASK_TYPES.MATCH_TITLES
    );
  } else {
    await checkAndProcessBatchesForShops(
      batchesData,
      BATCH_TASK_TYPES.MATCH_TITLES
    );
  }
};
