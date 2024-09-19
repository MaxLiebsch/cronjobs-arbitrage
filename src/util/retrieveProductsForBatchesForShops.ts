import { DbProductRecord } from "@dipmaxtech/clr-pkg";
import { BATCH_SIZE, MIN_BATCH_SIZE } from "../constants.js";
import { getArbispotterDb } from "../db/mongo.js";
import { getActiveShops } from "../db/util/shops.js";
import { shopFilter } from "./shopFilter.js";
import { aggregation } from "./titles/aggregation.js";
import { ProductWithShop } from "../types/products.js";
import { ShopBatches } from "../types/ShopBatches.js";
import { createBatches } from "./createBatchesForShops.js";
import { BatchTaskTypes } from "../types/tasks.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";

const loggerName = CJ_LOGGER.BATCHES

export const retrieveProductsForBatchesForShops = async (
  batchTaskType: BatchTaskTypes
): Promise<ShopBatches | null> => {
  const shops = await getActiveShops();
  if (!shops) return null;
  const spotterDb = await getArbispotterDb();
  const activeShops = shops.filter((shop) => shopFilter(shop));
  const products = [];
  const batchShops: string[] = [];
  for (let index = 0; index < activeShops.length; index++) {
    if (products.length >= BATCH_SIZE) break;

    const shop = activeShops[index];
    try {
      const rawProducts = (await spotterDb
        .collection(shop.d)
        .aggregate(aggregation)
        .toArray()) as DbProductRecord[];
      if (rawProducts.length === 0) continue;
      const productsWithShop = rawProducts.map<ProductWithShop>((product) => {
        return { ...product, shop: shop.d };
      });
      batchShops.push(shop.d);
      products.push(...productsWithShop);
    } catch (error) {
      logGlobal(loggerName, `Error fetching products for shop ${shop.d}: ${error}`);
      continue;
    }
  }

  if (products.length < MIN_BATCH_SIZE) return null;

  const shopBatches = createBatches(products, batchShops, batchTaskType);

  if (!shopBatches || shopBatches.length === 0) return null;

  return [shopBatches[0]];
};
