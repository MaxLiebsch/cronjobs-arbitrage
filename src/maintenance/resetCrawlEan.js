import { getActiveShops, getShops } from "../db/util/shops.js";
import "dotenv/config";
import { config } from "dotenv";
import { updateCrawlDataProducts } from "../db/util/crudCrawlDataProduct.js";

config({
  path: [`.env`],
});

const resetEanLookup = async () => {
  const activeShops = await getActiveShops();

  const filteredShops = activeShops.filter((shop) => shop.ean);

  const shops = await getShops(filteredShops);

  await Promise.all(
    Object.keys(shops).map(async (shopDomain) => {
      console.log(`Shop ${shopDomain} reseted`);
      return updateCrawlDataProducts(
        shopDomain,
        {},
        {
          $set: { ean_locked: false, ean: "", ean_taskId: ""},
          $unset: { ean_prop: "" },
        }
      );
    })
  );
};

resetEanLookup().then((r) => {
  process.exit(0);
});
