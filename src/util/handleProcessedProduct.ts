import {
  calcAznCosts,
  DbProductRecord,
  getAznAvgPrice,
  LookupInfoProps,
  ObjectId,
  recalculateAznMargin,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { processProduct } from "./processProduct.js";
import {
  findProducts,
  updateProductWithQuery,
} from "../db/util/crudProducts.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { getProductsCol } from "../db/mongo.js";
const loggerName = CJ_LOGGER.RECALCULATE;

export async function handleProcessedProduct(
  product: DbProductRecord,
  processingProducts: Set<ObjectId>
) {
  const result = await processProduct({
    product,
    errors: [],
    update: {},
  });

  let info_prop = "complete";

  if (result.errors.length > 0) {
    processingProducts.delete(product._id);
    info_prop = "error";
    console.log("info_prop:", info_prop, result.errors);
    result.update["a_pblsh"] = false;
    result.update["a_errors"] = result.errors;
    logGlobal(
      loggerName,
      product.asin +
        " Errors: " +
        result.errors +
        " Updated:" +
        Object.keys(result.update)
    );
  }

  if (result.errors.length === 0 && Object.keys(result.update).length > 0) {
    if (result.update.a_prc === 1) {
      info_prop = "no_offer";
      result.update["a_pblsh"] = false;
      console.log(product.asin, "info_prop:", info_prop);
    } else {
      result.update["a_pblsh"] = true;
      console.log(
        product.asin,
        " result.update:",
        result.update.a_prc,
        result.update.a_mrgn,
        "info_prop:",
        info_prop
      );
    }
  }

  processingProducts.delete(product._id);

  const update = {
    ...result.update,
    info_prop,
    infoUpdatedAt: new Date().toISOString(),
  };

  if (product.costs) {
    update["costs"] = {
      ...product.costs,
      ...update.costs,
    };
  }

  const updateQuery = {
    $set: {
      ...update,
    },
  };
  const updateResult = await updateProductWithQuery(product._id, updateQuery);
  logGlobal(
    loggerName,
    product.asin + " Updated: " + updateResult?.modifiedCount
  );
  await syncAznListings(
    product._id,
    product.asin,
    product.a_prc || update.a_prc!,
    update
  );
}

const syncAznListings = async (
  productId: ObjectId,
  asin: string | undefined,
  oldListingPrice: number,
  update: Partial<DbProductRecord>
) => {
  const { costs: newCosts, a_prc: newSellPrice } = update;

  if (asin && newCosts && newCosts?.azn > 0 && newSellPrice) {
    const products = await findProducts({
      asin: asin,
      _id: { $ne: productId },
    });
    let bulks: any = [];
    for (const product of products) {
      const { _id, costs, a_prc: existingSellPrice, a_mrgn } = product;
      const isComplete = a_mrgn && existingSellPrice && costs?.azn;

      const info_prop = isComplete
        ? LookupInfoProps.complete
        : update.info_prop;

      let productUpdate: Partial<DbProductRecord> = {};
      if (existingSellPrice) {
        // recalculate azn costs for existing listing
        product["costs"] = {
          ...costs,
          ...newCosts,
        };
        product.a_prc = newSellPrice;
        recalculateAznMargin(product, oldListingPrice, productUpdate);
        productUpdate["costs"] = product["costs"];
        productUpdate = {
          ...productUpdate,
          bsr: update.bsr || product.bsr || [],
          a_qty: update.a_qty || product.a_qty || 1,
          a_pblsh: true,
          ...(update.a_nm && { a_nm: update.a_nm }),
          a_prc: newSellPrice,
          a_uprc: update.a_uprc,
        };
      } else {
        product.costs = newCosts;
        product.a_prc = newSellPrice;
        recalculateAznMargin(product, oldListingPrice, productUpdate);
        const {
          a_rating,
          a_reviewcnt,
          tax,
          a_qty,
          totalOfferCount,
          buyBoxIsAmazon,
        } = update;

        productUpdate = {
          ...productUpdate,
          costs: newCosts,
          a_prc: newSellPrice,
          ...(update.a_uprc && { a_uprc: update.a_uprc }),
          bsr: update.bsr || product.bsr || [],
          a_qty: a_qty || product.a_qty || 1,
          ...(update.a_nm && { a_nm: update.a_nm }),
          ...(update.a_img && { a_img: update.a_img }),
          ...(a_rating && { a_rating: safeParsePrice(a_rating) }),
          ...(a_reviewcnt && { a_reviewcnt: safeParsePrice(a_reviewcnt) }),
          ...(tax && { tax: Number(tax) }),
          ...(totalOfferCount && {
            totalOfferCount,
          }),
          ...(buyBoxIsAmazon !== undefined && {
            buyBoxIsAmazon,
          }),
        };
      }
      if (Object.keys(productUpdate).length > 0) {
        console.log(product.sdmn, "productUpdate:", productUpdate);
        let taskUpdatedProp = "aznUpdatedAt";

        if (update.a_mrgn && update.a_mrgn > 0) {
          taskUpdatedProp = "dealAznUpdatedAt";
        }
        const _update = {
          $set: {
            ...productUpdate,
            info_prop,
            [taskUpdatedProp]: new Date().toISOString(),
            infoUpdatedAt: new Date().toISOString(),
          },
          $unset: { info_taskId: "" },
        };
        bulks.push({ updateOne: { filter: { _id }, update: _update } });
      }
    }
    if (bulks.length > 0) {
      const col = await getProductsCol();
      const result = await col.bulkWrite(bulks);
      logGlobal(
        loggerName,
        `Updated other products: ${asin} ${result.modifiedCount}`
      );
    }
  }
};
