import { Job, scheduleJob } from "node-schedule";
import { getKeepaEanProgressPerShop } from "../db/util/getEanKeepaProgress.js";
import { getKeepaProgressPerShop } from "../db/util/getKeepaProgress.js";
import { getActiveShops } from "../db/util/shops.js";
import { addToQueue } from "../services/keepa.js";
import {
  KEEPA_MINUTES,
  KEEPA_RATE_LIMIT,
  MAX_SALES_PRODUCTS,
  MAX_WHOLESALE_PRODUCTS,
} from "../constants.js";
import { lockProductsForKeepa } from "../db/util/crudProducts.js";
import {
  keepaEanTaskRecovery,
  keepaTaskRecovery,
} from "../db/util/getKeepaRecovery.js";
import { updateTaskWithQuery } from "../db/util/updateTask.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { PendingShop } from "../types/shops.js";
import { ProductWithTask } from "../types/products.js";
import { DbProductRecord, Shop, WithId } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../db/mongo.js";
import { Filter } from "mongodb";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function lookForPendingKeepaLookups(job: Job | null = null) {
  logGlobal(loggerName, "Starting looking for pending keepa lookups...");
  const activeShops = await getActiveShops();
  logGlobal(loggerName, `Active shops: ${activeShops?.length} loaded`);
  if (!activeShops) return;

  activeShops.push({ d: "sales" } as any);

  const salesProcessResult = await keepaSalesProcess({ job });

  if (salesProcessResult) return;

  const standardProcessResult = await keepaStandardProcess({
    job,
    activeShops,
  });
  if (standardProcessResult) return;

  const keepaWholesaleResult = await keepaWholesaleProcess({ job });
  if (keepaWholesaleResult) return;

  const keepaEanProcessResult = await keepaEanProcess({ job, activeShops });
  if (keepaEanProcessResult) return;

  if (!job) {
    logGlobal(loggerName, "Queue is empty, starting job");
    job = scheduleJob("*/10 * * * *", async () => {
      logGlobal(loggerName, "Checking for pending products...");
      await lookForPendingKeepaLookups(job);
    });
  }
}

async function keepaSalesProcess({ job }: { job: Job | null }) {
  logGlobal(loggerName, `Checking for pending sales keepa lookups...`);
  const col = await getProductsCol();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const query: Filter<DbProductRecord> = {
    $and: [
      {
        createdAt: {
          $gte: today.toISOString(),
        },
      },
      { sdmn: "sales" },
      { info_prop: "missing" },
      { keepaUpdatedAt: { $exists: false } },
    ],
  };

  const salesProducts = await col
    .find(query)
    .limit(MAX_SALES_PRODUCTS)
    .toArray();

  if (salesProducts.length) {
    if (job) {
      job.cancel();
      job = null;
    }
    logGlobal(loggerName, `Sale products: ${salesProducts.length}`);
    addToQueue(
      salesProducts.map((product) => {
        return {
          ...product,
          taskType: "KEEPA_SALES",
        };
      })
    );
    return true;
  }

  return false;
}

