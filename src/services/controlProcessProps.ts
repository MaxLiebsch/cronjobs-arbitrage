import { MongoBulkWriteError } from "@dipmaxtech/clr-pkg";
import { MAX_AGE_PROPS } from "../constants.js";
import { getArbispotterDb } from "../db/mongo.js";
import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";
import { BulkWrite } from "../types/BulkTypes.js";
import { CJ_LOGGER, logGlobal } from "../util/logger.js";

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
  const loggerName = CJ_LOGGER.PROCESS_PROPS;
  logGlobal(loggerName, "Control process props");
  const activeShops = await getActiveShops();
  if (!activeShops) return;
  const spotter = await getArbispotterDb();
  const lt = new Date(
    Date.now() - 1000 * 60 * 60 * 24 * MAX_AGE_PROPS
  ).toISOString();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    let cnt = 0;
    while (hasMoreProducts) {
      const bulkWrites = [];
      const products = await findArbispotterProducts(
        shop.d,
        {
          $or: [
            {
              "costs.azn": { $lte: 0.3 },
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
        cnt += products.length;
        logGlobal(
          loggerName,
          `Processing ${products.length} products for shop ${shop.d}`
        );
        let _i = 60;
        for (const product of products) {
          const { _id, ean_prop, info_prop, cat_prop, eby_prop, costs } =
            product;
          const spotterBulk: BulkWrite = {
            updateOne: {
              filter: { _id: _id },
              update: { $unset: {} },
            },
          };
          if (
            (info_prop && infoPropInvalids.includes(info_prop)) ||
            (costs && costs?.azn <= 0.3)
          ) {
            spotterBulk.updateOne.update.$unset.info_prop = "";
            spotterBulk.updateOne.update.$unset.infoUpdatedAt = "";
          }
          if (cat_prop && catPropInvalids.includes(cat_prop)) {
            spotterBulk.updateOne.update.$unset.cat_prop = "";
            spotterBulk.updateOne.update.$unset.catUpdatedAt = "";
          }
          if (ean_prop && eanPropInvalids.includes(ean_prop)) {
            spotterBulk.updateOne.update.$unset.ean_prop = "";
            spotterBulk.updateOne.update.$unset.eanUpdatedAt = "";
          }
          if (eby_prop && ebyPropInvalids.includes(eby_prop)) {
            spotterBulk.updateOne.update.$unset.eby_prop = "";
            spotterBulk.updateOne.update.$unset.qEbyUpdatedAt = "";
          }
          bulkWrites.push(spotterBulk);
        }
        try {
          const result = await spotter.collection(shop.d).bulkWrite(bulkWrites);
          logGlobal(
            loggerName,
            `Processed ${result.modifiedCount}/${products.length} products`
          );
        } catch (error) {
          if (error instanceof MongoBulkWriteError)
            logGlobal(
              loggerName,
              `Error in bulkWrite ${shop.d} ${error.message}`
            );
        }
      } else {
        logGlobal(loggerName, `No props updates needed ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
    logGlobal(
      loggerName,
      `Finished processing ${cnt} products for shop ${shop.d}`
    );
  }

  logGlobal(loggerName, "Finished control process props");
};
