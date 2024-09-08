import pkg from "lodash";
const { get } = pkg;
import { keepaProperties } from "../constants.js";
import { reduceSalesRankArray } from "@dipmaxtech/clr-pkg";

export const buildKeepaResult = (analysis) => {
  let result = {};
  keepaProperties.forEach((property) => {
    const key = property.name
      ? property.name
      : property.key.replace("products[0].", "");

    result[key] = get(analysis, property.key, null);
  });

  if (result.salesRanks) {
    const _salesRanks = {};
    Object.entries(result.salesRanks).forEach(([key, value]) => {
      if (value.length > 2) {
        _salesRanks[key] = reduceSalesRankArray(value);
      }
    });
    if (Object.keys(_salesRanks).length > 0) {
      result.salesRanks = _salesRanks;
    } else {
      //@ts-ignore
      delete result.salesRanks;
    }
  }

  if (result.ahstprcs) {
    if (result.ahstprcs.length > 2) {
      result.ahstprcs = reduceSalesRankArray(result.ahstprcs);
    } else {
      delete result.ahstprcs;
    }
  }
  if (result.auhstprcs) {
    if (result.auhstprcs.length > 2) {
      result.auhstprcs = reduceSalesRankArray(result.auhstprcs);
    } else {
      delete result.auhstprcs;
    }
  }
  if (result.anhstprcs) {
    if (result.anhstprcs.length > 2) {
      result.anhstprcs = reduceSalesRankArray(result.anhstprcs);
    } else {
      delete result.anhstprcs;
    }
  }

  return result;
};