async function keepaStandardProcess({
  job,
  activeShops,
}: {
  job: Job | null;
  activeShops: WithId<Shop>[];
}) {
  logGlobal(loggerName, `Checking for pending standard keepa lookups...`);
  const keepaProgressPerShop = await getKeepaProgressPerShop(activeShops);
  const recoveryShops = await keepaTaskRecovery(activeShops);
  const pleaseRecover = recoveryShops.some((p) => p.pending > 0);

  const pendingProducts = pleaseRecover
    ? recoveryShops.reduce((acc, shop) => {
        return acc + shop.pending;
      }, 0)
    : keepaProgressPerShop.reduce((acc, shop) => {
        return acc + shop.pending;
      }, 0);

  logGlobal(loggerName, `Recover keepa task: ${pleaseRecover}`);
  const products = await prepareProducts(
    pleaseRecover ? recoveryShops : keepaProgressPerShop,
    false,
    pleaseRecover,
    pendingProducts
  );
  logGlobal(
    loggerName,
    `Keepa normal Products: ${
      products.length
    } Recover: ${pleaseRecover} Limit reached: ${
      products.length >= KEEPA_RATE_LIMIT
    }`
  );
  if (products.length) {
    logGlobal(loggerName, `Keepa Products: ${products.length}`);
    if (job) {
      job.cancel();
      job = null;
    }
    addToQueue(products.flatMap((ps) => ps));
    return true;
  }
  return false;
}
async function keepaEanProcess({
  job,
  activeShops,
}: {
  job: Job | null;
  activeShops: WithId<Shop>[];
}) {
  const keepaProgressPerShop = await getKeepaEanProgressPerShop(activeShops);
  const recoveryShops = await keepaEanTaskRecovery(activeShops!);
  const pleaseRecover = recoveryShops.some((p) => p.pending > 0);
  logGlobal(loggerName, `Recover keepa ean task: ${pleaseRecover}`);

  const pendingProducts = pleaseRecover
    ? recoveryShops.reduce((acc, shop) => {
        return acc + shop.pending;
      }, 0)
    : keepaProgressPerShop.reduce((acc, shop) => {
        return acc + shop.pending;
      }, 0);

  const products = await prepareProducts(
    pleaseRecover ? recoveryShops : keepaProgressPerShop,
    true,
    pleaseRecover,
    pendingProducts
  );
  logGlobal(
    loggerName,
    `Keepa Ean Products: ${
      products.length
    } Recover: ${pleaseRecover} Limit reached: ${
      products.length >= KEEPA_RATE_LIMIT
    }`
  );
  if (products.length) {
    if (job) {
      job.cancel();
      job = null;
    }
    addToQueue(products.flatMap((ps) => ps));
    return true;
  }
  return false;
}
async function keepaWholesaleProcess({ job }: { job: Job | null }) {
  const col = await getProductsCol();

  const query: Filter<DbProductRecord> = {
    a_lookup_pending: true,
    a_status: "keepa",
    target: "a",
  };

  const wholeSaleProducts = await col
    .find(query)
    .limit(MAX_WHOLESALE_PRODUCTS)
    .toArray();

  if (wholeSaleProducts.length) {
    if (job) {
      job.cancel();
      job = null;
    }
    logGlobal(loggerName, `Whole sale products: ${wholeSaleProducts.length}`);
    addToQueue(
      wholeSaleProducts.map((product) => {
        return {
          ...product,
          taskType: "KEEPA_WHOLESALE",
        };
      })
    );
    return true;
  }

  return false;
}

async function prepareProducts(
  keepaProgressPerShop: PendingShop[],
  fallback: boolean,
  recovery: boolean,
  pendingProducts: number
): Promise<ProductWithTask[][]> {
  if (pendingProducts < KEEPA_RATE_LIMIT && !recovery) {
    return [];
  }
  const pendingShops = keepaProgressPerShop.filter((shop) => shop.pending > 0);
  await updateTaskWithQuery(
    { type: fallback ? "KEEPA_EAN" : "KEEPA_NORMAL" },
    { progress: pendingShops }
  );

  const numberOfPendingShops = pendingShops.length;
  const totalProducts = KEEPA_MINUTES * KEEPA_RATE_LIMIT;
  const productsPerShop = Math.floor(totalProducts / numberOfPendingShops);

  const unqiueDocuments = new Set<string>();
  const prepareProducts = await Promise.all(
    pendingShops.map(async (shop) => {
      logGlobal(
        loggerName,
        `Shop ${shop.d} has ${shop.pending} pending keepa lookups`
      );
      const products = await lockProductsForKeepa(
        shop.d,
        productsPerShop,
        fallback,
        recovery
      );

      return products
        .filter((product) => {
          const relevantFilter = fallback ? product.eanList[0] : product.asin!;
          if (unqiueDocuments.has(relevantFilter)) {
            return false;
          } else {
            unqiueDocuments.add(relevantFilter);
            return true;
          }
        })
        .map((product) => {
          return {
            ...product,
            taskType: fallback ? "KEEPA_EAN" : "KEEPA_NORMAL",
          };
        }) as ProductWithTask[];
    })
  );

  return prepareProducts;
}
