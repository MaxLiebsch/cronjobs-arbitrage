import { calculateMonthlySales } from "@dipmaxtech/clr-pkg";
import {
  findArbispotterProduct,
  updateProductWithQuery,
} from "../services/db/util/crudArbispotterProduct.js";
import { upsertAsin } from "../services/db/util/asinTable.js";
import { buildKeepaResult } from "./buildKeepaResult.js";

export const eanKeepa = async ({ shopDomain, asin, _id, analysis }) => {
  const result = buildKeepaResult(analysis);

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
        keepaEanUpdatedAt: new Date().toISOString(),
      },
      $unset: {
        keepaEan_lckd: "",
        info_prop: "",
        infoUpdatedAt: "",
      },
    }
  );
};
