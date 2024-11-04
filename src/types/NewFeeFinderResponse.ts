export interface NewFeeFinderResponse {
    succeed: boolean
    data: Data
  }
  
  export interface Data {
    countryCode: string
    merchantId: string
    asin: string
    inventoryUnitInfo: InventoryUnitInfo
    programFeeResultMap: ProgramFeeResultMap
  }
  
  export interface InventoryUnitInfo {}
  
  export interface ProgramFeeResultMap {
    "Core#0": Core0
    "MFN#1": Mfn1
  }
  
  export interface Core0 {
    otherCost: OtherCost
    perUnitPeakStorageFee: PerUnitPeakStorageFee
    perUnitNonPeakStorageFee: PerUnitNonPeakStorageFee
    otherFeeInfoMap: OtherFeeInfoMap
    futureFeeInfoMap: FutureFeeInfoMap
  }
  
  export interface OtherCost {
    vatRate: number
    vatAmount: VatAmount
  }
  
  export interface VatAmount {
    amount: number
    currency: string
  }
  
  export interface PerUnitPeakStorageFee {
    feeAmount: FeeAmount
    promotionAmount: PromotionAmount
    taxAmount: TaxAmount
    total: Total
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
    componentFees: ComponentFee[]
  }
  
  export interface FeeAmount {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount {
    amount: number
    currency: string
  }
  
  export interface TaxAmount {
    amount: number
    currency: string
  }
  
  export interface Total {
    amount: number
    currency: string
  }
  
  export interface ComponentFee {
    feeAmount: FeeAmount2
    promotionAmount: PromotionAmount2
    taxAmount: TaxAmount2
    total: Total2
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount2 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount2 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount2 {
    amount: number
    currency: string
  }
  
  export interface Total2 {
    amount: number
    currency: string
  }
  
  export interface PerUnitNonPeakStorageFee {
    feeAmount: FeeAmount3
    promotionAmount: PromotionAmount3
    taxAmount: TaxAmount3
    total: Total3
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
    componentFees: ComponentFee2[]
  }
  
  export interface FeeAmount3 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount3 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount3 {
    amount: number
    currency: string
  }
  
  export interface Total3 {
    amount: number
    currency: string
  }
  
  export interface ComponentFee2 {
    feeAmount: FeeAmount4
    promotionAmount: PromotionAmount4
    taxAmount: TaxAmount4
    total: Total4
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount4 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount4 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount4 {
    amount: number
    currency: string
  }
  
  export interface Total4 {
    amount: number
    currency: string
  }
  
  export interface OtherFeeInfoMap {
    BubblewrapFee: BubblewrapFee
    OpaqueBaggingFee: OpaqueBaggingFee
    TapingFee: TapingFee
    LabelingFee: LabelingFee
    PolybaggingFee: PolybaggingFee
    DigitalServicesFee: DigitalServicesFee
  }
  
  export interface BubblewrapFee {
    feeAmount: FeeAmount5
    promotionAmount: PromotionAmount5
    taxAmount: TaxAmount5
    total: Total5
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount5 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount5 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount5 {
    amount: number
    currency: string
  }
  
  export interface Total5 {
    amount: number
    currency: string
  }
  
  export interface OpaqueBaggingFee {
    feeAmount: FeeAmount6
    promotionAmount: PromotionAmount6
    taxAmount: TaxAmount6
    total: Total6
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount6 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount6 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount6 {
    amount: number
    currency: string
  }
  
  export interface Total6 {
    amount: number
    currency: string
  }
  
  export interface TapingFee {
    feeAmount: FeeAmount7
    promotionAmount: PromotionAmount7
    taxAmount: TaxAmount7
    total: Total7
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount7 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount7 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount7 {
    amount: number
    currency: string
  }
  
  export interface Total7 {
    amount: number
    currency: string
  }
  
  export interface LabelingFee {
    feeAmount: FeeAmount8
    promotionAmount: PromotionAmount8
    taxAmount: TaxAmount8
    total: Total8
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount8 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount8 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount8 {
    amount: number
    currency: string
  }
  
  export interface Total8 {
    amount: number
    currency: string
  }
  
  export interface PolybaggingFee {
    feeAmount: FeeAmount9
    promotionAmount: PromotionAmount9
    taxAmount: TaxAmount9
    total: Total9
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount9 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount9 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount9 {
    amount: number
    currency: string
  }
  
  export interface Total9 {
    amount: number
    currency: string
  }
  
  export interface DigitalServicesFee {
    feeAmount: FeeAmount10
    promotionAmount: PromotionAmount10
    taxAmount: TaxAmount10
    total: Total10
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount10 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount10 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount10 {
    amount: number
    currency: string
  }
  
  export interface Total10 {
    amount: number
    currency: string
  }
  
  export interface FutureFeeInfoMap {}
  
  export interface Mfn1 {
    otherCost: OtherCost2
    otherFeeInfoMap: OtherFeeInfoMap2
    futureFeeInfoMap: FutureFeeInfoMap2
  }
  
  export interface OtherCost2 {
    vatRate: number
    vatAmount: VatAmount2
  }
  
  export interface VatAmount2 {
    amount: number
    currency: string
  }
  
  export interface OtherFeeInfoMap2 {
    FixedClosingFee: FixedClosingFee
    ReferralFee: ReferralFee
    VariableClosingFee: VariableClosingFee
    DigitalServicesFee: DigitalServicesFee2
  }
  
  export interface FixedClosingFee {
    feeAmount: FeeAmount11
    promotionAmount: PromotionAmount11
    taxAmount: TaxAmount11
    total: Total11
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount11 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount11 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount11 {
    amount: number
    currency: string
  }
  
  export interface Total11 {
    amount: number
    currency: string
  }
  
  export interface ReferralFee {
    feeAmount: FeeAmount12
    promotionAmount: PromotionAmount12
    taxAmount: TaxAmount12
    total: Total12
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount12 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount12 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount12 {
    amount: number
    currency: string
  }
  
  export interface Total12 {
    amount: number
    currency: string
  }
  
  export interface VariableClosingFee {
    feeAmount: FeeAmount13
    promotionAmount: PromotionAmount13
    taxAmount: TaxAmount13
    total: Total13
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount13 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount13 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount13 {
    amount: number
    currency: string
  }
  
  export interface Total13 {
    amount: number
    currency: string
  }
  
  export interface DigitalServicesFee2 {
    feeAmount: FeeAmount14
    promotionAmount: PromotionAmount14
    taxAmount: TaxAmount14
    total: Total14
    id: string
    feeNameStringId: string
    timeOfFeesEstimate: number
  }
  
  export interface FeeAmount14 {
    amount: number
    currency: string
  }
  
  export interface PromotionAmount14 {
    amount: number
    currency: string
  }
  
  export interface TaxAmount14 {
    amount: number
    currency: string
  }
  
  export interface Total14 {
    amount: number
    currency: string
  }
  
  export interface FutureFeeInfoMap2 {}