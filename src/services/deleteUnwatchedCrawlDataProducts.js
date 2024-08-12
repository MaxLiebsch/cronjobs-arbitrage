import { MAX_AGE_PRODUCTS } from "../constants.js";
import {
  deleteCrawlDataProducts,
  findCrawlDataProducts,
  insertCrawlDataProducts,
} from "./db/util/crudCrawlDataProduct.js";
import { getActiveShops } from "./db/util/shops.js";

export const deleteUnwatchedCrawlDataProducts = async () => {
  const activeShops = await getActiveShops();
  activeShops.push({ d: "sales" });

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    while (hasMoreProducts) {
      const products = await findCrawlDataProducts(
        shop.d,
        {
          // Find products that have not been updated in the last 21 days
          updatedAt: {
            $lt: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * MAX_AGE_PRODUCTS
            ).toISOString(),
          },
        },
        batchSize
      );
      if (products.length) {
        console.log(
          `Deleting ${products.length} unwatched products for shop ${shop.d}`
        );
        await insertCrawlDataProducts(
          "grave",
          products.map((product) => ({
            ...product,
            deletedAt: new Date().toISOString(),
          }))
        );
        await deleteCrawlDataProducts(shop.d, {
          _id: { $in: products.map((product) => product._id) },
        });
      } else {
        console.log(`No unwatched products found for shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};
