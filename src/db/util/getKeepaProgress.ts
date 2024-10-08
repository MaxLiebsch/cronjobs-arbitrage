import { Shop } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../mongo.js";
import { pendingKeepaProductsQuery } from "../queries.js";
import { PendingShops } from "../../types/shops.js";

export const getAmazonProductCount = async (domain: string) => {
  const productCol = await getProductsCol();
  return productCol.countDocuments({
    $and: [
      { sdmn: domain },
      { asin: { $exists: true, $ne: "" } },
      { a_prc: { $gt: 0 } },
      { a_mrgn_pct: { $gt: 0 } },
    ],
  });
};

export const getAmazonProductsToUpdateKeepaCount = async (domain: string) => {
  const productCol = await getProductsCol();
  return productCol.countDocuments(pendingKeepaProductsQuery(domain));
};

export const getKeepaProgress = async (domain: string) => {
  const pending = await getAmazonProductsToUpdateKeepaCount(domain);
  const total = await getAmazonProductCount(domain);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};

export async function getKeepaProgressPerShop(
  activeShops: Shop[]
): Promise<PendingShops> {
  return await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await getKeepaProgress(shop.d);
        return { pending: progress.pending, d: shop.d };
      })
    )
  );
}
