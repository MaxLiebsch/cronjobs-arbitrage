import { getArbispotterDb } from "../mongo.js";
import { recoverFallbackKeepaProductsQuery, recoverKeepaProductsQuery } from "../queries.js";

export async function keepaTaskRecovery(activeShops) {
  const db = await getArbispotterDb();

  return await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await db
          .collection(shop.d)
          .count(recoverKeepaProductsQuery)
        return { pending: progress, d: shop.d };
      })
    )
  );
}


export async function keepaEanTaskRecovery(activeShops) {
    const db = await getArbispotterDb();
  
    return await Promise.all(
      Object.values(
        activeShops.map(async (shop) => {
          const progress = await db
            .collection(shop.d)
            .count(recoverFallbackKeepaProductsQuery)
          return { pending: progress, d: shop.d };
        })
      )
    );
  }
