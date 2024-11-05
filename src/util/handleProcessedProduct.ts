import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { processProduct } from "./processProduct.js";
import {
  updateProducts,
  updateProductWithQuery,
} from "../db/util/crudProducts.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
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
    $set: {
      ...result.update,
      info_prop,
      infoUpdatedAt: new Date().toISOString(),
    },
  };
  const updateResult = await updateProductWithQuery(product._id, update);
  logGlobal(
    loggerName,
    product.asin + " Updated: " + updateResult?.modifiedCount
  );
  if (product?.asin) {
    await updateProducts({ asin: product.asin }, update);
  }
}
