import { MAX_EARNING_MARGIN } from "../../../constants.js";
import { getArbispotterDb } from "../mongo.js";

// arbispotter amazon
export const getAmazonProductCount = async (shopProductCollectionName) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count({
    $and: [
      { a_prc: { $gt: 0 } },
      { a_mrgn_pct: { $gt: 0, $lte: MAX_EARNING_MARGIN } },
    ],
  });
};

export const getAmazonLookedupProductCount = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count({ a_props: "complete" });
};

export const getAmazonProductsToLookupCount = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count({
    $and: [
      {
        lckd: false,
      },
      {
        $and: [
          { a_prc: { $gt: 0 } },
          { a_mrgn_pct: { $gt: 0, $lte: MAX_EARNING_MARGIN } },
        ],
      },

      {
        $or: [
          { a_props: { $exists: false } },
          { a_props: { $in: ["incomplete"] } },
        ],
      },
    ],
  });
};

export const getAmazonLookupProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain;
  const pending = await getAmazonProductsToLookupCount(
    shopProductCollectionName
  );
  const total = await getAmazonProductCount(shopProductCollectionName);
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
