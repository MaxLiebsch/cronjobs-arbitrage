import { Shop } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../mongo.js";
import {
  recoverFallbackKeepaProductsQuery,
  recoverKeepaProductsQuery,
} from "../queries.js";

export async function keepaTaskRecovery(activeShops: Shop[]) {
  const productCol = await getProductsCol();

  return await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await productCol.countDocuments(
          recoverKeepaProductsQuery(shop.d)
        );
        return { pending: progress, d: shop.d };
      })
    )
  );
}

export async function keepaEanTaskRecovery(activeShops: Shop[]) {
  const productCol = await getProductsCol();

  return await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await productCol.countDocuments(
          recoverFallbackKeepaProductsQuery(shop.d)
        );
        return { pending: progress, d: shop.d };
      })
    )
  );
}
