import {
  deleteArbispotterProducts,
  findProducts,
  insertArbispotterProducts,
  updateProduct,
} from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";

const asinRegex = /dp%2F([A-Za-z0-9]{10})%2F|\/dp\/([A-Za-z0-9]{10})/g;

export const parseAsinFromUrl = (url) => {
  try {
    if (url) {
      const match = [...url.matchAll(asinRegex)];
      if (match && match[0]) {
        return match[0][1] || match[0][2];
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

const retrieveAsins = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    let completed = 0;
    while (hasMoreProducts) {
      const products = await findProducts(
        shop.d,
        {
          $and: [{ a_lnk: { $exists: true, $ne: "" } }, { asin: { $eq: "" } }],
        },
        batchSize
      );
      if (products.length) {
        await Promise.all(
          products.map((p) => {
            const asin = parseAsinFromUrl(p.a_lnk);
            if (asin) {
              completed++;
              return updateProduct(shop.d, p.lnk, { asin });
            }
            return Promise.resolve();
          })
        );
        console.log(
          `Retrieved asins in ${completed} products for ${shop.d}`
        );
      } else {
        console.log(`No unwatched products found for shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};

retrieveAsins().then((r) => {
  process.exit(0);
});
