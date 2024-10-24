import axios, { AxiosError, AxiosResponse } from "axios";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { processKeepaResult } from "./processKeepaResult.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { sleep } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { keepaEanProps } from "./keepaProps.js";
import { keepaFallbackResetQuery } from "../db/queries.js";
import { ProductWithTask } from "../types/products.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function makeRequestsForEan(product: ProductWithTask) {
  const { _id: productId, sdmn } = product;
  const ean = product.ean || product.eanList?.[0];

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
    return;
  }
  try {
    const response = await axios.get<any, AxiosResponse<KeepaResponse, any>>(
      `${process.env.KEEPA_URL}/product?key=${process.env.KEEPA_API_KEY}&domain=3&code=${ean}&stats=90&history=1&days=90`
    );

    if (
      response.status === 200 &&
      response.data.error === undefined &&
      response.data.products.length > 0 &&
      response.data.products[0].asin
    ) {
      console.log(`Request for EAN: ${ean} - ${sdmn}`);
      await processKeepaResult({
        ...product,
        analysis: response.data,
        asin: response.data.products[0].asin,
        props: keepaEanProps,
      });
    } else {
      const result = await updateProductWithQuery(
        productId,
        keepaFallbackResetQuery
      );

      logGlobal(
        loggerName,
        `Request for EAN: ${ean} - ${sdmn} failed with status ${
          response.status
        } - ${result && result.modifiedCount}`
      );
    }
  } catch (error) {
    await updateProductWithQuery(productId, {
      $unset: {
        keepaEan_lckd: "",
      },
    });
    if (error instanceof AxiosError) {
      logGlobal(
        loggerName,
        `Error for EAN: ${ean} - ${sdmn}, ${error.status}, ${error.message}`
      );
      if (error.status === 429) {
        logGlobal(loggerName, "Rate limit reached. Waiting for 60 seconds...");
        await sleep(1000 * 10); // Wait for 10 seconds
        logGlobal(loggerName, "Resuming...");
      }
    } else {
      logGlobal(loggerName, `Error for EAN: ${ean} - ${sdmn}, ${error}`);
    }
  }
}
