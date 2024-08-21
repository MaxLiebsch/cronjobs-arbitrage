import { MAX_AGE_PROPS } from "../constants.js";
import { getArbispotterDb } from "./db/mongo.js";
import { findArbispotterProducts } from "./db/util/crudArbispotterProduct.js";
import { getActiveShops } from "./db/util/shops.js";

const catPropInvalids = [
  "missing",
  "timeout",
  "ean_missing",
  "ean_missmatch",
  "categories_missing",
  "category_not_found",
];
const infoPropInvalids = ["missing"];
const ebyPropInvalids = ["missing"];
const eanPropInvalids = ["missing", "invalid", "timeout"];

export const controlProcessProps = async () => {
  const activeShops = await getActiveShops();
  const spotter = await getArbispotterDb();
  activeShops.push({ d: "sales" });
  const lt = new Date(
    Date.now() - 1000 * 60 * 60 * 24 * MAX_AGE_PROPS
  ).toISOString();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    while (hasMoreProducts) {
      const bulkWrites = [];
      const products = await findArbispotterProducts(
        shop.d,
        {
          $or: [
            {
              "costs.azn": { $eq: 0 },
              infoUpdatedAt: { $lt: lt },
            },
            {
              info_prop: { $in: infoPropInvalids },
              infoUpdatedAt: { $lt: lt },
            },
            {
              cat_prop: {
                $in: catPropInvalids,
              },
              catUpdatedAt: { $lt: lt },
            },
            {
              ean_prop: { $in: eanPropInvalids },
              eanUpdatedAt: { $lt: lt },
            },
            {
              eby_prop: { $in: ebyPropInvalids },
              qEbyUpdatedAt: { $lt: lt },
            },
          ],
        },
        batchSize
      );
      if (products.length) {
        let _i = 60;
        for (const product of products) {
          const { _id, ean_prop, info_prop, cat_prop, eby_prop, costs } =
            product;
          const spotterBulk = {
            updateOne: {
              filter: { _id: _id },
              update: { $unset: {} },
            },
          };
          if (infoPropInvalids.includes(info_prop) || costs?.azn === 0) {
            spotterBulk.updateOne.update.$unset.info_prop = "";
            spotterBulk.updateOne.update.$unset.infoUpdatedAt = "";
          }
          if (catPropInvalids.includes(cat_prop)) {
            spotterBulk.updateOne.update.$unset.cat_prop = "";
            spotterBulk.updateOne.update.$unset.catUpdatedAt = "";
          }
          if (eanPropInvalids.includes(ean_prop)) {
            spotterBulk.updateOne.update.$unset.ean_prop = "";
            spotterBulk.updateOne.update.$unset.eanUpdatedAt = "";
          }
          if (ebyPropInvalids.includes(eby_prop)) {
            spotterBulk.updateOne.update.$unset.eby_prop = "";
            spotterBulk.updateOne.update.$unset.qEbyUpdatedAt = "";
          }
          bulkWrites.push(spotterBulk);
        }
        console.log("Updates: ", bulkWrites.length, " Shop: ", shop.d);
        // console.log(JSON.stringify(bulkWrites[_i], null, 2));
        await spotter.collection(shop.d).bulkWrite(bulkWrites);
      } else {
        console.log(`No props updates needed ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};
