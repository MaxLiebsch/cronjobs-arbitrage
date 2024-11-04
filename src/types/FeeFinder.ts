export interface ScRequest {
  countryCode: string;
  programParamMap: ProgramParamMap;
  programIdList: string[];
}

export interface NewFeeRquest extends ScRequest {
  itemInfo: NewFeeItemInfos;
}

export interface FeeFinderRequest extends ScRequest {
  itemInfo: FeeFinderItemInfo;
}

export interface MinItemInfo {
  packageLength: string;
  packageWidth: string;
  packageHeight: string;
  dimensionUnit: string;
  packageWeight: string;
  weightUnit: string;
  afnPriceStr: string;
  mfnPriceStr: string;
  mfnShippingPriceStr: string;
  currency: string;
  isNewDefined: boolean;
}

export interface FeeFinderItemInfo extends MinItemInfo {
  asin: string;
  glProductGroupName: string;
}

export interface NewFeeItemInfos extends MinItemInfo {
  tRexId: string;
}

export interface ProgramParamMap {}

export interface FeeFinderResponse {
  succeed: boolean;
  data: FeeFinderData;
}

export interface FeeFinderData {
  countryCode: string;
  merchantId: string;
  asin: string;
  inventoryUnitInfo: InventoryUnitInfo;
  programFeeResultMap: ProgramFeeResultMap;
}

export interface InventoryUnitInfo {}

export interface ProgramFeeResultMap {
  "Core#0": Core0;
  "MFN#1": Mfn1;
}

export interface Core0 {
  otherCost: OtherCost;
  perUnitPeakStorageFee: PerUnitPeakStorageFee;
  perUnitNonPeakStorageFee: PerUnitNonPeakStorageFee;
  otherFeeInfoMap: OtherFeeInfoMap;
  futureFeeInfoMap: FutureFeeInfoMap;
}

export interface OtherCost {
  vatRate: number;
  vatAmount: VatAmount;
}

export interface VatAmount {
  amount: number;
  currency: string;
}

export interface PerUnitPeakStorageFee {
  feeAmount: FeeAmount;
  promotionAmount: PromotionAmount;
  taxAmount: TaxAmount;
  total: Total;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
  componentFees: ComponentFee[];
}

export interface FeeAmount {
  amount: number;
  currency: string;
}

export interface PromotionAmount {
  amount: number;
  currency: string;
}

export interface TaxAmount {
  amount: number;
  currency: string;
}

export interface Total {
  amount: number;
  currency: string;
}

