import { scheduleJob } from "node-schedule";
import {  processQueue } from "./services/keepa.js";
import { deleteUnwatchedProduts } from "./services/deleteUnwatchedProducts.js";
import { controlProcessProps } from "./services/controlProcessProps.js";
import { lookForPendingKeepaLookups } from "./util/lookForPendingKeepaLookups.js";

const main = async () => {
  // Look for old products
  const job = scheduleJob("0 0 * * *", async () => {
    await deleteUnwatchedProduts();
  });
  job.once("scheduled", () => console.log("Job scheduled"));
  const job2 = scheduleJob("0 */16 * * *", async () => {  
    await controlProcessProps();
  });
  job2.once("scheduled", () => console.log("Job scheduled"));
  // Look for pending keepa lookups
  let keepaJob = null;
  await lookForPendingKeepaLookups(keepaJob);
  await processQueue(keepaJob);
};

main()
  .then(() => {
    console.log("Script finished");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
