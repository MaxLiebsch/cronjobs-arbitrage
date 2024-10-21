import "dotenv/config";
import { config } from "dotenv";
import { Job, scheduleJob } from "node-schedule";
import { KEEPA_RATE_LIMIT } from "../constants.js";
import { updateTaskWithQuery } from "../db/util/updateTask.js";
import { lookForPendingKeepaLookups } from "../util/lookForPendingKeepaLookups.js";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, logGlobal, setTaskLogger } from "../util/logger.js";
import { ProductWithTask } from "../types/products.js";
import { makeRequestsForAsin } from "../util/makeRequestForAsin.js";
import { makeRequestsForEan } from "../util/makeRequestForEan.js";

config({
  path: [`.env`],
});

const loggerName = CJ_LOGGER.PENDING_KEEPAS;
const logger = new LocalLogger().createLogger(loggerName);
setTaskLogger(logger, loggerName);

// Mock queue with Asins (initially empty)
const asinQueue: ProductWithTask[] = [];

let total = 0;

export const getTotal = () => total;
export const setTotal = (value: number) => {
  total = value;
};
export const incrementTotal = () => {
  total++;
};

// Event mechanism
let queueResolve: any = null;
// Job, when all products have been sourced
let job: Job | null = null;
let running = false;

export const queuePromise = () =>
  new Promise<void>((resolve) => {
    queueResolve = resolve;
  });

export async function processQueue(keepaJob: Job | null = null) {
  job = keepaJob;
  running = true;
  while (true) {
    logGlobal(loggerName, "Processing queue..." + asinQueue.length);
    await updateTaskWithQuery({ type: "KEEPA_NORMAL" }, { total });
    if (asinQueue.length === 0) {
      logGlobal(
        loggerName,
        "Queue is empty after processing all pending products. Starting job to look for pending keepa lookups..."
      );
      if (!job) {
        logGlobal(loggerName, "Queue is empty, starting job");
        job = scheduleJob("*/10 * * * *", async () => {
          logGlobal(loggerName, "Checking for pending products...");
          await lookForPendingKeepaLookups(job);
        });
      }
      queuePromise();
    }

    const promises = [];

    for (let i = 0; i < KEEPA_RATE_LIMIT; i++) {
      if (asinQueue.length > 0) {
        const product = asinQueue.shift()!;
        if (product.taskType === "KEEPA_NORMAL") {
          incrementTotal();
          promises.push(makeRequestsForAsin(product));
        } else if (product.taskType === "KEEPA_EAN") {
          incrementTotal();
          promises.push(makeRequestsForEan(product));
        }
      } else {
        break; // Break the loop if the queue is empty
      }
    }

    await Promise.all(promises);

    if (asinQueue.length === 0) {
      if (job) {
        job.cancel();
        job = null;
      }
      logGlobal(
        loggerName,
        "Batch is done. Looking for pending keepa lookups..."
      );
      await lookForPendingKeepaLookups(job);
    }

    await new Promise((resolve) => setTimeout(resolve, 70 * 1000)); // Wait for 1 minute
  }
}

// Function to add new Asins to the queue
export function addToQueue(newAsins: ProductWithTask[]) {
  asinQueue.push(...newAsins);
  if (queueResolve) {
    queueResolve(undefined); // Resolve the promise to wake up processQueue
    queueResolve = null;
  }
}

scheduleJob("0 0 * * *", async () => {
  await updateTaskWithQuery(
    { type: "KEEPA_NORMAL" },
    { total: 0, yesterday: total }
  );
  setTotal(0);
});
