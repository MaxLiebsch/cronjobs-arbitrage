import { getCrawlerDataDb } from "../mongo.js";

//crawler-data
export const getProductsToMatchCount = async (shopProductCollectionName) => {
  const twentyFourAgo = new Date();
  twentyFourAgo.setHours(twentyFourAgo.getHours() - 24);
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count({
    $and: [
      { matched: false, locked: false },
      {
        $or: [
          { matchedAt: { $exists: false } },
          { matchedAt: { $lte: twentyFourAgo.toISOString() } },
        ],
      },
    ],
  });
};

export const getProductCount = async (shopProductCollectionName) => {
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count();
};

export const getMatchedProductCount = async (shopProductCollectionName) => {
  const twentyFourAgo = new Date();
  twentyFourAgo.setHours(twentyFourAgo.getHours() - 24);
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count({
    $and: [
      { matched: true },
      { matchedAt: { $gt: twentyFourAgo.toISOString() } },
    ],
  });
};

export const getMatchingProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain + ".products";
  const pending = await getProductsToMatchCount(shopProductCollectionName);
  const total = await getProductCount(shopProductCollectionName);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};