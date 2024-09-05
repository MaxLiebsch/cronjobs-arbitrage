import { MongoBulkWriteError, ObjectId } from "mongodb";
import { getArbispotterDb, getCrawlDataDb } from "../../services/db/mongo.js";
import { safeJSONParse } from "../safeParseJson.js";
import { resetAznProductQuery } from "../../services/aznQueries.js";
import { resetEbyProductQuery } from "../../services/ebyQueries.js";
import { MINIMAL_SCORE } from "../../constants.js";
import { TASK_TYPES } from "../../services/productBatchProcessing.js";

export const cleanScore = (score) => {
  if (typeof score === "string") {
    // Remove extra double quotes
    score = score.replace(/^"+|"+$/g, "");
    return parseFloat(score);
  }
  return score;
};

export const processResultsForShops = async (fileContents, batchData) => {
  const { batchId } = batchData;
  const results = fileContents
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean);

  const crawlDataDb = await getCrawlDataDb();
  const spotterDb = await getArbispotterDb();
  const bulkSpotterUpdates = [];
  const batchMap = new Map();
  results.forEach((result) => {
    const shopDomain = result.custom_id.split("-")[0];
    if (!batchMap.has(shopDomain)) {
      batchMap.set(shopDomain, []);
    }
    batchMap.get(shopDomain).push(result);
  });

  await Promise.all([
    batchMap.forEach(async (results, shopDomain) => {
      const ids = results.map((result) => result.custom_id.split("-")[1]);
      const products = await spotterDb
        .collection(shopDomain)
        .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
        .toArray();

      if (products.length) {
        for (let index = 0; index < results.length; index++) {
          const spotterSet = {};
          let deleteAzn = false;
          let deleteEby = false;
          const result = results[index];
          const id = result.custom_id.split("-")[1];

          const product = products.find(
            (product) => product._id.toString() === id
          );

          if (!product) continue;

          const { a_vrfd, e_vrfd } = product;

          const content = result.response.body?.choices[0].message.content;
          if (!content) continue;

          const update = safeJSONParse(content);
          if (!update) continue;

          let nm_prop = "complete";

          if ("a_score" in update && "a_isMatch" in update) {
            const aScore = cleanScore(update.a_score);
            if (aScore < MINIMAL_SCORE) {
              deleteAzn = true;
            } else if (!isNaN(aScore)) {
              spotterSet["a_vrfd"] = {
                ...a_vrfd,
                nm_prop,
                score: aScore,
                isMatch: update.a_isMatch,
              };
            }
          }

          if ("e_score" in update && "e_isMatch" in update) {
            const eScore = cleanScore(update.e_score);
            if (eScore < MINIMAL_SCORE) {
              deleteEby = true;
            } else if (!isNaN(eScore)) {
              spotterSet["e_vrfd"] = {
                ...e_vrfd,
                nm_prop,
                score: eScore,
                isMatch: update.e_isMatch,
              };
            }
          }

          let bulkUpdate = {
            updateOne: {
              filter: { _id: new ObjectId(id) },
              update: {
                $unset: { nm_batchId: "", nm_prop: "" },
              },
            },
          };

          if (Object.keys(spotterSet).length > 0) {
            bulkUpdate.updateOne.update["$set"] = {
              ...spotterSet,
              nm_updatedAt: new Date().toISOString(),
            };
          }

          if (deleteAzn) {
            const resetAzn = resetAznProductQuery();
            bulkUpdate.updateOne.update["$unset"] = {
              ...bulkUpdate.updateOne.update.$unset,
              ...resetAzn.$unset,
            };
          }

          if (deleteEby) {
            const resetEby = resetEbyProductQuery();
            bulkUpdate.updateOne.update["$unset"] = {
              ...bulkUpdate.updateOne.update.$unset,
              ...resetEby.$unset,
            };
          }

          bulkSpotterUpdates.push(bulkUpdate);
        }
        try {
          await spotterDb.collection(shopDomain).bulkWrite(bulkSpotterUpdates);
        } catch (error) {
          console.error({
            name: "Error updating spotterDb: ",
            stack: `${error}`,
          });
          if (error instanceof MongoBulkWriteError) {
            console.log({
              name: "Mongo",
              error: JSON.stringify(error.writeErrors, null, 2),
            });
          }
        }
      }
    }),
  ]);

  const tasksCol = crawlDataDb.collection("tasks");
  await tasksCol.updateOne(
    { type: TASK_TYPES.MATCH_TITLES, "batches.batchId": batchId },
    {
      $pull: {
        batches: { batchId },
      },
    }
  );
};
