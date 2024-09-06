import { MongoBulkWriteError, ObjectId } from "mongodb";
import { MINIMAL_QUANTITY_SCORE } from "../../constants.js";
import { getArbispotterDb, getCrawlDataDb } from "../../services/db/mongo.js";
import { safeJSONParse } from "../safeParseJson.js";
import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
  findMappedCategory,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { cleanScore } from "../titles/processResultsForShops.js";
import { TASK_TYPES } from "../../services/productBatchProcessing.js";

export const processResultsForShops = async (fileContents, batchData) => {
  const { batchId } = batchData;
  const results = fileContents
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean);

  const crawlDataDb = await getCrawlDataDb();
  const spotterDb = await getArbispotterDb();
  const bulkSpotterUpdates = [];
  const batchMap = new Map();
  results.forEach((result) => {
    const shopDomain = result.custom_id.split("-")[0];
    if (!batchMap.has(shopDomain)) {
      batchMap.set(shopDomain, []);
    }
    batchMap.get(shopDomain).push(result);
  });

  await Promise.all([
    batchMap.forEach(async (results, shopDomain) => {
      const ids = results.map((result) => result.custom_id.split("-")[1]);
      const products = await spotterDb
        .collection(shopDomain)
        .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
        .toArray();

      if (products.length) {
        for (let index = 0; index < results.length; index++) {
          const set = {};
          const spotterSet = {};
          const result = results[index];
          const id = result.custom_id.split("-")[1];

          const product = products.find(
            (product) => product._id.toString() === id
          );

          if (!product) continue;

          const content = result.response.body?.choices[0].message.content;
          const {
            e_prc: eSellPrice,
            prc: buyPrice,
            a_prc: aSellPrice,
            ebyCategories,
            costs,
            a_vrfd,
            e_vrfd,
          } = product;

          if (!content) continue;

          const update = safeJSONParse(content);
          if (!update) continue;

          Object.entries(update).forEach(([key, value]) => {
            let qty = Number(value);
            if (qty) {
              if (qty === 0) qty = 1;
              if (key === "a_nm") {
                set["a_qty"] = qty;
              }
              if (key === "e_nm") {
                set["e_qty"] = qty;
              }
              if (key === "nm") {
                set["qty"] = qty;
              }
            }
          });

          const { a_qty: aSellQty, e_qty: eSellQty, qty: buyQty } = set;

          if (buyQty && buyQty > 0) {
            spotterSet["uprc"] = roundToTwoDecimals(product.prc / buyQty);
          } else {
            spotterSet["uprc"] = product.prc;
            set["qty"] = 1;
          }
          let qty_prop = "complete";
          if ("nm_score" in update) {
            const nmScore = cleanScore(update.nm_score);
            if (nmScore < MINIMAL_QUANTITY_SCORE) {
              //to low score
            } else if (!isNaN(nmScore)) {
              spotterSet["nm_vrfd"] = {
                qty_prop,
                qty_score: nmScore,
              };
            }
          }

          if ("a_score" in update) {
            const aScore = cleanScore(update.a_score);
            if (aScore < MINIMAL_QUANTITY_SCORE) {
              // score too bad
            } else if (!isNaN(aScore)) {
              if (aSellQty && aSellPrice && costs && aSellQty > 0) {
                spotterSet["a_uprc"] = roundToTwoDecimals(
                  aSellPrice / aSellQty
                );

                const factor = aSellQty / buyQty;
                const arbitrage = calculateAznArbitrage(
                  buyPrice * factor, // prc * (a_qty / qty), // EK
                  aSellPrice, // a_prc, // VK
                  product.costs,
                  product?.tax
                );
                Object.entries(arbitrage).forEach(([key, value]) => {
                  spotterSet[key] = value;
                });
              }
              spotterSet["a_vrfd"] = {
                ...a_vrfd,
                qty_prop,
                qty_score: aScore,
              };
            }
          }

          if ("e_score" in update) {
            const eScore = cleanScore(update.e_score);
            if (eScore < MINIMAL_QUANTITY_SCORE) {
              // score too bad
            } else if (!isNaN(eScore)) {
              if (
                eSellQty &&
                eSellPrice &&
                ebyCategories?.length > 0 &&
                eSellQty > 0
              ) {
                spotterSet["e_uprc"] = roundToTwoDecimals(
                  product.e_prc / eSellQty
                );
                const mappedCategories = findMappedCategory(
                  product.ebyCategories.reduce((acc, curr) => {
                    acc.push(curr.id);
                    return acc;
                  }, [])
                );
                const factor = eSellQty / buyQty;
                if (mappedCategories) {
                  const arbitrage = calculateEbyArbitrage(
                    mappedCategories,
                    eSellPrice, //VK
                    buyPrice * factor // prc * (e_qty / qty) //EK  //QTY Zielshop/QTY Herkunftsshop
                  );
                  if (arbitrage)
                    Object.entries(arbitrage).forEach(([key, value]) => {
                      spotterSet[key] = value;
                    });
                }
              }
              spotterSet["e_vrfd"] = {
                ...e_vrfd,
                qty_prop,
                qty_score: eScore,
              };
            }
          }
          bulkSpotterUpdates.push({
            updateOne: {
              filter: { _id: new ObjectId(id) },
              update: {
                $set: {
                  ...set,
                  ...spotterSet,
                  qty_updatedAt: new Date().toISOString(),
                },
                $unset: {
                  qty_batchId: "",
                  qty_prop: "",
                },
              },
            },
          });
        }
        try {
          await spotterDb.collection(shopDomain).bulkWrite(bulkSpotterUpdates);
        } catch (error) {
          console.error({
            name: "Error updating spotterDb: ",
            stack: `${error}`,
          });
          if (error instanceof MongoBulkWriteError) {
            console.log({
              name: "Mongo",
              error: JSON.stringify(error.writeErrors, null, 2),
            });
          }
        }
      }
    }),
  ]);

  const tasksCol = crawlDataDb.collection("tasks");
  await tasksCol.updateOne(
    { type: TASK_TYPES.DETECT_QUANTITY, "batches.batchId": batchId },
    {
      $pull: {
        batches: { batchId },
      },
    }
  );
};
