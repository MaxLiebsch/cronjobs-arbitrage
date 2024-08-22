import pkg from "lodash";
const { get } = pkg;
import { keepaProperties } from "../constants.js";
import { upsertAsin } from "../services/db/util/asinTable.js";
import {
  findArbispotterProduct,
  updateProductWithQuery,
} from "../services/db/util/crudArbispotterProduct.js";
import { calculateMonthlySales } from "@dipmaxtech/clr-pkg";

export const asinKeepa = async ({ shopDomain, asin, _id, analysis }) => {
  const result = {};
  keepaProperties.forEach((property) => {
    const key = property.name
      ? property.name
      : property.key.replace("products[0].", "");

    result[key] = get(analysis, property.key, null);
  });

  if (asin) {
    await upsertAsin(asin, result["k_eanList"] ?? []);
  }

  if (result["monthlySold"] === null) {
    const product = await findArbispotterProduct(shopDomain, { _id });
    const { salesRanks, categories, categoryTree } = result;
    if (product && salesRanks && categories && categoryTree) {
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

  await updateProductWithQuery(
    shopDomain,
    { _id },
    {
      $set: {
        ...result,
        keepaUpdatedAt: new Date().toISOString(),
      },
      $unset: {
        keepa_lckd: "",
      },
    }
  );
};
