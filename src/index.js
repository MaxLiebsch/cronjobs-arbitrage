import { scheduleJob } from "node-schedule";
import {
  createIntervalForPendingKeepalookups,
  lookForPendingKeepaLookups,
  processQueue,
} from "./services/keepa.js";
import { deleteUnwatchedProduts } from "./services/deleteUnwatchedProducts.js";

const main = async () => {
  // Look for old products
  const job = scheduleJob("0 0 * * *", async () => {
    await deleteUnwatchedProduts();
  });
  job.once("scheduled", ()=> console.log("Job scheduled"))

  // Look for pending keepa lookups
  await lookForPendingKeepaLookups();
  createIntervalForPendingKeepalookups();
  await processQueue();
};

main()
  .then(() => {
    console.log("Script finished");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
