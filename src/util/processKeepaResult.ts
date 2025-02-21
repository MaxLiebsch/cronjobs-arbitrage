import {
  calculateMonthlySales,
  DbProductRecord,
  determineAdjustedSellPrice,
  recalculateAznMargin,
} from "@dipmaxtech/clr-pkg";
import {
  findProducts,
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
    updatedAt: "keepaUpdatedAt";
    unset: any;
  };
}) => {
  const { analysis, props, product, asin } = processKeepaProps;
  const {
    a_qty,
    costs,
    qty,
    a_prc: newSellPrice,
    _id: productId,
    taskType,
    eanList,
  } = product;

  const result = buildKeepaResult(analysis);
  const col = await getProductsCol();

  const sellQty = a_qty || 1;

  const { a_prc, avgField, avgPrice, a_useCurrPrice } =
    determineAdjustedSellPrice({ ...product, ...result }, newSellPrice || 0);

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
    a_avg_fld: avgField,
    a_avg_price: avgPrice,
    [props.updatedAt]: new Date().toISOString(),
  };

  const arbitrageCanBeCalculated =
    a_prc !== undefined && a_prc >= 0 && sellQty && costs && qty;
  let calucalationPerformed = false;
  if (avgPrice && avgPrice > 0 && arbitrageCanBeCalculated) {
    const newCosts = {
      ...costs,
      ...result["costs"],
    };
    product.costs = newCosts;
    recalculateAznMargin(product, a_prc, set);
    calucalationPerformed = true;
  } else {
    props.unset = {
      ...props.unset,
      info_prop: "",
      infoUpdatedAt: "",
    };
  }

  let sameProductCnt = 0;
  const bulWrites: any = [];

  if (taskType === "KEEPA_SALES") {
    set = {
      ...set,
      a_pblsh: true,
    };
    props.unset = {
      ...props.unset,
      info_prop: "",
      infoUpdatedAt: "",
      keepaEan_lckd: "",
      keepa_lckd: "",
    };
  }

  if (taskType === "KEEPA_WHOLESALE") {
    props.unset = {
      ...props.unset,
      a_status: "",
    };
  }
  if (taskType === "KEEPA_EAN" || taskType === "KEEPA_NEW") {
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
      const isComplete = product?.a_mrgn && product?.costs?.azn;
      const bulkUpdate = {
        updateOne: {
          filter: { _id: _id },
          update: {
            $set: {
              ...set,
            },
            $unset: {
              keepa_lckd: "",
              ...(!isComplete && { info_prop: "", infoUpdatedAt: "" }),
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

  if (calucalationPerformed) {
    delete props.unset.info_prop;
  }

  const productUpdated = await updateProductWithQuery(productId, {
    $set: {
      ...set,
      ...(calucalationPerformed && { info_prop: "complete" }),
    },
    $unset: props.unset,
  });
  logGlobal(
    loggerName,
    `Updated product: ${asin} - Updated: ${productUpdated?.modifiedCount} product. ${sameProductCnt} products updated.`
  );
};
 
export const processMissingKeepaResult = async (product: ProductWithTask, set: any) => {
  const bulWrites: any = [];
  const col = await getProductsCol();
  const { eanList, _id: productId } = product;
  let sameProductCnt = 0;

  const _ean = eanList[0];
  const products = await findProducts({
    eanList: _ean,
    _id: { $ne: productId },
  });

  for (const product of products) {
    const { _id } = product;

    const bulkUpdate = {
      updateOne: {
        filter: { _id: _id },
        update: {
          $set: {
              ...set
          },
        },
      },
    };
    bulWrites.push(bulkUpdate);
  }
  if (bulWrites.length > 0) {
    const result = await col.bulkWrite(bulWrites);
    sameProductCnt = result.modifiedCount;
  }
  return sameProductCnt;
};