export interface ComponentFee {
  feeAmount: FeeAmount2;
  promotionAmount: PromotionAmount2;
  taxAmount: TaxAmount2;
  total: Total2;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount2 {
  amount: number;
  currency: string;
}

export interface PromotionAmount2 {
  amount: number;
  currency: string;
}

export interface TaxAmount2 {
  amount: number;
  currency: string;
}

export interface Total2 {
  amount: number;
  currency: string;
}

export interface PerUnitNonPeakStorageFee {
  feeAmount: FeeAmount3;
  promotionAmount: PromotionAmount3;
  taxAmount: TaxAmount3;
  total: Total3;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
  componentFees: ComponentFee2[];
}

export interface FeeAmount3 {
  amount: number;
  currency: string;
}

export interface PromotionAmount3 {
  amount: number;
  currency: string;
}

export interface TaxAmount3 {
  amount: number;
  currency: string;
}

export interface Total3 {
  amount: number;
  currency: string;
}

export interface ComponentFee2 {
  feeAmount: FeeAmount4;
  promotionAmount: PromotionAmount4;
  taxAmount: TaxAmount4;
  total: Total4;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount4 {
  amount: number;
  currency: string;
}

export interface PromotionAmount4 {
  amount: number;
  currency: string;
}

export interface TaxAmount4 {
  amount: number;
  currency: string;
}

export interface Total4 {
  amount: number;
  currency: string;
}

export interface OtherFeeInfoMap {
  BubblewrapFee: BubblewrapFee;
  FulfillmentFee: FulfillmentFee;
  ReferralFee: ReferralFee;
  LabelingFee: LabelingFee;
  PolybaggingFee: PolybaggingFee;
  DigitalServicesFee: DigitalServicesFee;
  FixedClosingFee: FixedClosingFee;
  OpaqueBaggingFee: OpaqueBaggingFee;
  VariableClosingFee: VariableClosingFee;
  TapingFee: TapingFee;
}

export interface BubblewrapFee {
  feeAmount: FeeAmount5;
  promotionAmount: PromotionAmount5;
  taxAmount: TaxAmount5;
  total: Total5;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount5 {
  amount: number;
  currency: string;
}

export interface PromotionAmount5 {
  amount: number;
  currency: string;
}

export interface TaxAmount5 {
  amount: number;
  currency: string;
}

export interface Total5 {
  amount: number;
  currency: string;
}

export interface FulfillmentFee {
  feeAmount: FeeAmount6;
  promotionAmount: PromotionAmount6;
  taxAmount: TaxAmount6;
  total: Total6;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount6 {
  amount: number;
  currency: string;
}

export interface PromotionAmount6 {
  amount: number;
  currency: string;
}

export interface TaxAmount6 {
  amount: number;
  currency: string;
}

export interface Total6 {
  amount: number;
  currency: string;
}

export interface ReferralFee {
  feeAmount: FeeAmount7;
  promotionAmount: PromotionAmount7;
  taxAmount: TaxAmount7;
  total: Total7;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount7 {
  amount: number;
  currency: string;
}

export interface PromotionAmount7 {
  amount: number;
  currency: string;
}

export interface TaxAmount7 {
  amount: number;
  currency: string;
}

export interface Total7 {
  amount: number;
  currency: string;
}

export interface LabelingFee {
  feeAmount: FeeAmount8;
  promotionAmount: PromotionAmount8;
  taxAmount: TaxAmount8;
  total: Total8;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount8 {
  amount: number;
  currency: string;
}

export interface PromotionAmount8 {
  amount: number;
  currency: string;
}

export interface TaxAmount8 {
  amount: number;
  currency: string;
}

export interface Total8 {
  amount: number;
  currency: string;
}

export interface PolybaggingFee {
  feeAmount: FeeAmount9;
  promotionAmount: PromotionAmount9;
  taxAmount: TaxAmount9;
  total: Total9;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount9 {
  amount: number;
  currency: string;
}

export interface PromotionAmount9 {
  amount: number;
  currency: string;
}

export interface TaxAmount9 {
  amount: number;
  currency: string;
}

export interface Total9 {
  amount: number;
  currency: string;
}

export interface DigitalServicesFee {
  feeAmount: FeeAmount10;
  promotionAmount: PromotionAmount10;
  taxAmount: TaxAmount10;
  total: Total10;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount10 {
  amount: number;
  currency: string;
}

export interface PromotionAmount10 {
  amount: number;
  currency: string;
}

export interface TaxAmount10 {
  amount: number;
  currency: string;
}

export interface Total10 {
  amount: number;
  currency: string;
}

export interface FixedClosingFee {
  feeAmount: FeeAmount11;
  promotionAmount: PromotionAmount11;
  taxAmount: TaxAmount11;
  total: Total11;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount11 {
  amount: number;
  currency: string;
}

export interface PromotionAmount11 {
  amount: number;
  currency: string;
}

export interface TaxAmount11 {
  amount: number;
  currency: string;
}

export interface Total11 {
  amount: number;
  currency: string;
}

export interface OpaqueBaggingFee {
  feeAmount: FeeAmount12;
  promotionAmount: PromotionAmount12;
  taxAmount: TaxAmount12;
  total: Total12;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount12 {
  amount: number;
  currency: string;
}

export interface PromotionAmount12 {
  amount: number;
  currency: string;
}

export interface TaxAmount12 {
  amount: number;
  currency: string;
}

export interface Total12 {
  amount: number;
  currency: string;
}

export interface VariableClosingFee {
  feeAmount: FeeAmount13;
  promotionAmount: PromotionAmount13;
  taxAmount: TaxAmount13;
  total: Total13;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount13 {
  amount: number;
  currency: string;
}

export interface PromotionAmount13 {
  amount: number;
  currency: string;
}

export interface TaxAmount13 {
  amount: number;
  currency: string;
}

export interface Total13 {
  amount: number;
  currency: string;
}

export interface TapingFee {
  feeAmount: FeeAmount14;
  promotionAmount: PromotionAmount14;
  taxAmount: TaxAmount14;
  total: Total14;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount14 {
  amount: number;
  currency: string;
}

export interface PromotionAmount14 {
  amount: number;
  currency: string;
}

export interface TaxAmount14 {
  amount: number;
  currency: string;
}

export interface Total14 {
  amount: number;
  currency: string;
}

export interface FutureFeeInfoMap {}

export interface Mfn1 {
  otherCost: OtherCost2;
  otherFeeInfoMap: OtherFeeInfoMap2;
  futureFeeInfoMap: FutureFeeInfoMap2;
}

export interface OtherCost2 {
  vatRate: number;
  vatAmount: VatAmount2;
}

export interface VatAmount2 {
  amount: number;
  currency: string;
}

export interface OtherFeeInfoMap2 {
  FixedClosingFee: FixedClosingFee2;
  ReferralFee: ReferralFee2;
  VariableClosingFee: VariableClosingFee2;
  DigitalServicesFee: DigitalServicesFee2;
}

export interface FixedClosingFee2 {
  feeAmount: FeeAmount15;
  promotionAmount: PromotionAmount15;
  taxAmount: TaxAmount15;
  total: Total15;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount15 {
  amount: number;
  currency: string;
}

export interface PromotionAmount15 {
  amount: number;
  currency: string;
}

export interface TaxAmount15 {
  amount: number;
  currency: string;
}

export interface Total15 {
  amount: number;
  currency: string;
}

export interface ReferralFee2 {
  feeAmount: FeeAmount16;
  promotionAmount: PromotionAmount16;
  taxAmount: TaxAmount16;
  total: Total16;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount16 {
  amount: number;
  currency: string;
}

export interface PromotionAmount16 {
  amount: number;
  currency: string;
}

export interface TaxAmount16 {
  amount: number;
  currency: string;
}

export interface Total16 {
  amount: number;
  currency: string;
}

export interface VariableClosingFee2 {
  feeAmount: FeeAmount17;
  promotionAmount: PromotionAmount17;
  taxAmount: TaxAmount17;
  total: Total17;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount17 {
  amount: number;
  currency: string;
}

export interface PromotionAmount17 {
  amount: number;
  currency: string;
}

export interface TaxAmount17 {
  amount: number;
  currency: string;
}

export interface Total17 {
  amount: number;
  currency: string;
}

export interface DigitalServicesFee2 {
  feeAmount: FeeAmount18;
  promotionAmount: PromotionAmount18;
  taxAmount: TaxAmount18;
  total: Total18;
  id: string;
  feeNameStringId: string;
  timeOfFeesEstimate: number;
}

export interface FeeAmount18 {
  amount: number;
  currency: string;
}

export interface PromotionAmount18 {
  amount: number;
  currency: string;
}

export interface TaxAmount18 {
  amount: number;
  currency: string;
}

export interface Total18 {
  amount: number;
  currency: string;
}

export interface FutureFeeInfoMap2 {}
