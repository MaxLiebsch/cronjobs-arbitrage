import { DbProductRecord } from "@dipmaxtech/clr-pkg";
import { BATCH_SIZE, MIN_BATCH_SIZE } from "../constants.js";
import { getArbispotterDb } from "../db/mongo.js";
import { getActiveShops } from "../db/util/shops.js";
import { shopFilter } from "./shopFilter.js";
import { titleAggregation } from "./titles/titleAggregation.js";
import { ProductWithShop } from "../types/products.js";
import { ShopBatches } from "../types/ShopBatches.js";
import { createBatches } from "./createBatchesForShops.js";
import { BatchTaskTypes } from "../types/tasks.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { BATCH_TASK_TYPES } from "../services/productBatchProcessing.js";
import { quantityAggregation } from "./quantities/quantityAggregation.js";

const loggerName = CJ_LOGGER.BATCHES;

export const retrieveProductsForBatchesForShops = async (
  batchTaskType: BatchTaskTypes
): Promise<ShopBatches | null> => {
  const shops = await getActiveShops();
  if (!shops) return null;
  const spotterDb = await getArbispotterDb();
  const activeShops = shops.filter((shop) => shopFilter(shop));
  const products = [];
  const batchShops: string[] = [];
  let limit =
    batchTaskType === BATCH_TASK_TYPES.MATCH_TITLES
      ? BATCH_SIZE * 2
      : BATCH_SIZE;

  let limitPerShop = limit / activeShops.length;
  let remainingShops = activeShops.length;

  const aggregation =
    batchTaskType === BATCH_TASK_TYPES.MATCH_TITLES
      ? titleAggregation
      : quantityAggregation;

  for (let index = 0; index < activeShops.length; index++) {
    if (products.length >= limit) break;

    const shop = activeShops[index];
    try {
      const rawProducts = (await spotterDb
        .collection(shop.d)
        .aggregate(aggregation(limitPerShop))
        .toArray()) as DbProductRecord[];
      if (rawProducts.length === 0) {
        logGlobal(loggerName, `No products found for shop ${shop.d}`);
        remainingShops--;
        if (remainingShops > 0) {
          limitPerShop = Math.floor(limit / remainingShops);
          logGlobal(loggerName, `New limit per shop: ${limitPerShop}`);
        }
        continue;
      } else {
        limit -= rawProducts.length;
        logGlobal(loggerName, `Remaining limit: ${limit}`);
      }
      const productsWithShop = rawProducts.map<ProductWithShop>((product) => {
        return { ...product, shop: shop.d };
      });
      batchShops.push(shop.d);
      products.push(...productsWithShop);
    } catch (error) {
      logGlobal(
        loggerName,
        `Error fetching products for shop ${shop.d}: ${error}`
      );
      continue;
    }
  }

  if (products.length < MIN_BATCH_SIZE) return null;

  const shopBatches = createBatches(products, batchShops, batchTaskType);

  if (!shopBatches || shopBatches.length === 0) return null;

  return [shopBatches[0]];
};
