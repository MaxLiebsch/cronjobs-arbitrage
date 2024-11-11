import {
  calcAznCosts,
  calculateAznArbitrage,
  calculateMonthlySales,
  DbProductRecord,
  getAznAvgPrice,
  recalculateAznMargin,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import {
  findProducts,
  updateProducts,
  updateProductWithQuery,
} from "../db/util/crudProducts.js";
import { upsertAsin } from "../db/util/asinTable.js";
import { buildKeepaResult } from "./buildKeepaResult.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { ProductWithTask } from "../types/products.js";
import { getProductsCol } from "../db/mongo.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export const processKeepaResult = async (processKeepaProps: {
  product: ProductWithTask;
  analysis: KeepaResponse;
  asin: string;
  props: {
    lock: string;
    updatedAt: "keepaEanUpdatedAt" | "keepaUpdatedAt";
    unset: any;
  };
}) => {
  const { analysis, props, product, asin } = processKeepaProps;
  const {
    a_qty,
    costs,
    prc,
    tax,
    qty,
    a_prc: newSellPrice,
    _id: productId,
    taskType,
    eanList,
  } = product;

  const result = buildKeepaResult(analysis);
  const col = await getProductsCol();

  const sellQty = a_qty || 1;

  const { a_prc, avgPrice, a_useCurrPrice } = getAznAvgPrice(
    product,
    newSellPrice!
  );

  const { salesRanks, categories, categoryTree } = result;

  if (asin) {
    await upsertAsin(asin, result["k_eanList"] ?? []);
  }

  if (!result["monthlySold"]) {
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
    a_qty: sellQty,
    [props.updatedAt]: new Date().toISOString(),
  };

  const arbitrageCanBeCalculated =
    a_prc !== undefined && a_prc >= 0 && sellQty && costs && qty;

  if (avgPrice && avgPrice > 0 && arbitrageCanBeCalculated) {
    const newCosts = {
      ...costs,
      ...result["costs"],
    };
    product.costs = newCosts;
    recalculateAznMargin(product, a_prc, set);
  }

  let sameProductCnt = 0;
  const bulWrites: any = [];
  if (taskType === "KEEPA_EAN") {
    const _ean = eanList[0];
    const products = await findProducts({
      eanList: _ean,
      _id: { $ne: productId },
    });

    for (const product of products) {
      const {
        _id,
        costs,
        a_prc: existingSellPrice,
        a_mrgn,
        qty: buyQty,
      } = product;
      const isComplete = a_mrgn && existingSellPrice && costs?.azn;
      if (costs && existingSellPrice && buyQty) {
        const newCosts = {
          ...costs,
          ...result["costs"],
        };
        product.costs = newCosts;
        recalculateAznMargin(product, existingSellPrice, set);
      }
      const bulkUpdate = {
        updateOne: {
          filter: { _id: _id },
          update: {
            $set: {
              a_pblsh: true,
              ...set,
            },
            $unset: {
              keepaEan_lckd: "",
              ...(!isComplete && { info_prop: "", infoUpdatedAt: "" }),
            },
          },
        },
      };
      bulWrites.push(bulkUpdate);
    }
  }

  if (taskType === "KEEPA_NORMAL") {
    const products = await findProducts({
      asin: asin,
      _id: { $ne: productId },
    });
    for (const product of products) {
      const { _id, costs, a_prc: existingSellPrice, qty: buyQty } = product;
      if (costs && existingSellPrice && buyQty) {
        const newCosts = {
          ...costs,
          ...result["costs"],
        };
        product.costs = newCosts;
        recalculateAznMargin(product, existingSellPrice, set);
      }
      const bulkUpdate = {
        updateOne: {
          filter: { _id: _id },
          update: {
            $set: {
              ...set,
            },
            $unset: {
              keepa_lckd: "",
            },
          },
        },
      };
      bulWrites.push(bulkUpdate);
    }
  }
  if (bulWrites.length > 0) {
    const result = await col.bulkWrite(bulWrites);
    sameProductCnt = result.modifiedCount;
  }
  const productUpdated = await updateProductWithQuery(productId, {
    $set: {
      ...set,
    },
    $unset: props.unset,
  });
  logGlobal(
    loggerName,
    `Updated product: ${asin} - Updated: ${productUpdated?.modifiedCount} product. ${sameProductCnt} products updated.`
  );
};
