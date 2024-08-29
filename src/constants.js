export const KEEPA_RATE_LIMIT = 20;
export const MAX_EARNING_MARGIN = 150;
export const KEEPA_MINUTES = 20;
export const PRODUCTS_PER_MINUTE = 60;
export const MAX_RETRIES = 3;
export const MAX_AGE_PRODUCTS = 21;
export const MAX_AGE_PROPS = 7;
export const PENDING_KEEPA_LOOKUPS_INTERVAL = 1000 * 60 * KEEPA_MINUTES;
export const CHECK_PACKAGE_BATCH_INTERVAL =
  process.env.NODE_ENV === "production" ? 1000 * 60 * 1.5 : 1000 * 60 * 0.5;
export const TOKEN_LIMIT = 160000;
export const MAX_PACKAGE_SIZE = 11;
export const BATCH_SIZE = process.env.NODE_ENV === "development" ? 50 : 500;
export const MINIMAL_SCORE = 0.6;
export const keepaProperties = [
  { key: "products[0].asin", name: "" },
  { key: "products[0].categories", name: "" },
  { key: "products[0].eanList", name: "k_eanList" },
  { key: "products[0].brand", name: "" },
  { key: "products[0].numberOfItems", name: "" },
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
  { key: "products[0].stats.avg30[0]", name: "avg30_ahsprcs" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[1]", name: "avg30_ansprcs" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[2]", name: "avg30_ausprcs" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg30[3]", name: "avg30_salesRank" }, // Average of the Amazon history prices of the last 30 days
  { key: "products[0].stats.avg90[0]", name: "avg90_ahsprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[1]", name: "avg90_ansprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[2]", name: "avg90_ausprcs" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.avg90[3]", name: "avg90_salesRank" }, // Average of the Amazon history prices of the last 90 days
  { key: "products[0].stats.buyBoxIsAmazon", name: "buyBoxIsAmazon" },
  { key: "products[0].stats.stockAmount", name: "stockAmount" }, //  The stock of the Amazon offer, if available. Otherwise undefined.
  { key: "products[0].stats.stockBuyBox", name: "stockBuyBox" }, // he stock of the buy box offer, if available. Otherwise undefined.
  { key: "products[0].stats.totalOfferCount", name: "totalOfferCount" }, // The total count of offers for this product (all conditions combined). The offer count per condition can be found in the current field.
];
