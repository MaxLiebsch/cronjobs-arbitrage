import { ObjectId } from "mongodb";
import { getArbispotterDb, getCrawlDataDb } from "../../services/db/mongo.js";
import { safeJSONParse } from "../safeParseJson.js";

export const processResults = async (fileContents, batchData) => {
  const { shopDomain, batchId } = batchData;
  const results = fileContents
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean);

  const crawlDataDb = await getCrawlDataDb();
  const spotterDb = await getArbispotterDb();
  const bulkSpotterUpdates = [];
  const hashes = results.map((result) => result.custom_id.split("-")[1]);
  const products = await spotterDb
    .collection(shopDomain)
    .find({ _id: { $in: hashes.map((id) => new ObjectId(id)) } })
    .toArray();

  if (!products.length)
    throw new Error("No products found for batch " + batchId);

  for (let index = 0; index < results.length; index++) {
    const spotterSet = {};
    const result = results[index];
    const id = result.custom_id.split("-")[1];

    const product = products.find((product) => product._id.toString() === id);

    if (!product) continue;

    const { a_vrfd, e_vrfd } = product;

    const content = result.response.body?.choices[0].message.content;
    if (!content) continue;

    const update = safeJSONParse(content);
    if (!update) continue;

    let nm_prop = "complete";

    if ("a_score" && "a_isMatch" in update) {
      if (a_vrfd) {
        spotterSet["a_vrfd"] = {
          ...a_vrfd,
          nm_prop,
          score: update.a_score,
          isMatch: update.a_isMatch,
        };
      } else {
        spotterSet["a_vrfd"] = {
          nm_prop,
          score: update.a_score,
          isMatch: update.a_isMatch,
        };
      }
    }

    if ("e_score" && "e_isMatch" in update) {
      if (e_vrfd) {
        spotterSet["e_vrfd"] = {
          ...e_vrfd,
          nm_prop,
          score: update.e_score,
          isMatch: update.e_isMatch,
        };
      } else {
        spotterSet["e_vrfd"] = {
          nm_prop,
          score: update.e_score,
          isMatch: update.e_isMatch,
        };
      }
    }
    const bulkUpdate = {
      updateOne: {
        filter: { _id: new ObjectId(id) },
        update: {
          $set: {
            ...spotterSet,
            nm_updatedAt: new Date().toISOString(),
          },
          $unset: { nm_batchId: "", nm_prop: "" },
        },
      },
    };
    bulkSpotterUpdates.push(bulkUpdate);
  }
  const tasksCol = crawlDataDb.collection("tasks");
  const taskUpdate = await tasksCol.updateOne(
    { type: "MATCH_TITLES", "batches.batchId": batchId },
    {
      $pull: {
        batches: { batchId },
      },
    }
  );
  await spotterDb.collection(shopDomain).bulkWrite(bulkSpotterUpdates);
};
