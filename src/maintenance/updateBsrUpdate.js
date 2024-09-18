import {
  findProducts,
  updateProduct,
} from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";

const updateBsrUpdateAt = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    let completed = 0;
    while (hasMoreProducts) {
      const products = await findProducts(
        shop.d,
        {
          $and: [
            { bsr: { $exists: true } },
            { bsr: { $elemMatch: { createdAt: { $exists: false } } } },
          ],
        },
        batchSize
      );
      if (products.length) {
        await Promise.all(
          products.map((p) => {
            completed++;
            return updateProduct(shop.d, p.lnk, { "bsr.0.createdAt": p.updatedAt});
          })
        );
        console.log(
          `Updated bsr[0].updatedAt in ${completed} products for ${shop.d}`
        );
      } else {
        console.log(`No updates needed in shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};

updateBsrUpdateAt().then((r) => {
  process.exit(0);
});
