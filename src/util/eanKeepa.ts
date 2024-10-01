import { calculateMonthlySales, ObjectId } from "@dipmaxtech/clr-pkg";
import {
  findArbispotterProduct,
  updateProductWithQuery,
} from "../db/util/crudProducts.js";
import { upsertAsin } from "../db/util/asinTable.js";
import { buildKeepaResult } from "./buildKeepaResult.js";

export const eanKeepa = async ({
  shopDomain,
  asin,
  _id,
  analysis,
}: {
  _id: ObjectId;
  shopDomain: string;
  asin: string;
  analysis: any;
}) => {
  const result = buildKeepaResult(analysis);

  if (asin) {
    await upsertAsin(asin, result["k_eanList"] ?? []);
  }

  if (result["monthlySold"] === null) {
    const product = await findArbispotterProduct(_id);
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

  await updateProductWithQuery(_id, {
    $set: {
      ...result,
      keepaEanUpdatedAt: new Date().toISOString(),
    },
    $unset: {
      keepaEan_lckd: "",
      info_prop: "",
      infoUpdatedAt: "",
    },
  });
};
