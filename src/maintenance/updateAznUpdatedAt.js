import {
  findProducts,
  updateProduct,
} from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";

const updateAznUpdatedAt = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    let completed = 0;
    while (hasMoreProducts) {
      const products = await findProducts(
        shop.d,
        {
          aznUpdatedAt: { $exists: false },
          a_prc: { $exists: true },
          updatedAt: {$exists: true}
        },
        batchSize
      );
      if (products.length) {
        await Promise.all(
          products.map((p) => {
            completed++;
            return updateProduct(shop.d, p.lnk, { aznUpdatedAt: p.updatedAt });
          })
        );
        console.log(`Updated aznUpdatedAt in ${completed} products for ${shop.d}`);
      } else {
        console.log(`No updates needed in shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};

updateAznUpdatedAt().then((r) => {
  process.exit(0);
});
