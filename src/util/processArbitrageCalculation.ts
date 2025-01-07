import {
  calculateAznArbitrage,
  calculatePriceRatio,
  Costs,
  DbProductRecord,
  determineAdjustedSellPrice,
  getAznAvgPrice,
} from "@dipmaxtech/clr-pkg";
import {
  DEFAULT_TRANSPORT_FEE,
  JAN_SEPT_M3_FEE,
  OCT_DEC_M3_FEE,
} from "../constants.js";
import { calculateFBAStorage } from "./calculateFBAStorageFee.js";
import {
  getPackageSize,
  retrieveTransportFee,
} from "./calculateTransportFee.js";

export function processArbitrageCalc(
  product: DbProductRecord,
  costs: Costs,
  estimated: boolean = false
) {
  let { prc, a_qty, qty, a_prc, tax, pwhd } = product;

  a_qty = a_qty || 1;
  const {
    avgPrice,
    a_useCurrPrice,
    a_prc: newSellPrice,
    a_uprc: newSellUPrice,
  } = determineAdjustedSellPrice(product, a_prc || 1);

  if (estimated) {
    costs.estmtd = true;
  } else {
    costs.estmtd = false;
  }

  if (costs.tpt === 0) {
    if (pwhd) {
      const { width, height, length, weight } = pwhd;
      if (width && height && length && weight) {
        const size = getPackageSize(pwhd);
        if (size) {
          costs.tpt = retrieveTransportFee(size, pwhd.weight!, "DE");
        }
      }
    } else {
      costs.dfltTpt = true;
      costs.tpt = DEFAULT_TRANSPORT_FEE;
    }
  } else {
    costs.dfltTpt = false;
  }

  if (costs.strg_1_hy === 0 || costs.strg_2_hy === 0) {
    if (pwhd) {
      const { width, height, length } = pwhd;
      if (width && height && length) {
        costs.strg_1_hy = calculateFBAStorage(
          pwhd,
          JAN_SEPT_M3_FEE
        ).monthlyStorageCost;
        costs.strg_2_hy = calculateFBAStorage(
          pwhd,
          OCT_DEC_M3_FEE
        ).monthlyStorageCost;
      }
    }
    costs.noStrgFee = true;
  } else {
    costs.noStrgFee = false;
  }

  const arbitrage = calculateAznArbitrage(
    calculatePriceRatio(prc, a_qty, qty),
    a_useCurrPrice ? newSellPrice : avgPrice,
    costs,
    tax
  );

  return {
    a_prc: newSellPrice,
    a_uprc: newSellUPrice,
    a_qty,
    a_useCurrPrice,
    costs,
    ...arbitrage,
  };
}
