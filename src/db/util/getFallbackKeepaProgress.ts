import { Shop } from "@dipmaxtech/clr-pkg";
import { MAX_EARNING_MARGIN } from "../../constants.js";
import {  getProductsCol } from "../mongo.js";
import { pendingFallbackKeepaProductsQuery } from "../queries.js";
import { PendingShops } from "../../types/shops.js";

export const getAmazonProductCount = async (domain: string) => {
  const productCol = await getProductsCol();
  return productCol.countDocuments({
    $and: [
      { sdmn: domain },
      { asin: { $exists: true, $ne: "" } },
      { a_prc: { $gt: 0 } },
      { a_mrgn_pct: { $gt: 0, $lte: MAX_EARNING_MARGIN } },
    ],
  });
};

export const getAmazonFallbackProductsToUpdateKeepaCount = async (
  domain: string
) => {
  const productCol = await getProductsCol();
  return productCol.countDocuments(pendingFallbackKeepaProductsQuery(domain));
};

export const getFallbackKeepaProgress = async (domain: string) => {
  const pending = await getAmazonFallbackProductsToUpdateKeepaCount(domain);
  const total = await getAmazonProductCount(domain);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};

export async function getKeepaEanProgressPerShop(
  activeShops: Shop[]
): Promise<PendingShops> {
  return await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await getFallbackKeepaProgress(shop.d);
        return { pending: progress.pending, d: shop.d };
      })
    )
  );
}
