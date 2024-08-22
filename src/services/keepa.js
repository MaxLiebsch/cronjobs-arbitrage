import "dotenv/config";
import { config } from "dotenv";
import { scheduleJob } from "node-schedule";
import { makeRequestsForEan, makeRequestsForId } from "../util/keepaHelper.js";
import { lookForPendingKeepaLookups } from "../util/lookForPendingKeepaLookups.js";
import { KEEPA_RATE_LIMIT } from "../constants.js";
import { updateProductWithQuery } from "./db/util/crudArbispotterProduct.js";

config({
  path: [`.env`],
});

// Mock queue with Asins (initially empty)
const asinQueue = [];

// Event mechanism
let queueResolve;
// Job, when all products have been sourced
let job = null;
let running = false;

export const queuePromise = () =>
  new Promise((resolve) => {
    queueResolve = resolve;
  });

export async function processQueue(keepaJob) {
  job = keepaJob;
  running = true;
  while (true) {
    console.log("Remaining Asins in batch:", asinQueue.length);
    if (asinQueue.length === 0) {
      console.log(
        "Queue is empty after processing all pending products. Starting job to look for pending keepa lookups..."
      );
      if (!job) {
        console.log("Queue is empty, starting job");
        job = scheduleJob("*/10 * * * *", async () => {
          console.log("Checking for pending products...");
          await lookForPendingKeepaLookups(job);
        });
      }
      queuePromise();
    }

    const promises = [];

    for (let i = 0; i < KEEPA_RATE_LIMIT; i++) {
      if (asinQueue.length > 0) {
        const product = asinQueue.shift();
        if (product?.asin) {
          promises.push(makeRequestsForId(product));
        } else {
          console.log('product:', product)
          if (!product?.ean) {
            await updateProductWithQuery(
              product.shopDomain,
              { _id: product._id },
              {
                $unset: {
                  keepa_lckd: "",
                  keepaEan_lckd: ""
                },
              }
            );
          }
        }
        if (product?.ean) {
          promises.push(makeRequestsForEan(product));
        } else {
          console.log('product:', product)
          if (!product?.asin) {
            await updateProductWithQuery(
              product.shopDomain,
              { _id: product._id },
              {
                $unset: {
                  keepa_lckd: "",
                  keepaEan_lckd: "",
                },
              }
            );
          }
        }
      } else {
        break; // Break the loop if the queue is empty
      }
    }

    await Promise.all(promises);

    if (asinQueue.length === 0) {
      if (job) {
        console.log("Batch is done, cancel job!");
        job.cancel();
        job = null;
      }
      console.log("Batch is done. Looking for pending keepa lookups...");
      await lookForPendingKeepaLookups(job);
    }

    await new Promise((resolve) => setTimeout(resolve, 60 * 1000)); // Wait for 1 minute
  }
}

// Function to add new Asins to the queue
export function addToQueue(newAsins) {
  asinQueue.push(...newAsins);
  if (queueResolve) {
    queueResolve(); // Resolve the promise to wake up processQueue
    queueResolve = null;
  }
}
