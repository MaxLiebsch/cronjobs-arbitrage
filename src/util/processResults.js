import { MAX_PACKAGE_SIZE } from "../constants.js";
import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { safeJSONParse } from "./safeParseJson.js";
import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
  findMappedCategory,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";

export const processResults = async (fileContents, batchData) => {
  const { shopDomain, batchId } = batchData;
  const results = fileContents
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean);

  const crawlDataDb = await getCrawlDataDb();
  const spotterDb = await getArbispotterDb();
  const bulkCrawlDataUpdates = [];
  const bulkSpotterUpdates = [];
  const hashes = results.map((result) => result.custom_id.split("-")[1]);
  const products = await spotterDb
    .collection(shopDomain)
    .find({ s_hash: { $in: hashes } })
    .toArray();
  if (!products.length)
    throw new Error("No products found for batch ", batchId);

  for (let index = 0; index < results.length; index++) {
    const set = {};
    const spotterSet = {};
    const result = results[index];
    const hash = result.custom_id.split("-")[1];
    const isRetry = result.custom_id.includes("retry");

    const product = products.find((product) => product.s_hash === hash);

    if (!product) continue;

    const content = result.response.body?.choices[0].message.content;
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

    if (
      "qty" in set &&
      set.qty > 0 &&
      (isRetry || set.qty < MAX_PACKAGE_SIZE)
    ) {
      spotterSet["uprc"] = roundToTwoDecimals(product.prc / set["qty"]);
    } else {
      spotterSet["uprc"] = product.prc;
      set["qty"] = 1;
    }

    if (
      "a_qty" in set &&
      "a_prc" in product &&
      "costs" in product &&
      set.a_qty > 0 &&
      (isRetry || set.a_qty < MAX_PACKAGE_SIZE)
    ) {
      spotterSet["a_uprc"] = roundToTwoDecimals(product.a_prc / set["a_qty"]);
      const arbitrage = calculateAznArbitrage(
        spotterSet["uprc"],
        spotterSet["a_uprc"],
        product.costs,
        product?.tax
      );
      Object.entries(arbitrage).forEach(([key, value]) => {
        spotterSet[key] = value;
      });
    }
    if (
      "e_qty" in set &&
      "e_prc" in product &&
      "ebyCategories" in product &&
      product.ebyCategories.length > 0 &&
      set.e_qty > 0 &&
      (isRetry || set.e_qty < MAX_PACKAGE_SIZE)
    ) {
      spotterSet["e_uprc"] = roundToTwoDecimals(product.e_prc / set["e_qty"]);
      const mappedCategories = findMappedCategory(
        product.ebyCategories.reduce((acc, curr) => {
          acc.push(curr.id);
          return acc;
        }, [])
      );
      const arbitrage = calculateEbyArbitrage(
        mappedCategories,
        spotterSet["e_uprc"],
        spotterSet["uprc"]
      );
      Object.entries(arbitrage).forEach(([key, value]) => {
        spotterSet[key] = value;
      });
    }

    let qty_prop = "complete";

    if (
      (set?.qty > MAX_PACKAGE_SIZE ||
        set?.e_qty > MAX_PACKAGE_SIZE ||
        set?.a_qty > MAX_PACKAGE_SIZE) &&
      !isRetry
    ) {
      qty_prop = "retry";
    }
    bulkCrawlDataUpdates.push({
      updateOne: {
        filter: { s_hash: hash },
        update: {
          $set: {
            ...set,
            qty_prop,
            qty_batchId: "",
            qty_updatedAt: new Date().toISOString(),
          },
        },
      },
    });
    // console.log(
    //   "\n\n",
    //   "Nm: " + set?.qty + " " + product?.nm,
    //   "\n",
    //   "A_nm: " + set?.a_qty + " " + product?.a_nm,
    //   "\n",
    //   "E_nm: " + set?.e_qty + " " + product?.e_nm
    // );
    bulkSpotterUpdates.push({
      updateOne: {
        filter: { s_hash: hash },
        update: {
          $set: { ...set, ...spotterSet },
        },
      },
    });
  }
  const tasksCol = crawlDataDb.collection("tasks");
  await tasksCol.updateOne(
    { type: "DETECT_QUANTITY", "batches.batchId": batchId },
    {
      $pull: {
        batches: { batchId },
      },
    }
  );
  await Promise.all([
    crawlDataDb.collection(shopDomain).bulkWrite(bulkCrawlDataUpdates),
    spotterDb.collection(shopDomain).bulkWrite(bulkSpotterUpdates),
  ]);
};
