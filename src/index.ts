import { scheduleJob } from "node-schedule";
import { processQueue, setTotal } from "./services/keepa.js";
import { deleteUnwatchedProduts } from "./services/deleteUnwatchedProducts.js";
import { controlProcessProps } from "./services/controlProcessProps.js";
import { lookForPendingKeepaLookups } from "./util/lookForPendingKeepaLookups.js";
import { getCrawlDataDb } from "./db/mongo.js";
import { resurrectionFromGrave } from "./services/resurrection.js";
import productBatchProcessingForShops from "./services/productBatchProcessing.js";

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

  const job3 = scheduleJob("0 */18 * * *", async () => {
    await resurrectionFromGrave();
  });

  job3.once("scheduled", () => console.log("Job scheduled"));

  // Look for pending keepa lookups
  let keepaJob = null;
  const db = await getCrawlDataDb();

  const keepaTask = await db
    .collection("tasks")
    .findOne({ type: "KEEPA_NORMAL" });

  if (keepaTask) {
    if (keepaTask.total) {
      console.log("Total from previous run:", keepaTask.total);
      setTotal(keepaTask.total);
    }
  }
  // productBatchProcessingForShops().then();
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
