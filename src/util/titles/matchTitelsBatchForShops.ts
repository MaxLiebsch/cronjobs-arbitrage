import { config } from "dotenv";
import "dotenv/config";
import { getCrawlDataDb } from "../../db/mongo.js";
import { BATCH_TASK_TYPES, BATCHES } from "../../services/productBatchProcessing.js";
import { BatchTask } from "../../types/tasks.js";
import { checkAndProcessBatchesForShops } from "../checkAndProcessBatchesForShops.js";
config({
  path: [`.env`],
});

let intervalId = 0;

export const matchTitlesBatchInteration = async () => {
  clearInterval(intervalId);
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection<BatchTask>("tasks");

  const task = await tasksCol.findOne({ type: BATCH_TASK_TYPES.MATCH_TITLES });
  await tasksCol.updateOne(
    { type: BATCHES },
    { $set: { currentTask: BATCH_TASK_TYPES.MATCH_TITLES } }
  );

  if (!task)
    throw new Error("No task found for type " + BATCH_TASK_TYPES.MATCH_TITLES);

  const { batches: batchesData } = task;

  if (batchesData.length === 0) {
    return "No new batches found" 
  } else {
    await checkAndProcessBatchesForShops(
      batchesData,
      BATCH_TASK_TYPES.MATCH_TITLES
    );
  }
};
