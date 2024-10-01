import { Job, scheduleJob } from "node-schedule";
import { getKeepaEanProgressPerShop } from "../db/util/getFallbackKeepaProgress.js";
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
import { KeepaPreProduct } from "../types/keepaPreProduct.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function lookForPendingKeepaLookups(job: Job | null = null) {
  const activeShops = await getActiveShops();
  if (!activeShops) return;

  const keepaProgressPerShop = await getKeepaProgressPerShop(activeShops);
  const recoveryShops = await keepaTaskRecovery(activeShops!);
  const pleaseRecover = recoveryShops.some((p) => p.pending > 0);
  logGlobal(loggerName, `Recover keepa task: ${pleaseRecover}`);
  const products = await prepareProducts(
    pleaseRecover ? recoveryShops : keepaProgressPerShop,
    false,
    pleaseRecover
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

    const products = await prepareProducts(
      pleaseRecover ? recoveryShops : keepaProgressPerShop,
      true,
      pleaseRecover
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
  keepaProgressPerShop: { pending: number; d: string }[],
  fallback: boolean,
  recovery: boolean
): Promise<KeepaPreProduct[][]> {
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
      const keepaPreProducts = products.map((product) => {
        if (fallback) {
          return {
            ean: product.eanList[0],
            shopDomain: shop.d,
            _id: product._id,
          };
        } else {
          return {
            asin: product.asin,
            shopDomain: shop.d,
            _id: product._id,
          };
        }
      });
      return keepaPreProducts as KeepaPreProduct[];
    })
  );
}
