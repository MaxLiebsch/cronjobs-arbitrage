import axios, { AxiosError, AxiosResponse } from "axios";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { processKeepaResult } from "./processKeepaResult.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { sleep } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, logGlobal } from "./logger.js";
import { keepaProps } from "./keepaProps.js";
import { ProductWithTask } from "../types/products.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

// Function to make two requests for each ID
export async function makeRequestsForAsin(product: ProductWithTask) {
  const { sdmn, asin, _id: productId } = product;
  const trimedAsin = asin!.replace(/\W/g, "");
  try {
    const response = await axios.get<any, AxiosResponse<KeepaResponse, any>>(
      `${process.env.KEEPA_URL}/product?key=${process.env.KEEPA_API_KEY}&domain=3&asin=${trimedAsin}&stats=90&history=1&days=90`
    );

    if (
      response.status === 200 &&
      response.data.error === undefined &&
      response.data.products.length > 0 &&
      response.data.products[0].asin
    ) {
      console.log(`Request for ASIN: ${trimedAsin} - ${sdmn}`);
      await processKeepaResult({
        ...product,
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
      console.log(
        `Request for ASIN: ${trimedAsin} - ${sdmn} failed with status ${response.status}`
      );
    }
  } catch (error) {
    await updateProductWithQuery(productId, {
      $unset: {
        keepa_lckd: "",
      },
    });
    if (error instanceof AxiosError) {
      logGlobal(
        loggerName,
        `Error for ASIN: ${trimedAsin} - ${sdmn}, ${error.status}, ${error.message}`
      );
      if (error.status === 429) {
        logGlobal(loggerName, "Rate limit reached. Waiting for 60 seconds...");
        await sleep(1000 * 10); // Wait for 10 seconds
        logGlobal(loggerName, "Resuming...");
      }
    }
  }
}
