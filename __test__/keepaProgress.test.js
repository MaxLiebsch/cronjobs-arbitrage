import { getKeepaProgress } from "../src/db/util/getKeepaProgress.js";
import { getActiveShops } from "../src/db/util/shops.js";

const main = async () => {
  const activeShops = await getActiveShops();

  const keepaProgressPerShop = await Promise.all(
    Object.values(
      activeShops.map(async (shop) => {
        const progress = await getKeepaProgress(shop.d);
        return { pending: progress.pending, d: shop.d };
      })
    )
  );
  console.log(keepaProgressPerShop);
};

main().then()
