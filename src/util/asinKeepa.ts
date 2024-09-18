import { upsertAsin } from "../db/util/asinTable.js";
import {
  findArbispotterProduct,
  updateArbispotterProductQuery,
} from "../db/util/crudArbispotterProduct.js";
import { calculateMonthlySales, ObjectId } from "@dipmaxtech/clr-pkg";
import { buildKeepaResult } from "./buildKeepaResult.js";
import { KeepaResponse } from "../types/KeepaResponse.js";

export const asinKeepa = async ({
  shopDomain,
  asin,
  _id,
  analysis,
}: {
  shopDomain: string;
  asin: string;
  _id: ObjectId;
  analysis: KeepaResponse;
}) => {
  const result = buildKeepaResult(analysis);

  if (asin) {
    await upsertAsin(asin, result["k_eanList"] ?? []);
  }

  if (result["monthlySold"] === null) {
    const product = await findArbispotterProduct(shopDomain, _id);
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

  await updateArbispotterProductQuery(shopDomain, _id, {
    $set: {
      ...result,
      keepaUpdatedAt: new Date().toISOString(),
    },
    $unset: {
      keepa_lckd: "",
    },
  });
};
