import { Shop } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../mongo.js";
import { pendingFallbackKeepaProductsQuery } from "../queries.js";
import { PendingShops } from "../../types/shops.js";

export const getAmazonProductCount = async (domain: string) => {
  const productCol = await getProductsCol();
  return productCol.countDocuments({
    $and: [
      { sdmn: domain },
      { eanList: { $exists: true, $ne: [] } },
      {
        $or: [
          { info_prop: { $in: ["missing"] } },
          { "costs.azn": { $lte: 0.3 } },
        ],
      },
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
