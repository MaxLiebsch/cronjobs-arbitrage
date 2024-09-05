import { BATCH_SIZE} from "../../constants.js";
import { getArbispotterDb } from "../../services/db/mongo.js";
import { getActiveShops } from "../../services/db/util/shops.js";
import { includeFilter, shopFilter } from "../shopFilter.js";
import { aggregation } from "./aggregation.js";
import { createBatches } from "./createBatchesForShops.js";

export const retrieveProductsForBatchesForShops = async () => {
  const shops = await getActiveShops();
  const spotterDb = await getArbispotterDb();
  const activeShops = shops.filter((shop) => includeFilter(shop));
  const products = [];
  const batchShops = [];
  for (let index = 0; index < activeShops.length; index++) {
    if (products.length >= BATCH_SIZE) break;

    const shop = activeShops[index];
    try {
      const rawProducts = await spotterDb
        .collection(shop.d)
        .aggregate(aggregation) 
        .toArray();
      if (rawProducts.length === 0) continue;
      const productsWithShop = rawProducts.map((product) => {
        return { ...product, shop: shop.d };
      });
      batchShops.push(shop.d);
      products.push(...productsWithShop);
    } catch (error) {
      console.error(`Error fetching products for shop ${shop.d}:`, error);
      continue;
    }
  }

  if (products.length === 0) return null;

  const shopBatches = createBatches(products, batchShops);

  if (!shopBatches || shopBatches.length === 0) return null; 

  return [shopBatches[0]];
};
