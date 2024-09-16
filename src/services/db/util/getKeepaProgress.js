import { MAX_EARNING_MARGIN } from "../../../constants.js";
import { getArbispotterDb } from "../mongo.js";
import { pendingKeepaProductsQuery } from "../queries.js";

// arbispotter amazon
export const getAmazonProductCount = async (shopProductCollectionName) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments({
    $and: [
      { asin: { $exists: true, $ne: "" } },
      { a_prc: { $gt: 0 } },
      { a_mrgn_pct: { $gt: 0, $lte: MAX_EARNING_MARGIN } },
    ],
  });
};

export const getAmazonProductsToUpdateKeepaCount = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(pendingKeepaProductsQuery);
};

export const getKeepaProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain;
  const pending = await getAmazonProductsToUpdateKeepaCount(
    shopProductCollectionName
  );
  const total = await getAmazonProductCount(shopProductCollectionName);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};

export async function getKeepaProgressPerShop(activeShops) {
  return await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await getKeepaProgress(shop.d);
        return { pending: progress.pending, d: shop.d };
      })
    )
  );
}
