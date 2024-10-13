import { MAX_AGE_PRODUCTS } from "../constants.js";
import { getCrawlDataCollection } from "../db/mongo.js";
import {
  deleteArbispotterProducts,
  findProducts,
  insertProductsToCol,
} from "../db/util/crudProducts.js";
import { getActiveShops } from "../db/util/shops.js";
import { CJ_LOGGER, logGlobal } from "../util/logger.js";

export const deleteUnwatchedProducts = async () => {
  const loggerName = CJ_LOGGER.UNWATCHED_PRODUCTS;
  const graveCol = await getCrawlDataCollection("grave");
  logGlobal(loggerName, "Deleting unwatched products");
  const activeShops = await getActiveShops();
  if (!activeShops) return;

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    while (hasMoreProducts) {
      const products = await findProducts(
        {
          // Find products that have not been updated in the last 14 days
          sdmn: shop.d,
          updatedAt: {
            $lt: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * MAX_AGE_PRODUCTS
            ).toISOString(),
          },
        },
        batchSize
      );
      if (products.length) {
        const existingProducts = await graveCol
          .find({ lnk: { $in: products.map((product) => product.lnk) } })
          .toArray();

        const notExistingProducts = products.filter(
          (product) =>
            !existingProducts.some(
              (existingProduct) => existingProduct.lnk === product.lnk
            )
        );

        const result = await insertProductsToCol(
          "grave",
          notExistingProducts.map((product) => {
            // Remove _id field
            //@ts-ignore
            delete product._id;
            return {
              ...product,
              shop: shop.d,
              deletedAt: new Date().toISOString(),
            };
          })
        );
        const deletedResult = await deleteArbispotterProducts({
          _id: { $in: products.map((product) => product._id) },
        });
        logGlobal(
          loggerName,
          `Moved ${result.insertedCount} products to grave and deleted ${deletedResult.deletedCount} products`
        );
      } else {
        logGlobal(loggerName, `No unwatched products found for shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
  logGlobal(loggerName, "Finished deleting unwatched products");
};
