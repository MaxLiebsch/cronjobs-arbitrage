import { scheduleJob } from "node-schedule";
import { processQueue, setTotal } from "./services/keepa.js";
import { controlProcessProps } from "./services/controlProcessProps.js";
import { lookForPendingKeepaLookups } from "./util/lookForPendingKeepaLookups.js";
import { getCrawlDataDb } from "./db/mongo.js";
import productBatchProcessingForShops from "./services/productBatchProcessing.js";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, setTaskLogger } from "./util/logger.js";
import { processIncompleteDeals } from "./services/processIncompleteDeals.js";

const main = async () => {
  scheduleJob("0 */16 * * *", async () => {
    const logger = new LocalLogger().createLogger(CJ_LOGGER.PROCESS_PROPS);
    setTaskLogger(logger, CJ_LOGGER.PROCESS_PROPS);
    await controlProcessProps();
    //@ts-ignore
    LocalLogger.instance.destroy(CJ_LOGGER.PROCESS_PROPS);
  });

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
  // Recalculate job
  await processIncompleteDeals().then()

  productBatchProcessingForShops().then();
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
