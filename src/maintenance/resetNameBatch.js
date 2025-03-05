import { getArbispotterDb, getCrawlDataDb } from "../db/mongo.js";
import { getActiveShops, getAllShops } from "../db/util/shops.js";

const resetNameBatch = async () => {
  const spotter = await getArbispotterDb();
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  await tasksCol.updateOne(
    { type: "MATCH_TITLES" },
    {
      $set: {
        batches: [],
      },
    }
  );
  const shops = await getActiveShops();

  if(!shops) {
    console.log("No active shops found");
    process.exit(0);
  }
  
  const activeShops = shops.filter((shop) => shop.active);

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    await spotter
      .collection(shop.d)
      .updateMany(
        {},
        {
          $unset: {
            a_vrfd: "",
            e_vrfd: "",
            nm_prop: "",
            qty_prop: "",
            qty_batchId: "",
          },
        }
      );
  }
};

resetNameBatch().then((r) => {
  process.exit(0);
});
