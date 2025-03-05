import axios, { AxiosError, AxiosResponse } from "axios";
import { keepaProductSearchParams } from "../constants.js";
import { keepaFallbackResetQuery } from "../db/queries.js";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { KeepaQueueResponse } from "../model/implementations/keepaQueue.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { ProductWithTask } from "../types/products.js";
import { keepaEanProps } from "./keepaProps.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { processKeepaResult, processMissingKeepaResult } from "./processKeepaResult.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function makeRequestsForEan(
  product: ProductWithTask
): Promise<KeepaQueueResponse> {
  const { _id: productId, sdmn } = product;
  const ean = product.eanList[0];

  if (!ean) {
    const result = await updateProductWithQuery(
      productId,
      keepaFallbackResetQuery
    );
    logGlobal(
      loggerName,
      `No EAN found for product with ID: ${productId}, ${
        result && result.modifiedCount
      }`
    );
    return { success: false, product: product };
  }
  try {
    const response = await axios.get<any, AxiosResponse<KeepaResponse, any>>(
      `${process.env.KEEPA_URL}/product?key=${
        process.env.KEEPA_API_KEY
      }&code=${ean}&${keepaProductSearchParams.join("&")}`
    );

    if (
      response.status === 200 &&
      response.data.error === undefined &&
      response.data.products.length > 0 &&
      response.data.products[0].asin
    ) {
      console.log(`Request for EAN: ${ean} - ${sdmn}`);
      await processKeepaResult({
        product,
        analysis: response.data,
        asin: response.data.products[0].asin,
        props: keepaEanProps,
      });
    } else {
      const result = await updateProductWithQuery(productId, {
        ...keepaFallbackResetQuery,
        $set: {
          ...keepaFallbackResetQuery.$set,
          info_prop: "not_found",
        },
      });

      const sameProductCnt = await processMissingKeepaResult(product, {
        ...keepaFallbackResetQuery.$set,
        info_prop: "not_found",
      });

      logGlobal(
        loggerName,
        `Request for EAN: ${ean} - ${sdmn} failed with status ${
          response.status
        } - ${result && result.modifiedCount} - ${sameProductCnt} other products updated`
      );
    }
    return { success: true, data: response.data };
  } catch (error) {
    if (error instanceof AxiosError) {
      logGlobal(
        loggerName,
        `Error for EAN: ${ean} - ${sdmn}, ${error.status}, ${error.message}`
      );
      if (error.response?.data) {
        return {
          success: false,
          product: product,
          data: error.response.data,
        };
      } else {
        logGlobal(loggerName, `Error for EAN: ${ean} - ${sdmn}, ${error}`);
        return { success: false, product: product };
      }
    } else {
      logGlobal(loggerName, `Error for EAN: ${ean} - ${sdmn}, ${error}`);
    }
    return { success: false, product: product };
  }
}
