import {
  findCrawlDataProducts,
  updateCrawlDataProduct,
} from "../db/util/crudCrawlDataProduct.js";
import { getProductCount } from "../db/util/getMatchingProgress.js";
import { getAllShops } from "../db/util/shops.js";

const correctDm = async () => {
  const activeShops = await getAllShops();
  const shop = activeShops.filter((shop) => shop.d === "dm.de")[0];

  const batchSize = 500;
  const total = await getProductCount(shop.d, {
    $or: [{ ean: { $exists: false } }, { ean: { $eq: "" } }],
  });
  let remaining = total;

  const rounds = total > batchSize ? Math.ceil(total / batchSize) : 1;

  for (let index = 0; index < rounds; index++) {
    const products = await findCrawlDataProducts(
      shop.d,
      { $or: [{ ean: { $exists: false } }, { ean: { $eq: "" } }] },
      remaining > batchSize ? batchSize : remaining
    );
    if (products.length) {
      remaining -= products.length;
      await Promise.all(
        products.map(async (p, i) => {
          const ean = p.link.match(new RegExp(shop.ean, "g"));
          if (ean) {
            return await updateCrawlDataProduct(shop.d, p.link, {
              $set: {
                ean: ean[0].replaceAll(/\D/g, ""),
                ean_prop: "found",
                matched: false,
              },
            });
          } else {
            return await updateCrawlDataProduct(shop.d, p.link, {
              $set: {
                ean: "",
                ean_prop: "invalid",
              },
            });
          }
        })
      );
      console.log(`Corrected ${products.length} product's eans in ${shop.d}`);
    } else {
      console.log(`No unwatched products found for shop ${shop.d}`);
    }
  }
};

correctDm().then((r) => {
  console.log("We are done with ean correction!");
  process.exit(0);
});
