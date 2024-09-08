import pkg from "lodash";
const { get } = pkg;
import { keepaProperties } from "../constants.js";
import { reduceSalesRankArray } from "@dipmaxtech/clr-pkg";

export const buildKeepaResult = (analysis) => {
  const result = {};
  keepaProperties.forEach((property) => {
    const key = property.name
      ? property.name
      : property.key.replace("products[0].", "");

    result[key] = get(analysis, property.key, null);
  });

  if (result.salesRanks) {
    const salesRanks = result.salesRanks;
    Object.entries(salesRanks).forEach(([key, value]) => {
      salesRanks[key] = reduceSalesRankArray(value);
    });
  }

  if (result.ahstprcs && result.ahstprcs.length > 2) {
    result.ahstprcs = reduceSalesRankArray(result.ahstprcs);
  }
  if (result.auhstprcs && result.auhstprcs.length > 2) {
    result.auhstprcs = reduceSalesRankArray(result.auhstprcs);
  }
  if (result.anhstprcs && result.anhstprcs.length > 2) {
    result.anhstprcs = reduceSalesRankArray(result.anhstprcs);
  }

  return result;
};
