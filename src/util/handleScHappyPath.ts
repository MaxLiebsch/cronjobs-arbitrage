import { DbProductRecord, getAznAvgPrice } from "@dipmaxtech/clr-pkg";
import {
  scAdditionalProductInfo,
  scFeeFinder,
  scProductMatch,
} from "../api/scApi.js";
import { retrieveCostsFields } from "../util/retrieveCostsFields.js";
import { retrieveGlProductGroupName } from "../util/retrieveGlproductName.js";
import { processArbitrageCalc } from "../util/processArbitrageCalculation.js";
import { ERRORS, ErrorTypes } from "./scError.js";
import {
  ProcessProductReponse,
  ProcessProductRequest,
} from "../types/ProcessProductRequest.js";
import { retrieveProductInfo } from "./retrieveProductInfo.js";
import { processProductInfo } from "./processProductInfo.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";

const loggerName = CJ_LOGGER.RECALCULATE;

async function scHappyPath(product: DbProductRecord) {
  const { asin } = product;
  console.log("asin:", asin);

  if (!asin) throw new Error(ERRORS.scHappyPath.missingAsin);

  console.log("Fetching additional product info...");
  const additionalProductInfo = await scAdditionalProductInfo(
    asin,
    "DE",
    "de-DE"
  );
  const additionalDataResponse = additionalProductInfo?.data
  if (additionalDataResponse && Object.keys(additionalDataResponse.data).length > 0) {
    product.a_prc = additionalProductInfo.data.data.price.amount;
    product.a_cur = additionalProductInfo.data.data.price.currency;
  }

  console.log("sellPrice:", product.a_prc);
  const { avgPrice, a_useCurrPrice, a_prc } = getAznAvgPrice(
    product,
    product.a_prc || 0
  );

  console.log("AvgPrice calulated:", avgPrice);
  console.log("Find product match...", asin);
  const productMatch = await scProductMatch(asin);
  if (!productMatch?.data) throw new Error(ERRORS.scHappyPath.productMatch);
  const data = productMatch.data.data;

  console.log("Number of other products:", data.otherProducts.products.length);

  let asinMatch = false;
  let productIndex = 0;
  for (let index = 0; index < data.otherProducts.products.length; index++) {
    const product = data.otherProducts.products[index];
    console.log("Product found:", product.asin);
    if (product.asin === asin) {
      asinMatch = true;
      index = productIndex;
      break;
    }
  }

  if (!asinMatch) throw new Error(ERRORS.scHappyPath.asinMatch);

  const glProductGroupName = retrieveGlProductGroupName(
    productMatch.data,
    productIndex
  );

  if (!glProductGroupName)
    throw new Error(ERRORS.scHappyPath.glProductGroupName);

  const productInfo = retrieveProductInfo(productMatch.data, productIndex);

  console.log("Fetching fees...");
  const feeFinder = await scFeeFinder(
    asin,
    glProductGroupName,
    a_useCurrPrice ? a_prc : avgPrice
  );

  if (!feeFinder?.data) throw new Error(ERRORS.scHappyPath.feeFinder);

  return {
    gl: glProductGroupName,
    productInfo,
    costs: retrieveCostsFields(feeFinder.data),
  };
}

export async function handleHappyPath(
  processProductRequest: ProcessProductRequest
): Promise<ProcessProductReponse> {
  let { product, errors } = processProductRequest;
  try {
    const { costs, gl, productInfo } = await scHappyPath(product);
    const processedProductInfos = processProductInfo(productInfo);
    const processed = processArbitrageCalc(product, costs);
    errors = [];
    return {
      update: {
        gl,
        a_lnk: "https://www.amazon.de/dp/product/" + product.asin,
        ...processedProductInfos,
        ...processed,
      },
      errors,
    };
  } catch (error) {

    if (error instanceof Error) {
      logGlobal(loggerName, `${product.asin} failed: ${error}`);
      const knownErrors = [
        ERRORS.scHappyPath.productMatch,
        ERRORS.scHappyPath.glProductGroupName,
        ERRORS.scHappyPath.feeFinder,
        ERRORS.scHappyPath.asinMatch,
        ERRORS.scHappyPath.missingAsin,
      ];
      if (knownErrors.includes(error.message)) {
        console.log("error:", error.message);
        errors.push(error.message as ErrorTypes);
      } else {
        errors.push(error.message as ErrorTypes);
        console.log("error:", error.message);
      }
    }
    return { update: {}, errors };
  }
}
