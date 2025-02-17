import { scheduleJob } from "node-schedule";
import { controlProcessProps } from "./services/controlProcessProps.js";
import { getCrawlDataDb } from "./db/mongo.js";
import productBatchProcessingForShops from "./services/productBatchProcessing.js";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, setTaskLogger } from "./util/logger.js";
import { processIncompleteDeals } from "./services/processIncompleteDeals.js";
import { KeepaQueue } from "./services/keepaQueue.js";

const main = async () => {
  scheduleJob("0 */16 * * *", async () => {
    const logger = new LocalLogger().createLogger(CJ_LOGGER.PROCESS_PROPS);
    setTaskLogger(logger, CJ_LOGGER.PROCESS_PROPS);
    await controlProcessProps();
    LocalLogger.instance.destroy(CJ_LOGGER.PROCESS_PROPS as any);
  });

  const keepaQueue = new KeepaQueue();
  keepaQueue.start().then()
  processIncompleteDeals().then();
  productBatchProcessingForShops().then();
};

main()
  .then(() => {
    console.log("Script finished");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
