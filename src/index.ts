import { scheduleJob } from "node-schedule";
import { processQueue, setTotal } from "./services/keepa.js";
import { deleteUnwatchedProducts } from "./services/deleteUnwatchedProducts.js";
import { controlProcessProps } from "./services/controlProcessProps.js";
import { lookForPendingKeepaLookups } from "./util/lookForPendingKeepaLookups.js";
import { getCrawlDataDb } from "./db/mongo.js";
import { resurrectionFromGrave } from "./services/resurrection.js";
import productBatchProcessingForShops from "./services/productBatchProcessing.js";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, setTaskLogger } from "./util/logger.js";

const main = async () => {
  scheduleJob("0 */16 * * *", async () => {
    const logger = new LocalLogger().createLogger(CJ_LOGGER.PROCESS_PROPS);
    setTaskLogger(logger, CJ_LOGGER.PROCESS_PROPS);
    await controlProcessProps();
    //@ts-ignore
    LocalLogger.instance.destroy(CJ_LOGGER.PROCESS_PROPS);
  });

  scheduleJob("0 */18 * * *", async () => {
    const logger = new LocalLogger().createLogger(CJ_LOGGER.RESURRECTION);
    setTaskLogger(logger, CJ_LOGGER.RESURRECTION);
    await resurrectionFromGrave();
    //@ts-ignore
    LocalLogger.instance.destroy(CJ_LOGGER.RESURRECTION);
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
