import { MongoBulkWriteError, ObjectId } from "mongodb";
import { getArbispotterDb, getCrawlDataDb } from "../../services/db/mongo.js";
import { safeJSONParse } from "../safeParseJson.js";
import { resetAznProductQuery } from "../../services/aznQueries.js";
import { resetEbyProductQuery } from "../../services/ebyQueries.js";
import { MINIMAL_SCORE } from "../../constants.js";

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

      if (!products.length)
        throw new Error("No products found for batch " + batchId);

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

        if ("a_score" && "a_isMatch" in update) {
          if (Number(update.a_score) < MINIMAL_SCORE) {
            deleteAzn = true;
          } else {
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
        }

        if ("e_score" && "e_isMatch" in update) {
          if (Number(update.e_score) < MINIMAL_SCORE) {
            deleteEby = true;
          } else {
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
    }),
  ]);

  const tasksCol = crawlDataDb.collection("tasks");
  await tasksCol.updateOne(
    { type: "MATCH_TITLES", "batches.batchId": batchId },
    {
      $pull: {
        batches: { batchId },
      },
    }
  );
};
