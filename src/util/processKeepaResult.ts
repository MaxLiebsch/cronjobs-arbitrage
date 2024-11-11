import {
  calculateAznArbitrage,
  calculateMonthlySales,
  DbProductRecord,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import {
  findProducts,
  updateProducts,
  updateProductWithQuery,
} from "../db/util/crudProducts.js";
import { upsertAsin } from "../db/util/asinTable.js";
import { buildKeepaResult } from "./buildKeepaResult.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { ProductWithTask } from "../types/products.js";
import { getProductsCol } from "../db/mongo.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export const processKeepaResult = async ({
  asin,
  _id: productId,
  analysis,
  a_prc,
  prc,
  a_qty,
  taskType,
  eanList,
  costs,
  tax,
  qty,
  props,
}: ProductWithTask & {
  analysis: KeepaResponse;
  props: {
    lock: string;
    updatedAt: "keepaEanUpdatedAt" | "keepaUpdatedAt";
    unset: any;
  };
}) => {
  const result = buildKeepaResult(analysis);
  const col = await getProductsCol();

  const sellQty = a_qty || 1;

  const {
    avg30_ansprcs,
    avg30_ahsprcs,
    avg90_ahsprcs,
    avg90_ansprcs,
    salesRanks,
    categories,
    categoryTree,
  } = result;

  let avgPrice = 0;

  if (avg30_ahsprcs && avg30_ahsprcs > 0) {
    avgPrice = avg30_ahsprcs;
  } else if (avg30_ansprcs && avg30_ansprcs > 0) {
    avgPrice = avg30_ansprcs;
  } else if (avg90_ahsprcs && avg90_ahsprcs > 0) {
    avgPrice = avg90_ahsprcs;
  } else if (avg90_ansprcs && avg90_ansprcs > 0) {
    avgPrice = avg90_ansprcs;
  }

  if (asin) {
    await upsertAsin(asin, result["k_eanList"] ?? []);
  }

  if (!result["monthlySold"]) {
    if (salesRanks && categories && categoryTree) {
      const monthlySold = calculateMonthlySales(
        categories,
        salesRanks,
        categoryTree
      );
      if (monthlySold) {
        result["monthlySold"] = monthlySold;
      }
    }
  }

  let set: { [key in keyof Partial<DbProductRecord>]: any } = {
    ...result,
    a_qty: sellQty,
    costs: {
      ...costs,
      ...result["costs"],
    },
    [props.updatedAt]: new Date().toISOString(),
  };

  const arbitrageCanBeCalculated =
    a_prc !== undefined && a_prc >= 0 && sellQty && costs && qty;

  if (avgPrice && avgPrice > 0 && arbitrageCanBeCalculated) {
    const _avgPrice = roundToTwoDecimals(avgPrice / 100);
    if (a_prc < _avgPrice) {
      // Use current price for arbitrage calculation if the current price is lower than the average price
      const arbitrage = calculateAznArbitrage(
        prc * (sellQty / qty),
        _avgPrice,
        costs,
        tax
      );
      set = {
        ...set,
        ...arbitrage,
        a_useCurrPrice: false,
      };

      if (a_prc === 0) {
        set = {
          ...set,
          a_prc: _avgPrice,
          a_uprc: roundToTwoDecimals(_avgPrice / sellQty),
        };
      }
    } else {
      // Use the price from the product for arbitrage calculation if the current price is higher than the average price
      const arbitrage = calculateAznArbitrage(
        prc * (sellQty / qty),
        a_prc,
        costs,
        tax
      );
      set = {
        ...set,
        ...arbitrage,
        a_useCurrPrice: true,
      };
    }
  }

  let sameProductCnt = 0;
  const bulWrites: any = [];
  if (taskType === "KEEPA_EAN") {
    const _ean = eanList[0];
    const products = await findProducts({
      eanList: _ean,
    });

    for (const product of products) {
      const { _id, costs, a_prc: existingSellPrice, a_mrgn } = product;
      const isComplete = a_mrgn && existingSellPrice && costs?.azn;
      const bulkUpdate = {
        updateOne: {
          filter: { _id: _id },
          update: {
            $set: {
              ...set,
            },
            $unset: {
              keepaEan_lckd: "",
              ...(!isComplete && { info_prop: "", infoUpdatedAt: "" }),
            },
          },
        },
      };
      bulWrites.push(bulkUpdate);
    }
  }

  if (taskType === "KEEPA_NORMAL") {
    const products = await findProducts({
      asin: asin,
    });
    for (const product of products) {
      const { _id } = product;
      const bulkUpdate = {
        updateOne: {
          filter: { _id: _id },
          update: {
            $set: {
              ...set,
            },
            $unset: {
              keepa_lckd: "",
            },
          },
        },
      };
      bulWrites.push(bulkUpdate);
    }
  }
  if (bulWrites.length > 0) {
    const result = await col.bulkWrite(bulWrites);
    sameProductCnt = result.modifiedCount;
  }
  const productUpdated = await updateProductWithQuery(productId, {
    $set: {
      ...set,
    },
    $unset: props.unset,
  });
  logGlobal(
    loggerName,
    `Updated product: ${asin} - Updated: ${productUpdated?.modifiedCount} product. ${sameProductCnt} products updated.`
  );
};
