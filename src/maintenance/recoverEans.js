import {
  updateProduct,
} from "../services/db/util/crudArbispotterProduct.js";
import { findCrawlDataProducts } from "../services/db/util/crudCrawlDataProduct.js";
import { getActiveShops } from "../services/db/util/shops.js";

const recoverEans = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    while (hasMoreProducts) {
      const products = await findCrawlDataProducts(
        shop.d,
        { ean: { $exists: true, $ne: "" } },
        batchSize
      );
      if (products.length) {
        await Promise.all(
          products.map((p) => {
            return updateProduct(shop.d, p.link, { eanList: [p.ean] });
          })
        );
        console.log(
          `Corrected ${products.length} product's eans in ${shop.d}`
        );
      } else {
        console.log(`No unwatched products found for shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};

recoverEans().then((r) => {
  console.log('We are done with ean recovery!');
  process.exit(0);
});
