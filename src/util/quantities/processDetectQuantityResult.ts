import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
  DbProductRecord,
  findMappedCategory,
  ObjectId,
  roundToTwoDecimals,
  safeJSONParse,
} from "@dipmaxtech/clr-pkg";
import { BulkWrite } from "../../types/BulkTypes.js";
import { cleanScore } from "../cleanScore.js";
import { MINIMAL_QUANTITY_SCORE } from "../../constants.js";

export function processDetectQuantityResult(
  spotterSet: Partial<DbProductRecord>,
  result: any,
  products: DbProductRecord[],
  bulkSpotterUpdates: BulkWrite[]
) {
  const productId = result.custom_id.split("-")[1].trim() as string;

  const product = products.find(
    (product) => product._id.toString() === productId
  );

  if (!product) {
    return "Product not found in spotterDb";
  }

  if (!productId || !ObjectId.isValid(productId)) {
    return "Invalid product id";
  }

  const content = result.response.body?.choices[0].message.content;

  if (!content) return "No content found";

  const {
    e_prc: eSellPrice,
    prc: buyPrice,
    a_prc: aSellPrice,
    ebyCategories,
    costs,
    a_vrfd,
    _id,
    e_vrfd,
  } = product;

  const update = safeJSONParse(content) as {
    a_nm?: string;
    e_nm?: string;
    nm?: string;
    nm_score?: string | number;
    a_score?: string | number;
    e_score?: string | number;
  };

  if (!update) return "No update found";

  const set: Partial<DbProductRecord> = {};

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
    const nmScore = cleanScore(update.nm_score!);
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
    const aScore = cleanScore(update.a_score!);
    if (aScore < MINIMAL_QUANTITY_SCORE) {
      // score too bad
    } else if (!isNaN(aScore)) {
      if (aSellQty && aSellPrice && costs && aSellQty > 0) {
        spotterSet["a_uprc"] = roundToTwoDecimals(aSellPrice / aSellQty);

        const factor = aSellQty / buyQty!;
        const arbitrage = calculateAznArbitrage(
          buyPrice * factor, // prc * (a_qty / qty), // EK
          aSellPrice, // a_prc, // VK
          product.costs!,
          product?.tax
        );
        Object.entries(arbitrage).forEach(([key, value]) => {
          (spotterSet as any)[key] = value;
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
    const eScore = cleanScore(update.e_score!);
    if (eScore < MINIMAL_QUANTITY_SCORE) {
      // score too bad
    } else if (!isNaN(eScore)) {
      if (
        eSellQty &&
        eSellPrice &&
        ebyCategories &&
        ebyCategories.length > 0 &&
        eSellQty > 0
      ) {
        spotterSet["e_uprc"] = roundToTwoDecimals(product.e_prc! / eSellQty);
        const mappedCategories = findMappedCategory(
          ebyCategories.reduce<number[]>((acc, curr) => {
            acc.push(curr.id);
            return acc;
          }, [])
        );
        const factor = eSellQty / buyQty!;
        if (mappedCategories) {
          const arbitrage = calculateEbyArbitrage(
            mappedCategories,
            eSellPrice, //VK
            buyPrice * factor // prc * (e_qty / qty) //EK  //QTY Zielshop/QTY Herkunftsshop
          );
          if (arbitrage)
            Object.entries(arbitrage).forEach(([key, value]) => {
              (spotterSet as any)[key] = value;
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
      filter: { _id: new ObjectId(productId) },
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
  return "processed";
}
