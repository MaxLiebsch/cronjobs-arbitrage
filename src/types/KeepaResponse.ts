export interface KeepaResponse {
  timestamp: number;
  tokensLeft: number;
  refillIn: number;
  refillRate: number;
  tokenFlowReduction: number;
  tokensConsumed: number;
  processingTimeInMs: number;
  products: Product[];
  error?: Error;
}

export interface Error {
  type: string;
  message: string;
  details: any;
}

export interface Product {
  csv: number[] | undefined[];
  categories: number[];
  imagesCSV: string;
  manufacturer: string;
  title: string;
  lastUpdate: number;
  lastPriceChange: number;
  rootCategory: number;
  productType: number;
  parentAsin: string;
  variationCSV: string;
  asin: string;
  domainId: number;
  type: string;
  hasReviews: boolean;
  trackingSince: number;
  brand: string;
  productGroup: string;
  partNumber: string;
  model: string;
  color: string;
  size: string;
  edition: any;
  format: any;
  packageHeight: number;
  packageLength: number;
  packageWidth: number;
  packageWeight: number;
  packageQuantity: number;
  isAdultProduct: boolean;
  isEligibleForTradeIn: boolean;
  isEligibleForSuperSaverShipping: boolean;
  offers: any;
  buyBoxSellerIdHistory: any;
  isRedirectASIN: boolean;
  isSNS: boolean;
  author: any;
  binding: string;
  numberOfItems: number;
  numberOfPages: number;
  publicationDate: number;
  releaseDate: number;
  languages: any;
  lastRatingUpdate: number;
  ebayListingIds: any;
  lastEbayUpdate: number;
  eanList: string[];
  upcList: any;
  liveOffersOrder: any;
  frequentlyBoughtTogether: string[];
  features: string[];
  description: string;
  promotions: any;
  newPriceIsMAP: boolean;
  coupon: any;
  availabilityAmazon: number;
  listedSince: number;
  fbaFees: FbaFees;
  variations: Variation[];
  itemHeight: number;
  itemLength: number;
  itemWidth: number;
  itemWeight: number;
  salesRankReference: number;
  salesRanks: SalesRanks;
  salesRankReferenceHistory: number[];
  launchpad: boolean;
  isB2B: boolean;
  lastSoldUpdate: number;
  monthlySold: number;
  monthlySoldHistory: number[];
  buyBoxEligibleOfferCounts: number[];
  parentAsinHistory: string[];
  isHeatSensitive: boolean;
  urlSlug: string;
  stats: Stats;
  offersSuccessful: boolean;
  g: number;
  categoryTree: CategoryTree[];
  parentTitle: string;
  referralFeePercent: number;
  referralFeePercentage: number;
}

export interface FbaFees {
  pickAndPackFee: number;
}

export interface Variation {
  asin: string;
  attributes: Attribute[];
}

export interface Attribute {
  dimension: string;
  value: string;
}

export interface SalesRanks {
  "3167641": number[];
  "3677554031": number[];
}

export interface Stats {
  current: number[];
  avg: number[];
  avg30: number[];
  avg90: number[];
  avg180: number[];
  avg365: number[];
  atIntervalStart: number[];
  min: number[] | undefined[];
  max: number[] | undefined[];
  minInInterval: number[] | undefined[];
  maxInInterval: number[] | undefined[];
  isLowest: boolean[];
  isLowest90: boolean[];
  outOfStockPercentageInInterval: number[];
  outOfStockPercentage365: number[];
  outOfStockPercentage180: number[];
  outOfStockPercentage90: number[];
  outOfStockPercentage30: number[];
  outOfStockCountAmazon30: number;
  outOfStockCountAmazon90: number;
  deltaPercent90_monthlySold: number;
  retrievedOfferCount: number;
  totalOfferCount: number;
  tradeInPrice: number;
  lastOffersUpdate: number;
  isAddonItem: any;
  lightningDealInfo: any;
  sellerIdsLowestFBA: any;
  sellerIdsLowestFBM: any;
  offerCountFBA: number;
  offerCountFBM: number;
  salesRankDrops30: number;
  salesRankDrops90: number;
  salesRankDrops180: number;
  salesRankDrops365: number;
  buyBoxPrice: number;
  buyBoxShipping: number;
  buyBoxIsUnqualified: any;
  buyBoxIsShippable: any;
  buyBoxIsPreorder: any;
  buyBoxIsFBA: any;
  buyBoxIsAmazon: any;
  buyBoxIsMAP: any;
  buyBoxIsUsed: any;
  buyBoxIsBackorder: any;
  buyBoxIsPrimeExclusive: any;
  buyBoxIsFreeShippingEligible: any;
  buyBoxIsPrimePantry: any;
  buyBoxIsPrimeEligible: any;
  buyBoxMinOrderQuantity: any;
  buyBoxMaxOrderQuantity: any;
  buyBoxCondition: any;
  buyBoxAvailabilityMessage: any;
  buyBoxShippingCountry: any;
  buyBoxSellerId: any;
  buyBoxIsWarehouseDeal: any;
}

export interface CategoryTree {
  catId: number;
  name: string;
}
