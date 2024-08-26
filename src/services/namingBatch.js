import { CHECK_PACKAGE_BATCH_INTERVAL } from "../constants.js";
import { getCrawlDataDb } from "./db/mongo.js";
import "dotenv/config";
import { config } from "dotenv";
import { checkForPendingProductsAndCreateBatches } from "../util/titles/checkForPendingProductsAndCreateBatches.js";
import { checkAndProcessBatches } from "../util/titles/checkAndProcessBatches.js";
config({
  path: [`.env`],
});

let intervalId = 0;

const nameBatchInteration = async () => {
  clearInterval(intervalId);
  console.log("Interval started...");
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  const task = await tasksCol.findOne({ type: "MATCH_TITLES" });

  if (!task) throw new Error("No task found for type MATCH_TITLES");

  const { batches: batchesData } = task;

  const batch = await checkAndProcessBatches(batchesData);

  if (batch === "processed") {
    console.log("Checking for pending products and creating batches...");
    const check = await checkForPendingProductsAndCreateBatches();
    if (check === "No new batches found") {
      console.log(check);
    }
  }

  console.log(
    "Step: Checking for pending products and creating batches is done!"
  );
  // check for status of batch_ids
  nameBatchProcessing(false).then();
};

const nameBatchProcessing = async (init = true) => {
  if (init) {
    await nameBatchInteration();
  }
  intervalId = setInterval(async () => {
    await nameBatchInteration();
  }, CHECK_PACKAGE_BATCH_INTERVAL);
};

export default nameBatchProcessing;
