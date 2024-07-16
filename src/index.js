import { scheduleJob } from "node-schedule";
import { lookForPendingKeepaLookups, processQueue } from "./services/keepa.js";
import { deleteUnwatchedProduts } from "./services/deleteUnwatchedProducts.js";
import { deleteUnwatchedCrawlDataProducts } from "./services/deleteUnwatchedCrawlDataProducts.js";
import packageBatchProcessing from "./services/packageBatch.js";

const main = async () => {
  // Look for old products
  const job = scheduleJob("0 0 * * *", async () => {
    await deleteUnwatchedProduts();
  });
  job.once("scheduled", () => console.log("Job scheduled"));
  const job2 = scheduleJob("0 */16 * * *", async () => {
    await deleteUnwatchedCrawlDataProducts();
  });
  job2.once("scheduled", () => console.log("Job scheduled"));
  // Look for pending keepa lookups
  await lookForPendingKeepaLookups();
  await processQueue();
  await packageBatchProcessing();
};

main()
  .then(() => {
    console.log("Script finished");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
