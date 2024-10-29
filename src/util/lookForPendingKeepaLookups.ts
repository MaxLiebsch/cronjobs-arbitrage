import { Job, scheduleJob } from "node-schedule";
import { getKeepaEanProgressPerShop } from "../db/util/getEanKeepaProgress.js";
import { getKeepaProgressPerShop } from "../db/util/getKeepaProgress.js";
import { getActiveShops } from "../db/util/shops.js";
import { addToQueue } from "../services/keepa.js";
import { KEEPA_MINUTES, KEEPA_RATE_LIMIT } from "../constants.js";
import { lockProductsForKeepa } from "../db/util/crudProducts.js";
import {
  keepaEanTaskRecovery,
  keepaTaskRecovery,
} from "../db/util/getKeepaRecovery.js";
import { updateTaskWithQuery } from "../db/util/updateTask.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { PendingShop } from "../types/shops.js";
import { ProductWithTask } from "../types/products.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function lookForPendingKeepaLookups(job: Job | null = null) {
  logGlobal(loggerName, "Starting looking for pending keepa lookups...");
  const activeShops = await getActiveShops();
  logGlobal(loggerName, `Active shops: ${activeShops?.length} loaded`);
  if (!activeShops) return;
  
  logGlobal(loggerName, `Checking for pending keepa lookups...`);
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
  } else {
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
    } else {
      if (!job) {
        logGlobal(loggerName, "Queue is empty, starting job");
        job = scheduleJob("*/10 * * * *", async () => {
          logGlobal(loggerName, "Checking for pending products...");
          await lookForPendingKeepaLookups(job);
        });
      }
    }
  }
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

  return await Promise.all(
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

      return products.map((product) => {
        return {
          ...product,
          taskType: fallback ? "KEEPA_EAN" : "KEEPA_NORMAL",
        };
      }) as ProductWithTask[];
    })
  );
}
