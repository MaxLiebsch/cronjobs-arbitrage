import pkg from "lodash";
const { get } = pkg;

import axios from "axios";
import { KEEPA_MINUTES, KEEPA_RATE_LIMIT } from "../constants.js";
import { getActiveShops } from "./db/util/shops.js";
import { getKeepaProgress } from "./db/util/getKeepaProgress.js";
import {
  lockProductsForKeepa,
  updateProductWithQuery,
} from "./db/util/crudArbispotterProduct.js";
import "dotenv/config";
import { config } from "dotenv";
import { scheduleJob } from "node-schedule";
import { upsertAsin } from "./db/util/asinTable.js";

config({
  path: [`.env`],
});

const properties = [
  { key: "products[0].categories", name: "" },
  { key: "products[0].eanList", name: "k_eanList" },
  { key: "products[0].brand", name: "" },
  { key: "products[0].numberOfItems", name: "" },
  { key: "products[0].availabilityAmazon", name: "" },
  { key: "products[0].categoryTree", name: "" },
  { key: "products[0].salesRanks", name: "" }, // Sales Rank nullable
  { key: "products[0].monthlySold", name: "" },
  { key: "products[0].csv[0]", name: "ahstprcs" }, // Amazon history prices
  { key: "products[0].csv[1]", name: "anhstprcs" }, // Amazon new history prices
  { key: "products[0].csv[2]", name: "auhstprcs" }, // Amazon used history prices
  { key: "products[0].stats.current[0]", name: "curr_ahsprcs" },
  { key: "products[0].stats.current[1]", name: "curr_ansprcs" },
  { key: "products[0].stats.current[2]", name: "curr_ausprcs" },
  { key: "products[0].stats.current[3]", name: "curr_salesRank" },
  { key: "products[0].stats.avg90[0]", name: "avg90_ahsprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[1]", name: "avg90_ansprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[2]", name: "avg90_ausprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[3]", name: "avg90_salesRank" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.buyBoxIsAmazon", name: "buyBoxIsAmazon" },
  { key: "products[0].stats.stockAmount", name: "stockAmount" }, //  The stock of the Amazon offer, if available. Otherwise undefined.
  { key: "products[0].stats.stockBuyBox", name: "stockBuyBox" }, // he stock of the buy box offer, if available. Otherwise undefined.
  { key: "products[0].stats.totalOfferCount", name: "totalOfferCount" }, // The total count of offers for this product (all conditions combined). The offer count per condition can be found in the current field.
];

const keepa = async ({ shopDomain, asin, _id, analysis }) => {
  const result = {};
  properties.forEach((property) => {
    const key = property.name
      ? property.name
      : property.key.replace("products[0].", "");

    result[key] = get(analysis, property.key, null);
  });

  if (asin) {
    await upsertAsin(asin, result["k_eanList"] ?? []);
  }

  await updateProductWithQuery(
    shopDomain,
    { _id },
    {
      ...result,
      keepaUpdatedAt: new Date().toISOString(),
      keepa_lckd: false,
      asin,
    }
  );
};

// Function to make two requests for each ID
async function makeRequestsForId(product) {
  const trimedAsin = product.asin.replace(/\W/g, "");
  try {
    const response = await axios.get(
      `${process.env.KEEPA_URL}/product?key=${process.env.KEEPA_API_KEY}&domain=3&asin=${trimedAsin}&stats=90&history=1&days=90`
    );

    if (response.status === 200 && response.data.error === undefined) {
      console.log(`Request for ID ${trimedAsin} - ${product.shopDomain}`);
      await keepa({ ...product, analysis: response.data, asin: trimedAsin });
    } else {
      await updateProductWithQuery(
        product.shopDomain,
        { _id: product._id },
        {
          keepa_lckd: false,
          asin: trimedAsin,
        }
      );
      console.log(
        `Request for ID ${trimedAsin} - ${product.shopDomain} failed with status ${response.status}`,
        response.data.error
      );
    }
  } catch (error) {
    console.error(`Error for ID ${trimedAsin} - ${product.shopDomain}:`, error);
  }
}

// Mock queue with Asins (initially empty)
const asinQueue = [];

// Event mechanism
let queueResolve;
// Job, when all products have been sourced
let job = null;

const queuePromise = () =>
  new Promise((resolve) => {
    queueResolve = resolve;
  });
// Function to process up to 20 Asins from the queue (20 requests)

export async function processQueue() {
  while (true) {
    console.log("Remaining Asins in batch:", asinQueue.length);
    if (asinQueue.length === 0) {
      console.log(
        "Queue is empty after processing all pending products. Starting job to look for pending keepa lookups..."
      );
      job = scheduleJob("*/10 * * * *", async () => {
        console.log("Checking for pending products...");
        await lookForPendingKeepaLookups();
      });
      await queuePromise();
    }

    const promises = [];

    for (let i = 0; i < KEEPA_RATE_LIMIT; i++) {
      if (asinQueue.length > 0) {
        const product = asinQueue.shift();
        if (product?.asin) promises.push(makeRequestsForId(product));
      } else {
        break; // Break the loop if the queue is empty
      }
    }

    await Promise.all(promises);

    if (asinQueue.length === 0) {
      if (job) job.cancel();
      console.log("Batch is done. Looking for pending keepa lookups...");
      await lookForPendingKeepaLookups();
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

export async function lookForPendingKeepaLookups() {
  const activeShops = await getActiveShops();

  const keepaProgressPerShop = await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await getKeepaProgress(shop.d);
        return { pending: progress.pending, d: shop.d };
      })
    )
  );

  const pendingShops = keepaProgressPerShop.filter((shop) => shop.pending > 0);

  const numberOfPendingShops = pendingShops.length;
  const totalProducts = KEEPA_MINUTES * KEEPA_RATE_LIMIT;
  const productsPerShop = parseInt(
    Math.floor(totalProducts / numberOfPendingShops)
  );

  const products = await Promise.all(
    pendingShops.map(async (shop) => {
      console.log(`Shop ${shop.d} has ${shop.pending} pending keepa lookups`);
      const products = await lockProductsForKeepa(shop.d, productsPerShop);
      const asins = products.map((product) => {
        return { asin: product.asin, shopDomain: shop.d, _id: product._id };
      });
      return asins;
    })
  );

  if (products.length) {
    addToQueue(products.flatMap((ps) => ps));
  } else {
    console.log("No pending products. Starting job!");
    if (!job) {
      job = scheduleJob("*/10 * * * *", async () => {
        console.log("Checking for pending products...");
        await lookForPendingKeepaLookups();
      });
    }
  }
}
