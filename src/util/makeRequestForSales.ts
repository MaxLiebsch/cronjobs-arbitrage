import axios, { AxiosError, AxiosResponse } from "axios";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { processKeepaResult } from "./processKeepaResult.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { sleep } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { keepaProps } from "./keepaProps.js";
import { ProductWithTask } from "../types/products.js";
import { keepaProductSearchParams } from "../constants.js";
import { KeepaQueueResponse } from "../services/keepaQueue.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function makeRequestsForSales(
  product: ProductWithTask
): Promise<KeepaQueueResponse> {
  const { _id: productId, sdmn } = product;
  const ean = product.eanList[0];

  if (!ean) {
    const result = await updateProductWithQuery(productId, {
      $set: {
        ean_prop: "missing",
      },
      $unset: {
        info_prop: "",
        infoUpdatedAt: "",
      },
    });
    logGlobal(
      loggerName,
      `No EAN found for sales product with ID: ${productId}, ${
        result && result.modifiedCount
      }`
    );
    return { success: true, data: undefined };
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
      console.log(`Request for SALE EAN: ${ean} - ${sdmn}`);
      await processKeepaResult({
        product,
        analysis: response.data,
        asin: response.data.products[0].asin,
        props: keepaProps,
      });
    } else {
      const result = await updateProductWithQuery(productId, {
        $set: {
          keepaUpdatedAt: new Date().toISOString(),
        },
      });

      logGlobal(
        loggerName,
        `Request for SALE EAN: ${ean} - ${sdmn} failed with status ${
          response.status
        } - ${result && result.modifiedCount}`
      );
    }
    return { success: true, data: response.data };
  } catch (error) {
    if (error instanceof AxiosError) {
      logGlobal(
        loggerName,
        `Error for SALES EAN: ${ean} - ${sdmn}, ${error.status}, ${error.message}`
      );
      if (error.response?.data) {
        return {
          success: false,
          product: product,
          data: error.response.data,
        };
      } else {
        logGlobal(loggerName, `Error for SALES EAN: ${ean} - ${sdmn}, ${error}`);
        return { success: false, product: product };
      }

    } else {
      logGlobal(loggerName, `Error for SALES EAN: ${ean} - ${sdmn}, ${error}`);
    }
    return { success: false, product: product };
  }
}
