import {
  deleteArbispotterProducts,
  findProducts,
  insertArbispotterProducts,
} from "./db/util/crudArbispotterProduct.js";
import { getActiveShops } from "./db/util/shops.js";

export const deleteUnwatchedProduts = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    while (hasMoreProducts) {
      const products = await findProducts(
        shop.d,
        {
          // Find products that have not been updated in the last 21 days
          updatedAt: {
            $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
          },
        },
        batchSize
      );
      if (products.length) {
        console.log(
          `Deleting ${products.length} unwatched products for shop ${shop.d}`
        );
        await insertArbispotterProducts(
          "grave",
          products.map((product) => ({
            ...product,
            shop: shop.d,
            deletedAt: new Date().toISOString(),
          }))
        );
        await deleteArbispotterProducts(shop.d, {
          _id: { $in: products.map((product) => product._id) },
        });
      } else {
        console.log(`No unwatched products found for shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};
