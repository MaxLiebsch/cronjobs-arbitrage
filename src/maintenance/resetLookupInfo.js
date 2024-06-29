import {
  getActiveShops,
  getAllShops,
  getShops,
} from "../services/db/util/shops.js";
import "dotenv/config";
import { config } from "dotenv";
import { updateCrawlDataProducts } from "../services/db/util/crudCrawlDataProduct.js";

config({
  path: [`.env`],
});

const resetEanLookup = async () => {
  const activeShops = await getAllShops();

  const filteredShops = activeShops.filter((shop) => shop.ean || shop.hasEan);

  await Promise.all(
    filteredShops.map(async (shop) => {
      console.log(`Shop ${shop.d} reseted`);
      return updateCrawlDataProducts(
        shop.d,
        {},
        {
          $set: { info_taskId: "", info_locked: false },
          // $unset: { info_prop: ""  },
        }
      );
    })
  );
};

resetEanLookup().then((r) => {
  process.exit(0);
});
