import pkg from "lodash";
const { get, setWith } = pkg;
import { keepaProperties } from "../constants.js";
import { KeepaProperties, reduceSalesRankArray } from "@dipmaxtech/clr-pkg";
import { KeepaResponse } from "../types/KeepaResponse.js";

export const buildKeepaResult = (analysis: KeepaResponse) => {
  let result: Partial<KeepaProperties> = {};

  const { products } = analysis;
  const { salesRanks, csv } = products[0];
  const [ahstprcs, anhstprcs, auhstprcs] = csv || [[], [], []];

  keepaProperties.forEach((property) => {
    const key = (
      property.name ? property.name : property.key.replace("products[0].", "")
    ) as keyof KeepaProperties;
    const value = get(analysis, property.key, undefined);

    if (value && value !== null && value !== -1) {
      if (property.name === "costs.ktpt") {
        const keepaFbaPickAndPackFee = (Number(value) - 0.25).toString();
        setWith(result, key, keepaFbaPickAndPackFee, Object);
      } else {
        setWith(result, key, value, Object);
      }
    }
  });

  if (result.salesRanks) {
    const _salesRanks: { [key: string]: number[][] } = {};
    Object.entries<number[]>(salesRanks).forEach(([key, value]) => {
      if (value.length > 2) {
        _salesRanks[key] = reduceSalesRankArray(value);
      }
    });
    if (Object.keys(_salesRanks).length > 0) {
      result.salesRanks = _salesRanks;
    } else {
      delete result.salesRanks;
    }
  }

  if (result.ahstprcs) {
    if (result.ahstprcs.length > 2) {
      result.ahstprcs = reduceSalesRankArray(ahstprcs);
    } else {
      delete result.ahstprcs;
    }
  }
  if (result.auhstprcs) {
    if (result.auhstprcs.length > 2) {
      result.auhstprcs = reduceSalesRankArray(auhstprcs);
    } else {
      delete result.auhstprcs;
    }
  }
  if (result.anhstprcs) {
    if (result.anhstprcs.length > 2) {
      result.anhstprcs = reduceSalesRankArray(anhstprcs);
    } else {
      delete result.anhstprcs;
    }
  }

  return result;
};
