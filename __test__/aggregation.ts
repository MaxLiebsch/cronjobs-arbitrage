import { quantityAggregation } from "../src/util/quantities/quantityAggregation.js";
import { getArbispotterDb } from "../src/db/mongo.js";

const main = async () => {
  const db = await getArbispotterDb();
  db.collection("gamestop.de")
    .aggregate(quantityAggregation(500))
    .toArray()
    .then(console.log);
//   console.log(JSON.stringify(quantityAggregation(10), null, 2));
};
main();
