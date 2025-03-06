import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { scheduleJob } from "node-schedule";
import { AiTaskManager } from "./model/AiTaskManager.js";
import { KeepaQueue } from "./model/implementations/keepaQueue.js";
import { controlProcessProps } from "./services/controlProcessProps.js";
import { processIncompleteDeals } from "./services/processIncompleteDeals.js";
import { CJ_LOGGER, setTaskLogger } from "./util/logger.js";

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
  const aiTaskManager = new AiTaskManager();
  aiTaskManager.init().then();
};

main()
  .then(() => {
    console.log("Script finished");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
