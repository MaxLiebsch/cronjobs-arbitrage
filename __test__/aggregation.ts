import { quantityAggregation } from "../src/util/quantities/quantityAggregation.js";
import { getArbispotterDb } from "../src/db/mongo.js";
import { titleAggregation } from "../src/util/titles/titleAggregation.js";

const main = async () => {
  const db = await getArbispotterDb();
  db.collection("gamestop.de")
    .aggregate(quantityAggregation(990, 'gamestop.de'))
    .toArray()
    .then((r) => console.log(r.length));
  //   console.log(JSON.stringify(quantityAggregation(10), null, 2));
};
main();
