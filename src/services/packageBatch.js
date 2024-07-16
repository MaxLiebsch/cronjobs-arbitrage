import { CHECK_PACKAGE_BATCH_INTERVAL } from "../constants.js";
import { getCrawlDataDb } from "./db/mongo.js";
import "dotenv/config";
import { config } from "dotenv";
import { checkForPendingProductsAndCreateBatches } from "../util/checkForPendingProductsAndCreateBatches.js";
import { checkAndProcessBatches } from "../util/checkAndProcessBatches.js";
config({
  path: [`.env`],
});

const packageBatchInteration = async (intervalId = 0) => {
  clearInterval(intervalId);
  console.log('Interval started...');
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  const task = await tasksCol.findOne({ type: "DETECT_QUANTITY" });

  if (!task) throw new Error("No task found for type DETECT_QUANTITY");

  const { batches: batchesData } = task;

  const batch = await checkAndProcessBatches(batchesData);

  if (batch === "processed") {
    console.log("Checking for pending products and creating batches");
    await checkForPendingProductsAndCreateBatches();
  }

  console.log("Checking for pending products and creating batches done");
  // check for status of batch_ids
  packageBatchProcessing(false).then();
};

const packageBatchProcessing = async (init = true) => {
  init && (await packageBatchInteration());
  const intervalId = setInterval(async () => {
    await packageBatchInteration(intervalId);
  }, CHECK_PACKAGE_BATCH_INTERVAL);
};

packageBatchProcessing().then();
