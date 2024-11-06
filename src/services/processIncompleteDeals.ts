import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { findProducts } from "../db/util/crudProducts.js";
import { CJ_LOGGER, logGlobal, setTaskLogger } from "../util/logger.js";
import PQueue from "p-queue";
import { addProductsToQueue } from "../util/addProductsToQueue.js";
import { Job, scheduleJob } from "node-schedule";
import { findProductsForIncompleteDeals } from "../util/findProductsForIncompleteDealsService.js";

const loggerName = CJ_LOGGER.RECALCULATE;
const logger = new LocalLogger().createLogger(loggerName);
setTaskLogger(logger, loggerName);

/*
      B0CQM9TRRS: returns two unrelated products
*/
let total = 0;

export const getTotal = () => total;
export const setTotal = (value: number) => {
  total = value;
};
export const incrementTotal = () => {
  total++;
};

const query = {
  $and: [{ info_prop: "incomplete" }, { asin: { $exists: true } }],
};

const batchSize = 20;
const processingProducts = new Set<ObjectId>();
const queue = new PQueue({
  concurrency: 5,
  intervalCap: 100,
  interval: 600000,
  autoStart: true,
});
let count = 0;
let job: Job | null = null;

queue.on("empty", () => {
  logGlobal(loggerName, "Queue is empty, starting job");
  job = scheduleJob("*/10 * * * *", async () => {
    logGlobal(loggerName, "Checking for pending products...");
    const products = await findProductsForIncompleteDeals(batchSize);
    if (products.length === 0) {
      logGlobal(
        loggerName,
        "No products found in Job, waiting for new products"
      );
    } else {
      logGlobal(loggerName, "Adding products to queue");
      job?.cancel();
      addProductsToQueue(products, queue, processingProducts);
    }
  });
});

queue.on("idle", () => {
  console.log("Queue is idle");
});

queue.on("active", () => {
  console.log("Queue is active");
});

queue.on("completed", async () => {
  if (queue.size <= 6) {
    logGlobal(loggerName, `Queue ${queue.pending} (${queue.size})`);
    console.log("exclude processingProducts:", [...processingProducts.keys()]);
    const products = await findProductsForIncompleteDeals(
      batchSize,
      processingProducts
    );
    if (products.length === 0) {
      logGlobal(loggerName, "No products found");
      return;
    } else {
      logGlobal(loggerName, "Adding products to queue");
      addProductsToQueue(products, queue, processingProducts);
    }
  }
});

export async function processIncompleteDeals() {
  try {
    const products = await findProductsForIncompleteDeals(batchSize);

    if (!products || products.length === 0) {
      console.log("No products found");
      return;
    }

    addProductsToQueue(products, queue, processingProducts);
  } catch (error) {
    console.log("error:", error);
  }
}
