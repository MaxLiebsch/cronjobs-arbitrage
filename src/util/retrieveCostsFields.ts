import { Costs, roundToTwoDecimals } from "@dipmaxtech/clr-pkg";
import pkg from "lodash";
const { get } = pkg;
import { FeeFinderData } from "../types/FeeFinder.js";
import { NewFeeFinderResponse } from "../types/NewFeeFinderResponse.js";

const costsJsonKeys: { [key in keyof Costs]: string[] } = {
  tpt: [
    "data.programFeeResultMap.Core#0.otherFeeInfoMap.FulfillmentFee.feeAmount.amount",
  ],
  varc: [
    "data.programFeeResultMap.Core#0.otherFeeInfoMap.VariableClosingFee.feeAmount.amount",
  ],
  azn: [
    "data.programFeeResultMap.MFN#1.otherFeeInfoMap.ReferralFee.feeAmount.amount",
    "data.programFeeResultMap.MFN#1.otherFeeInfoMap.FixedClosingFee.feeAmount.amount",
  ],
  strg_1_hy: [
    "data.programFeeResultMap.Core#0.perUnitNonPeakStorageFee.feeAmount.amount",
  ],
  strg_2_hy: [
    "data.programFeeResultMap.Core#0.perUnitPeakStorageFee.feeAmount.amount",
  ],
};

export const retrieveCostsFields = (
  data: FeeFinderData | NewFeeFinderResponse
) => {
  const costs: Costs = {
    tpt: roundToTwoDecimals(get(data, costsJsonKeys.tpt[0], 0)),
    varc: roundToTwoDecimals(get(data, costsJsonKeys.varc[0], 0)),
    azn: roundToTwoDecimals(
      get(data, costsJsonKeys.azn[0], 0) + get(data, costsJsonKeys.azn[1], 0)
    ),
    strg_1_hy: Number(get(data, costsJsonKeys.strg_1_hy[0], 0).toFixed(5)),
    strg_2_hy: Number(get(data, costsJsonKeys.strg_2_hy[0], 0).toFixed(5)),
  };
  return costs;
};
