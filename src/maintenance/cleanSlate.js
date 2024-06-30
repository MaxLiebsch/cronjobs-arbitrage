import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { findArbispotterProducts } from "../services/db/util/crudArbispotterProduct.js";
import { createOrUpdateCrawlDataProduct } from "../services/db/util/createOrUpdateCrawlDataProduct.js";
import { findCrawlDataProducts } from "../services/db/util/crudCrawlDataProduct.js";
import { createOrUpdateArbispotterProduct } from "../services/db/util/createOrUpdateArbispotterProduct.js";

const cleanSlate = async () => {
  const db = await getCrawlDataDb();
  const spotterDb = await getArbispotterDb();

  const shop = {
    d: "alternate.de",
  };
  let hasMoreProducts = true;
  const batchSize = 500;
  let completed = 0;
  while (hasMoreProducts) {
    const products = await findCrawlDataProducts(
      shop.d + ".products",
      {},
      batchSize
    );
    if (products.length) {
      for (let index = 0; index < products.length; index++) {
        const p = products[index];
        completed++;
        const creation = await createOrUpdateCrawlDataProduct(shop.d, p);
        if (creation.acknowledged) {
          const deletion = await db
            .collection(shop.d + ".products")
            .deleteOne({ _id: p._id });
          if (deletion.acknowledged) {
            console.log(p._id, "moved.");
          }
        }
      }
      console.log(`Moved in ${completed} products for ${shop.d}`);
    } else {
      console.log(`No updates needed in shop ${shop.d}`);
    }
    hasMoreProducts = products.length === batchSize;
  }
  completed = 0;
  while (hasMoreProducts) {
    const products = await findArbispotterProducts(shop.d, {}, batchSize);
    if (products.length) {
      for (let index = 0; index < products.length; index++) {
        const p = products[index];
        completed++;
        const creation = await createOrUpdateArbispotterProduct(
          shop.d + ".tmp",
          p
        );
        if (creation.acknowledged) {
          const deletion = await spotterDb
            .collection(shop.d)
            .deleteOne({ _id: p._id });
          if (deletion.acknowledged) {
            console.log(p._id, "moved.");
          }
        }
      }
      console.log(`Spotter: Moved in ${completed} products for ${shop.d}`);
    } else {
      console.log(`No updates needed in shop ${shop.d}`);
    }
    hasMoreProducts = products.length === batchSize;
  }
};

cleanSlate().then((r) => {
  process.exit(0);
});
