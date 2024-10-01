import axios, { AxiosError, AxiosResponse } from "axios";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { eanKeepa } from "./eanKeepa.js";
import { asinKeepa } from "./asinKeepa.js";
import { KeepaResponse } from "../types/KeepaResponse.js";
import { KeepaPreProduct } from "../types/keepaPreProduct.js";
import { sleep } from "@dipmaxtech/clr-pkg";
import { CJ_LOGGER, logGlobal } from "./logger.js";

const loggerName = CJ_LOGGER.PENDING_KEEPAS;

export async function makeRequestsForEan(product: KeepaPreProduct) {
  const { ean } = product;
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
      console.log(`Request for EAN: ${ean} - ${product.shopDomain}`);
      await eanKeepa({
        ...product,
        analysis: response.data,
        asin: response.data.products[0].asin,
      });
    } else {
      await updateProductWithQuery(product._id, {
        $set: {
          keepaEanUpdatedAt: new Date().toISOString(),
        },
        $unset: {
          keepaEan_lckd: "",
        },
      });
      console.log(
        `Request for EAN: ${ean} - ${product.shopDomain} failed with status ${response.status}`
      );
    }
  } catch (error) {
    await updateProductWithQuery(product._id, {
      $unset: {
        keepaEan_lckd: "",
      },
    });
    if (error instanceof AxiosError) {
      logGlobal(
        loggerName,
        `Error for EAN: ${ean} - ${product.shopDomain}, ${error.status}, ${error.message}`
      );
      if (error.status === 429) {
        logGlobal(loggerName, "Rate limit reached. Waiting for 60 seconds...");
        await sleep(1000 * 60); // Wait for 60 seconds
        logGlobal(loggerName, "Resuming...");
      }
    }
  }
}

// Function to make two requests for each ID
export async function makeRequestsForId(product: KeepaPreProduct) {
  const trimedAsin = product.asin!.replace(/\W/g, "");
  try {
    const response = await axios.get<any, AxiosResponse<KeepaResponse, any>>(
      `${process.env.KEEPA_URL}/product?key=${process.env.KEEPA_API_KEY}&domain=3&asin=${trimedAsin}&stats=90&history=1&days=90`
    );

    if (response.status === 200 && response.data.error === undefined) {
      console.log(`Request for ASIN: ${trimedAsin} - ${product.shopDomain}`);
      await asinKeepa({
        ...product,
        analysis: response.data,
        asin: trimedAsin,
      });
    } else {
      await updateProductWithQuery(product._id, {
        $set: {
          asin: trimedAsin,
        },
        $unset: {
          keepa_lckd: "",
        },
      });
      console.log(
        `Request for ASIN: ${trimedAsin} - ${product.shopDomain} failed with status ${response.status}`
      );
    }
  } catch (error) {
    await updateProductWithQuery(product._id, {
      $unset: {
        keepa_lckd: "",
      },
    });
    if (error instanceof AxiosError) {
      logGlobal(
        loggerName,
        `Error for ASIN: ${trimedAsin} - ${product.shopDomain}, ${error.status}, ${error.message}`
      );
      if (error.status === 429) {
        logGlobal(loggerName, "Rate limit reached. Waiting for 60 seconds...");
        await sleep(1000 * 60); // Wait for 60 seconds
        logGlobal(loggerName, "Resuming...");
      }
    }
  }
}
