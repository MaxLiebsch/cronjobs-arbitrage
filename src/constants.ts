export const KEEPA_RATE_LIMIT = 60;
export const KEEPA_INTERVAL = "*/5 * * * *"
export const KEEPA_PRODUCT_LIMIT = 240;
export const MAX_EARNING_MARGIN = 150;
export const KEEPA_MINUTES = 20;
export const PRODUCTS_PER_MINUTE = 60;
export const MAX_RETRIES = 3;
export const MAX_AGE_PRODUCTS = 21;
export const MAX_AGE_PROPS = 30;
export const CHECK_PACKAGE_BATCH_INTERVAL =
  process.env.NODE_ENV === "production" ? 1000 * 60 * 1.5 : 1000 * 60 * 0.5;
export const TOKEN_LIMIT = 3800000;
export const MAX_PACKAGE_SIZE = 11;
export const BATCH_SIZE = process.env.NODE_ENV === "development" ? 50 : 6000;
export const MAX_BATCH_SIZE = 300;
export const MIN_BATCH_SIZE = 100;
export const MINIMAL_SCORE = 0.6;
export const MINIMAL_QUANTITY_SCORE = 0.8;
export const RECOVER_LIMIT_PER_DAY = 15000;
export const MAX_RETRIES_SC = 7;
export const SC_TIMEOUT = 8000;
export const SC_REQUEST_TIMEOUT = 15000;
export const DEFAULT_TRANSPORT_FEE = 4.95;
export const JAN_SEPT_M3_FEE = 27.54;
export const OCT_DEC_M3_FEE = 42.37;
export const CURRENT_DETECT_QUANTITY_PROMPT_VERSION = "v06";
export const CURRENT_MATCH_TITLES_PROMPT_VERSION = "v01";

export const keepaProductSearchParams = [
  "domain=3",
  "stats=90",
  "history=1",
  "days=90",
  "buybox=1",
];

export const keepaProperties = [
  { key: "products[0].asin", name: "" },
  { key: "products[0].categories", name: "" },
  { key: "products[0].eanList", name: "k_eanList" },
  { key: "products[0].brand", name: "" },
  { key: "products[0].numberOfItems", name: "" },
  { key: "products[0].referralFeePercentage", name: "costs.prvsn" }, // Provision
  { key: "products[0].itemHeight", name: "iwhd.height" }, //Item
  { key: "products[0].itemLength", name: "iwhd.length" },
  { key: "products[0].competitivePriceThreshold", name: "cmpPrcThrshld" },
  { key: "products[0].unitCount", name: "unitCount" }, // quantity and unit
  { key: "products[0].variations", name: "variations" }, // Variations
  { key: "products[0].itemWidth", name: "iwhd.width" },
  { key: "products[0].itemWeight", name: "iwhd.weight" },
  { key: "products[0].packageHeight", name: "pwhd.height" }, // Package
  { key: "products[0].packageLength", name: "pwhd.length" },
  { key: "products[0].packageWidth", name: "pwhd.width" },
  { key: "products[0].packageWeight", name: "pwhd.weight" },
  { key: "products[0].stats.salesRankDrops30", name: "drops30" },
  { key: "products[0].fbaFees.pickAndPackFee", name: "costs.ktpt" }, // Packaging
  { key: "products[0].stats.salesRankDrops90", name: "drops90" },
  { key: "products[0].availabilityAmazon", name: "" },
  { key: "products[0].categoryTree", name: "" },
  { key: "products[0].salesRanks", name: "" }, // Sales Rank nullable
  { key: "products[0].monthlySold", name: "" },
  { key: "products[0].csv[0]", name: "ahstprcs" }, // Amazon history prices
  { key: "products[0].csv[1]", name: "anhstprcs" }, // Amazon new history prices
  { key: "products[0].csv[2]", name: "auhstprcs" }, // Amazon used history prices
  { key: "products[0].stats.current[0]", name: "curr_ahsprcs" },
  { key: "products[0].stats.current[1]", name: "curr_ansprcs" },
  { key: "products[0].stats.current[2]", name: "curr_ausprcs" },
  { key: "products[0].stats.current[3]", name: "curr_salesRank" },
  { key: "products[0].stats.current[10]", name: "curr_fba" },
  { key: "products[0].stats.current[18]", name: "curr_buyBoxPrice" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[0]", name: "avg30_ahsprcs" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[1]", name: "avg30_ansprcs" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[2]", name: "avg30_ausprcs" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[3]", name: "avg30_salesRank" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[10]", name: "avg30_fba" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[18]", name: "avg30_buyBoxPrice" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg90[0]", name: "avg90_ahsprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[1]", name: "avg90_ansprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[2]", name: "avg90_ausprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[3]", name: "avg90_salesRank" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[10]", name: "avg90_fba" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[18]", name: "avg90_buyBoxPrice" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.buyBoxIsAmazon", name: "buyBoxIsAmazon" },
  { key: "products[0].stats.stockAmount", name: "stockAmount" }, //  The stock of the Amazon offer, if available. Otherwise undefined.
  { key: "products[0].stats.stockBuyBox", name: "stockBuyBox" }, // he stock of the buy box offer, if available. Otherwise undefined.
  { key: "products[0].stats.totalOfferCount", name: "totalOfferCount" }, // The total count of offers for this product (all conditions combined). The offer count per condition can be found in the current field.
];

export const packageSize = {
  smallEnvelope: {
    maxWeight: 80,
    longest: 200,
    median: 150,
    shortest: 10,
  },
  standardEnvelope: {
    maxWeight: 460,
    longest: 330,
    median: 230,
    shortest: 25,
  },
  bigEnvelope: {
    maxWeight: 960,
    longest: 330,
    median: 230,
    shortest: 40,
  },
  extraEnvelope: {
    maxWeight: 960,
    longest: 330,
    median: 230,
    shortest: 60,
  },
  small: {
    maxWeight: 3900,
    longest: 350,
    shortest: 120,
    median: 250,
  },
  standard: {
    maxWeight: 11900,
    longest: 450,
    shortest: 260,
    median: 340,
  },
  smallOversize: {
    volumnWeight: 25820,
    packageWeight: 17600,
    longest: 610,
    shortest: 460,
    median: 460,
  },
  standardOversize: {
    volumnWeight: 86400,
    packageWeight: 29760,
    longest: 1200,
    shortest: 600,
    median: 600,
  },
  bigOversize: {
    packageWeight: 31500,
    shortest: 1200,
    longest: 1750,
  },
  extraOversize: {
    packageWeight: 31500,
    longest: 1750,
    perimeter: 360, //Umfang Eine Maßeinheit, die der längsten Seite + 2 x Breite + 2 x Höhe entspricht.
  },
};
