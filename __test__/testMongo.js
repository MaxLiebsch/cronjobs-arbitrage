import { getArbispotterDb } from "../src/services/db/mongo.js";
import { aggregation } from "../src/util/quantities/aggregation.js";

export const main = async () => {
  const spotterDb = await getArbispotterDb();
  const rawProducts = await spotterDb
    .collection("dm.de")
    .aggregate(aggregation)

    
  console.log("rawProducts:", rawProducts);
};

main().then((r) => {
  console.log("done");
  process.exit(0);
});
