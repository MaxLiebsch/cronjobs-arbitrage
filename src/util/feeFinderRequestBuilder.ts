import { Dimensions, roundToTwoDecimals } from "@dipmaxtech/clr-pkg";
import { FeeFinderRequest, NewFeeRquest } from "../types/FeeFinder.js";
import { parseDimensions } from "./parseDimensions.js";

export function FeeFinderRequestBuilder(
  asin: string,
  countryCode: string = "DE",
  glProductGroupName: string,
  mfnPriceStr: string // "8.56"
) {
  const response: FeeFinderRequest = {
    countryCode,
    itemInfo: {
      asin,
      glProductGroupName,
      packageLength: "0",
      packageWidth: "0",
      packageHeight: "0",
      dimensionUnit: "centimeters",
      packageWeight: "0",
      weightUnit: "kilograms",
      mfnPriceStr,
      afnPriceStr: mfnPriceStr,
      mfnShippingPriceStr: "0",
      currency: "EUR",
      isNewDefined: false,
    },
    programIdList: ["Core#0", "MFN#1"],
    programParamMap: {},
  };

  return response;
}

export function NewFeeFinderRequestBuilder(
  tRexId: string,
  mfnPriceStr: string, // "8.56",
  dimensions: Dimensions,
  countryCode: string = "DE"
) {
  const parsedDimensions = parseDimensions(dimensions); 
  const { height, length, width, weight } = parsedDimensions;
  const response: NewFeeRquest = {
    countryCode,
    itemInfo: {
      tRexId,
      packageLength: length.toString(),
      packageWidth: width.toString(),
      packageHeight: height.toString(),
      dimensionUnit: "centimeters",
      packageWeight: weight ? weight.toString() : "0.2",
      weightUnit: "kilograms",
      mfnPriceStr,
      afnPriceStr: mfnPriceStr,
      mfnShippingPriceStr: "0",
      currency: "EUR",
      isNewDefined: true,
    },
    programIdList: ["Core#0", "MFN#1"],
    programParamMap: {},
  };

  return response;
}
