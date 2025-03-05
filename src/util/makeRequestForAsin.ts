import axios, { AxiosError, AxiosResponse } from "axios";
import { keepaProductSearchParams } from "../constants.js";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { KeepaQueueResponse } from "../model/implementations/keepaQueue.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { ProductWithTask } from "../types/products.js";
import { keepaProps } from "./keepaProps.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import {
  processKeepaResult,
  processMissingKeepaResult,
} from "./processKeepaResult.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

// Function to make two requests for each ID
export async function makeRequestsForAsin(
  product: ProductWithTask
): Promise<KeepaQueueResponse> {
  const { sdmn, asin, _id: productId } = product;
  const trimedAsin = asin!.replace(/\W/g, "");
  try {
    const response = await axios.get<any, AxiosResponse<KeepaResponse, any>>(
      `${process.env.KEEPA_URL}/product?key=${
        process.env.KEEPA_API_KEY
      }&asin=${trimedAsin}&${keepaProductSearchParams.join("&")}`
    );

    if (
      response.status === 200 &&
      response.data.error === undefined &&
      response.data.products.length > 0 &&
      response.data.products[0].asin
    ) {
      console.log(`Request for ASIN: ${trimedAsin} - ${sdmn}`);
      await processKeepaResult({
        product,
        analysis: response.data,
        asin: trimedAsin,
        props: keepaProps,
      });
    } else {
      await updateProductWithQuery(productId, {
        $set: {
          info_prop: "not_found",
        },
        $unset: {
          keepa_lckd: "",
        },
      });
      const sameProductCnt = await processMissingKeepaResult(product, {
        info_prop: "not_found",
      });
      console.log(
        `Request for ASIN: ${trimedAsin} - ${sdmn} failed with status ${response.status} - ${sameProductCnt} other products updated`
      );
    }

    return { success: true, data: response.data };
  } catch (error) {
    if (error instanceof AxiosError) {
      logGlobal(
        loggerName,
        `Error for ASIN: ${trimedAsin} - ${sdmn}, ${error.status}, ${error.message}`
      );
      if (error.response?.data) {
        return {
          success: false,
          product: product,
          data: error.response.data,
        };
      } else {
        logGlobal(
          loggerName,
          `Error for ASIN: ${trimedAsin} - ${sdmn}, ${error}`
        );
        return { success: false, product: product };
      }
    }
    return { success: false, product: product };
  }
}
