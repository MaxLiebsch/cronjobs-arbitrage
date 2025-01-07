import {
  AznCategoryTrexIdMapper,
  DbProductRecord,
  determineAdjustedSellPrice,
  getAznAvgPrice,
} from "@dipmaxtech/clr-pkg";
import { scNewFeeFinder } from "../api/scApi.js";
import { retrieveCostsFields } from "../util/retrieveCostsFields.js";
import { processArbitrageCalc } from "../util/processArbitrageCalculation.js";
import { ERRORS, ErrorTypes } from "./scError.js";
import {
  ProcessProductReponse,
  ProcessProductRequest,
} from "../types/ProcessProductRequest.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";

const aznMapper = AznCategoryTrexIdMapper.getInstance(
  "../static/scCategorydeMapping.json"
);
const loggerName = CJ_LOGGER.RECALCULATE;
async function scNewHappyPath(product: DbProductRecord) {
  let tRexId = undefined;

  const { categories, pwhd, a_prc: sellPrice } = product;

  if (!pwhd) throw new Error(ERRORS.scNewHappyPath.noDimensions);

  const { avgPrice, a_useCurrPrice, a_prc } = determineAdjustedSellPrice(
    product,
    sellPrice || 0
  );

  if (!categories) throw new Error(ERRORS.scNewHappyPath.noCategories);

  for (const category of categories) {
    tRexId = aznMapper.get(category.toString());
    if (tRexId) {
      break;
    }
  }
  if (!tRexId) throw new Error(ERRORS.scNewHappyPath.tRexId);
  console.log("Determined tRexId:", tRexId);

  console.log("Fetching estimated fees...");
  const feeFinder = await scNewFeeFinder(
    tRexId,
    a_useCurrPrice ? a_prc : avgPrice,
    pwhd!
  );

  if (!feeFinder?.data) throw new Error(ERRORS.scNewHappyPath.newFeeFinder);

  return { tRexId, costs: retrieveCostsFields(feeFinder.data) };
}

export async function handleNewHappyPath(
  processProductRequest: ProcessProductRequest
): Promise<ProcessProductReponse> {
  let { product, errors } = processProductRequest;
  try {
    const { costs, tRexId } = await scNewHappyPath(product);
    let productInfo: Partial<DbProductRecord> = {};
    if (!product.a_nm) {
      productInfo["a_nm"] = "";
    }
    const processed = processArbitrageCalc(product, costs, true);
    errors = [];
    return { update: { tRexId, ...productInfo, ...processed }, errors };
  } catch (error) {
    if (error instanceof Error) {
      logGlobal(loggerName, `${product.asin} failed: ${error}`);
      const knownErrors = [
        ERRORS.scNewHappyPath.noDimensions,
        ERRORS.scNewHappyPath.noCategories,
        ERRORS.scNewHappyPath.tRexId,
        ERRORS.scNewHappyPath.newFeeFinder,
      ];
      if (knownErrors.includes(error.message)) {
        errors.push(error.message as ErrorTypes);
      } else {
        errors.push(error.message as ErrorTypes);
      }
    }
    return { update: {}, errors };
  }
}
