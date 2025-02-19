import { getKeepaEanProgressPerShop } from "../db/util/getEanKeepaProgress.js";
import { getKeepaProgressPerShop } from "../db/util/getKeepaProgress.js";
import { KEEPA_PRODUCT_LIMIT, KEEPA_RATE_LIMIT } from "../constants.js";
import { lockProductsForKeepa } from "../db/util/crudProducts.js";
import {
  keepaEanTaskRecovery,
  keepaTaskRecovery,
} from "../db/util/getKeepaRecovery.js";
import { updateTaskWithQuery } from "../db/util/updateTask.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { PendingShop } from "../types/shops.js";
import { KeepaTaskType, ProductWithTask } from "../types/products.js";
import { DbProductRecord, Shop, WithId } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../db/mongo.js";
import { Filter } from "mongodb";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function keepaSalesProcess() {
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
    .limit(KEEPA_PRODUCT_LIMIT)
    .sort({ createdAt: -1 }) // Sort by createdAt to get the latest products
    .toArray();

  if (salesProducts.length) {
    return salesProducts.map((product) => {
      return {
        ...product,
        taskType: KeepaTaskType.KEEPA_SALES,
      };
    });
  }

  return [];
}
export async function keepaNormalProcess({
  activeShops,
}: {
  activeShops: WithId<Shop>[];
}) {
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

  pleaseRecover &&
    logGlobal(loggerName, `Recover keepa task: ${pleaseRecover}`);
  const products = await prepareProducts(
    pleaseRecover ? recoveryShops : keepaProgressPerShop,
    false,
    pleaseRecover
  );
  if (products.length) {
    return products.flatMap((ps) => ps);
  }
  return [];
}
export async function keepaWholesaleProcess() {
  const col = await getProductsCol();

  const query: Filter<DbProductRecord> = {
    a_lookup_pending: true,
    a_status: "keepa",
    target: "a",
  };

  const wholeSaleProducts = await col
    .find(query)
    .limit(KEEPA_PRODUCT_LIMIT)
    .toArray();

  if (wholeSaleProducts.length) {
    logGlobal(
      loggerName,
      `Keepa Wholesale products: ${wholeSaleProducts.length}`
    );
    return wholeSaleProducts.map((product) => {
      return {
        ...product,
        taskType: KeepaTaskType.KEEPA_WHOLESALE,
      };
    });
  }

  return [];
}
export async function keepaEanProcess({
  activeShops,
}: {
  activeShops: WithId<Shop>[];
}) {
  const keepaProgressPerShop = await getKeepaEanProgressPerShop(activeShops);
  const recoveryShops = await keepaEanTaskRecovery(activeShops!);
  const pleaseRecover = recoveryShops.some((p) => p.pending > 0);

  pleaseRecover &&
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
    pleaseRecover
  );
  if (products.length) {
    return products.flatMap((ps) => ps);
  }
  return [];
}
async function prepareProducts(
  keepaProgressPerShop: PendingShop[],
  fallback: boolean,
  recovery: boolean
): Promise<ProductWithTask[][]> {
  const pendingShops = keepaProgressPerShop.filter((shop) => shop.pending > 0);
  await updateTaskWithQuery(
    { type: fallback ? KeepaTaskType.KEEPA_EAN : KeepaTaskType.KEEPA_NORMAL },
    { progress: pendingShops }
  );

  const numberOfPendingShops = pendingShops.length;
  const totalProducts = KEEPA_PRODUCT_LIMIT;
  const productsPerShop = Math.floor(totalProducts / numberOfPendingShops);

  const unqiueDocuments = new Set<string>();
  const prepareProducts = await Promise.all(
    pendingShops.map(async (shop) => {
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
            taskType: fallback
              ? KeepaTaskType.KEEPA_EAN
              : KeepaTaskType.KEEPA_NORMAL,
          };
        }) as ProductWithTask[];
    })
  );

  return prepareProducts;
}
