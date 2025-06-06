import { updateProduct } from "../db/util/crudArbispotterProduct.js";
import { findCrawlDataProducts } from "../db/util/crudCrawlDataProduct.js";
import { getProductCount } from "../db/util/getMatchingProgress.js";
import { getActiveShops } from "../db/util/shops.js";

const recoverEans = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    const batchSize = 500;
    const total = await getProductCount(shop.d + '.products', {
      ean: { $exists: true, $ne: "" },
    });
    let remaining = total;

    const rounds = total > batchSize ? Math.ceil(total / batchSize) : 1;

    for (let index = 0; index < rounds; index++) {
      const products = await findCrawlDataProducts(
        shop.d,
        { ean: { $exists: true, $ne: "" } },
        remaining > batchSize ? batchSize : remaining
      );
      if (products.length) {
        remaining -= products.length;
        await Promise.all(
          products.map(async (p) => {
            return updateProduct(shop.d, p.link, { eanList: [p.ean] });
          })
        );
        console.log(`Corrected ${products.length} product's eans in ${shop.d}`);
      } else {
        console.log(`No unwatched products found for shop ${shop.d}`);
      }
    }
  }
};

recoverEans().then((r) => {
  console.log("We are done with ean recovery!");
  process.exit(0);
});
