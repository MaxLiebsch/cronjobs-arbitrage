import { getCrawlDataDb } from "./db/mongo.js";
import "dotenv/config";
import { config } from "dotenv";
import { checkForPendingProductsAndCreateBatchesForShops } from "../util/titles/checkForPendingProductsAndCreateBatchesForShops.js";
import { checkAndProcessBatchesForShops } from "../util/titles/checkAndProcessBatchesForShops.js";
import { TASK_TYPES } from "./productBatchProcessing.js";
config({
  path: [`.env`],
});

let intervalId = 0;

export const CURRENT_MATCH_TITLES_PROMPT_VERSION = 'v01';

export const matchTitlesBatchInteration = async () => {
  clearInterval(intervalId);
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");

  console.log("Interval started... for " + TASK_TYPES.MATCH_TITLES);
  const task = await tasksCol.findOne({ type: TASK_TYPES.MATCH_TITLES });
  await tasksCol.updateOne(
    { type: TASK_TYPES.BATCHES },
    { $set: { currentTask: TASK_TYPES.MATCH_TITLES } }
  );

  if (!task)
    throw new Error("No task found for type " + TASK_TYPES.MATCH_TITLES);

  const { batches: batchesData } = task;

  const batch = await checkAndProcessBatchesForShops(batchesData);

  if (batch === "processed") {
    console.log(
      "Checking for pending products and creating ", TASK_TYPES.MATCH_TITLES ," batch..."
    );
    const check = await checkForPendingProductsAndCreateBatchesForShops();
    return check;
  }
};
