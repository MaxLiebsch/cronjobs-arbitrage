import { CHECK_PACKAGE_BATCH_INTERVAL } from "../constants.js";
import { getCrawlDataDb } from "./db/mongo.js";
import "dotenv/config";
import { config } from "dotenv";
import { checkForPendingProductsAndCreateBatches } from "../util/checkForPendingProductsAndCreateBatches.js";
import { checkAndProcessBatches } from "../util/checkAndProcessBatches.js";
config({
  path: [`.env`],
});

const packageBatchInteration = async (intervalId) => {
  console.log("Checking for pending products and creating batches...");
  const crawlDataDb = await getCrawlDataDb();
  clearInterval(intervalId);
  const tasksCol = crawlDataDb.collection("tasks");
  const task = await tasksCol.findOne({ type: "DETECT_QUANTITY" });

  if (!task) throw new Error("No task found for type DETECT_QUANTITY");

  const { batches: batchesData } = task;

  const batch = await checkAndProcessBatches(batchesData);
  if(batch === "processed") {
    await checkForPendingProductsAndCreateBatches();
  }

  // check for status of batch_ids
  packageBatchProcessing(false).then();
};

const packageBatchProcessing = async (init = true) => {
  let intervalId = 0;
  init && (await packageBatchInteration(intervalId));
  intervalId = setInterval(async () => {
    await packageBatchInteration(intervalId);
  }, CHECK_PACKAGE_BATCH_INTERVAL);
};

packageBatchProcessing().then();
