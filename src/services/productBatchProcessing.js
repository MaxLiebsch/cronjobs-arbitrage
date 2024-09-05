import { getCrawlDataDb } from "./db/mongo.js";
import { matchTitlesBatchInteration } from "./matchTitelsBatchForShops.js";
import { detectQuantityBatchInteration } from "./detectQuantityBatchForShops.js";
import { scheduleJob } from "node-schedule";

export const TASK_TYPES = {
  BATCHES: "AI_TASKS", // global
  MATCH_TITLES: "MATCH_TITLES", // first task
  DETECT_QUANTITY: "DETECT_QUANTITY", // second task
};

/*
    At first we check if there any productTitles to match, 
    after that we check if there if the products are sold in bundles
    
    1. MATCH_TITLES
    2. DETECT_QUANTITY
*/

const productBatchProcessingForShops = async () => {
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");

  const updateTaskIfNoNewBatches = async (checkFunction) => {
    const check = await checkFunction();
    if (check === "No new batches found") {
      console.log(
        "No new batches found for ",
        TASK_TYPES.DETECT_QUANTITY,
        ", moving to next task " + TASK_TYPES.MATCH_TITLES
      );
      await tasksCol.updateOne(
        { type: TASK_TYPES.BATCHES },
        { $set: { currentTask: TASK_TYPES.MATCH_TITLES } }
      );
    }
  };

  try {
    const aiTasks = await tasksCol.findOne({ type: TASK_TYPES.BATCHES });
    const currentTask = aiTasks.currentTask;
    let matchTitlesTaskCompleted = false;
    if (currentTask === TASK_TYPES.DETECT_QUANTITY) {
      console.log(TASK_TYPES.DETECT_QUANTITY + "...");
      await updateTaskIfNoNewBatches(detectQuantityBatchInteration);
    } else {
      console.log(TASK_TYPES.MATCH_TITLES + "...");
      const check = await matchTitlesBatchInteration();
      if (check === "No new batches found") {
        console.log("No new batches found for " + TASK_TYPES.MATCH_TITLES);
        matchTitlesTaskCompleted = true;
      }
      if (matchTitlesTaskCompleted) {
        await updateTaskIfNoNewBatches(detectQuantityBatchInteration);
      }
    }

    const job = scheduleJob("1-59/1 * * * *", async () => {
      console.log("\n\n\n\n ProductBatchProcessingForShops job started...");
      job.cancel();
      await productBatchProcessingForShops();
    });
  } catch (error) {
    console.error("Error in productBatchProcessingForShops", error);
  }
};
export default productBatchProcessingForShops;
