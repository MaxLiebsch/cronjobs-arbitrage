import { Shop } from "@dipmaxtech/clr-pkg";
import { getArbispotterDb } from "../mongo.js";
import {
  recoverFallbackKeepaProductsQuery,
  recoverKeepaProductsQuery,
} from "../queries.js";

export async function keepaTaskRecovery(activeShops: Shop[]) {
  const db = await getArbispotterDb();

  return await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await db
          .collection(shop.d)
          .countDocuments(recoverKeepaProductsQuery);
        return { pending: progress, d: shop.d };
      })
    )
  );
}

export async function keepaEanTaskRecovery(activeShops: Shop[]) {
  const db = await getArbispotterDb();

  return await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await db
          .collection(shop.d)
          .countDocuments(recoverFallbackKeepaProductsQuery);
        return { pending: progress, d: shop.d };
      })
    )
  );
}
