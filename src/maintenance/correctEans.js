import { updateProduct } from "../services/db/util/crudArbispotterProduct.js";
import {
  findCrawlDataProducts,
  updateCrawledProduct,
} from "../services/db/util/crudCrawlDataProduct.js";
import { getProductCount } from "../services/db/util/getMatchingProgress.js";
import { getActiveShops } from "../services/db/util/shops.js";

const correctEans = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    const batchSize = 500;
    const total = await getProductCount(shop.d + ".products", {
      ean: { $exists: true, $ne: "" },
    });
    let remaining = total;

    const rounds = total > batchSize ? Math.ceil(total / batchSize) : 1;

    for (let index = 0; index < rounds; index++) {
      const products = await findCrawlDataProducts(
        shop.d,
        { ean: { $exists: true, $not: /\b[0-9]{12,13}\b/, $ne: "" } },
        remaining > batchSize ? batchSize : remaining
      );
      if (products.length) {
        remaining -= products.length;
        await Promise.all(
          products.map((p) => {
            return Promise.all([
              updateProduct(shop.d, p.link, { eanList: [] }),
              updateCrawledProduct(shop.d, p.link, {
                $set: { ean: "", ean_prop: "invalid" },
              }),
            ]);
          })
        );
        console.log(`Corrected ${products.length} product's eans in ${shop.d}`);
      } else {
        console.log(`No unwatched products found for shop ${shop.d}`);
      }
    }
  }
};

correctEans().then((r) => {
  console.log("We are done with ean correction!");
  process.exit(0);
});
