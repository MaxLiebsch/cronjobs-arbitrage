import {
  calculateAznArbitrage,
  calculateMonthlySales,
  DbProductRecord,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { upsertAsin } from "../db/util/asinTable.js";
import { buildKeepaResult } from "./buildKeepaResult.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export const processKeepaResult = async ({
  asin,
  _id: productId,
  analysis,
  a_prc,
  prc,
  a_qty,
  costs,
  tax,
  qty,
  props,
}: DbProductRecord & {
  analysis: KeepaResponse;
  props: {
    lock: string;
    updatedAt: "keepaEanUpdatedAt" | "keepaUpdatedAt";
    unset: any;
  };
}) => {
  const result = buildKeepaResult(analysis);

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

  if (result["monthlySold"] === null) {
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
    [props.updatedAt]: new Date().toISOString(),
  };

  const arbitrageCanBeCalculated =
    a_prc !== undefined && a_prc >= 0 && a_qty && costs && qty;

  if (avgPrice && avgPrice > 0 && arbitrageCanBeCalculated) {
    const _avgPrice = roundToTwoDecimals(avgPrice / 100);
    if (a_prc < _avgPrice) {
      // Use current price for arbitrage calculation if the current price is lower than the average price
      const arbitrage = calculateAznArbitrage(
        prc * (a_qty / qty),
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
          a_uprc: roundToTwoDecimals(_avgPrice / a_qty),
        };
      }
    } else {
      // Use the price from the product for arbitrage calculation if the current price is higher than the average price
      const arbitrage = calculateAznArbitrage(
        prc * (a_qty / qty),
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

  const productUpdated = await updateProductWithQuery(productId, {
    $set: {
      ...set,
    },
    $unset: props.unset,
  });
  logGlobal(
    loggerName,
    `Updated product: ${asin} - Updated: ${productUpdated?.modifiedCount} product.`
  );
};
