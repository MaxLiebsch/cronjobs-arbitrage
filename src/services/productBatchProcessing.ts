import { getCrawlDataDb } from "../db/mongo.js";
import { scheduleJob } from "node-schedule";
import { BatchTaskTypes } from "../types/tasks.js";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, logGlobal, setTaskLogger } from "../util/logger.js";
import { matchTitlesBatchInteration } from "../util/titles/matchTitelsBatchForShops.js";
import { detectQuantityBatchInteration } from "../util/quantities/detectQuantityBatchForShops.js";

export const BATCHES = "AI_TASKS";

export const BATCH_TASK_TYPES: { [key in BatchTaskTypes]: BatchTaskTypes } = {
  MATCH_TITLES: "MATCH_TITLES", // first task
  DETECT_QUANTITY: "DETECT_QUANTITY", // second task
};

/*
    At first we check if there any productTitles to match, 
    after that we check if there if the products are sold in bundles
    
    1. MATCH_TITLES
    2. DETECT_QUANTITY
*/
const loggerName = CJ_LOGGER.BATCHES;
const logger = new LocalLogger().createLogger(loggerName);
setTaskLogger(logger, loggerName);

const productBatchProcessingForShops = async () => {
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");

  const updateTaskIfNoNewBatches = async (
    checkFunction: () => Promise<"No new batches found" | undefined>
  ) => {
    const check = await checkFunction();
    if (check === "No new batches found") {
      logGlobal(
        loggerName,
        `No new batches found for ${BATCH_TASK_TYPES.DETECT_QUANTITY} moving to next task ${BATCH_TASK_TYPES.MATCH_TITLES}`
      );
      await tasksCol.updateOne(
        { type: BATCHES },
        { $set: { currentTask: BATCH_TASK_TYPES.MATCH_TITLES } }
      );
    }
  };

  try {
    const aiTasks = await tasksCol.findOne({ type: BATCHES });
    if (!aiTasks) return;
    const currentTask = aiTasks.currentTask;
    let matchTitlesTaskCompleted = false;
    if (currentTask === BATCH_TASK_TYPES.DETECT_QUANTITY) {
      logGlobal(loggerName, "Current task is " + BATCH_TASK_TYPES.DETECT_QUANTITY);
      await updateTaskIfNoNewBatches(detectQuantityBatchInteration);
    } else {
      logGlobal(loggerName, "Current task is " + BATCH_TASK_TYPES.MATCH_TITLES);
      const check = await matchTitlesBatchInteration();
      if (check === "No new batches found") {
        logGlobal(
          loggerName,
          "No new batches found for " + BATCH_TASK_TYPES.MATCH_TITLES
        );
        matchTitlesTaskCompleted = true;
      }
      if (matchTitlesTaskCompleted) {
        await updateTaskIfNoNewBatches(detectQuantityBatchInteration);
      }
    }

    const job = scheduleJob("1-59/1 * * * *", async () => {
      logGlobal(loggerName, "ProductBatchProcessingForShops job started...");
      job.cancel();
      await productBatchProcessingForShops();
    });
  } catch (error) {
    console.log('error:', error)
    if (error instanceof Error)
      logGlobal(
        loggerName,
        "Error in productBatchProcessingForShops " + error.message
      );
  }
};

export default productBatchProcessingForShops;
