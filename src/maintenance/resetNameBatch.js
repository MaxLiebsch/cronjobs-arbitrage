import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { getAllShops } from "../services/db/util/shops.js";

const resetNameBatch = async () => {
  const spotter = await getArbispotterDb();
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  await tasksCol.updateOne(
    { type: "MATCH_TITLES" },
    {
      $set: {
        batches: [],
      }
    }
  );
  const shops = await getAllShops();
  const activeShops = shops.filter((shop) => shop.active);

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    await spotter
      .collection(shop.d)
      .updateMany(
        {},
        { $unset: { a_vrfd: "", e_vrfd: "", nm_batchId: "", nm_prop: "" } }
      );
  }
};

resetNameBatch().then((r) => {
  process.exit(0);
});
