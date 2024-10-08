import { upsertAsin } from "../db/util/asinTable.js";
import {
  findArbispotterProduct,
  updateProductWithQuery,
} from "../db/util/crudProducts.js";
import { calculateMonthlySales, ObjectId } from "@dipmaxtech/clr-pkg";
import { buildKeepaResult } from "./buildKeepaResult.js";
import { KeepaResponse } from "../types/KeepaResponse.js";

export const asinKeepa = async ({
  asin,
  _id,
  analysis,
}: {
  asin: string;
  _id: ObjectId;
  analysis: KeepaResponse;
}) => {
  const result = buildKeepaResult(analysis);

  if (asin) {
    await upsertAsin(asin, result["k_eanList"] ?? []);
  }

  if (result["monthlySold"] === null) {
    const product = await findArbispotterProduct( _id);
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
      keepaUpdatedAt: new Date().toISOString(),
    },
    $unset: {
      keepa_lckd: "",
    },
  });
};
