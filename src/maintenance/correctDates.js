import {
  deleteArbispotterProducts,
  findProducts,
  insertArbispotterProducts,
  updateProduct,
} from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";

const correctDates = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    while (hasMoreProducts) {
      const products = await findProducts(
        shop.d,
        { keepaUpdatedAt: {$type: ['date']} },
        batchSize
      );
      if (products.length) {
        
        await Promise.all(
          products.map((p) => {
            const isoDate = new Date(p.keepaUpdatedAt).toISOString();
            p.keepaUpdatedAt = isoDate;
            return updateProduct(shop.d, p.lnk, { keepaUpdatedAt: isoDate });
          })
        );
        console.log(`Corrected ${products.length} product's iso dates in ${shop.d}`);
      } else {
        console.log(`No unwatched products found for shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};

correctDates().then((r) => {
  process.exit(0);
});
