import "dotenv/config";
import { config } from "dotenv";
import { BATCH_TASK_TYPES, BATCHES } from "../../services/productBatchProcessing.js";
import { checkForPendingProductsAndCreateBatchesForShops } from "../checkForPendingProductsAndCreateBatchesForShops.js";
import { checkAndProcessBatchesForShops } from "../checkAndProcessBatchesForShops.js";
import { getCrawlDataDb } from "../../db/mongo.js";
import { CJ_LOGGER, logGlobal } from "../logger.js";

config({
  path: [`.env`],
});

let intervalId = 0;


const loggerName = CJ_LOGGER.BATCHES;

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
    const result = await checkAndProcessBatchesForShops(
      batchesData,
      BATCH_TASK_TYPES.DETECT_QUANTITY
    );
    if (result === "processed") {
      const result = await tasksCol.updateOne(
        { type: BATCHES },
        { $set: { currentTask: BATCH_TASK_TYPES.MATCH_TITLES } }
      );
      logGlobal(
        loggerName,
        `Batch processed. ${
          result.acknowledged ? "Task updated" : "Task not updated"
        }`
      );
    }
  }
};
