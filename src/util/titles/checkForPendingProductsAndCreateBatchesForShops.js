import { ObjectId } from "mongodb";
import { getArbispotterDb, getCrawlDataDb } from "../../services/db/mongo.js";
import {
  createBatch,
  retrieveBatch,
  uploadFile,
} from "../../services/openai/index.js";
import { createJsonlFile } from "../createJsonlFile.js";
import { retrieveProductsForBatchesForShops } from "./createBatchesForShops.js";

export const checkForPendingProductsAndCreateBatchesForShops = async () => {
  const crawlDataDb = await getCrawlDataDb();
  const spotterDb = await getArbispotterDb();
  const tasksCol = crawlDataDb.collection("tasks");
  const newBatchFileContents = await retrieveProductsForBatchesForShops();

  if (!newBatchFileContents) return "No new batches found";

  newBatchFileContents.length &&
    console.log(
      "newBatchFileContents:\n",
      newBatchFileContents.map((newBatch) => {
        if (!newBatch) return;
        const { prompts, batchShops } = newBatch;
        return {
          prompts: prompts.length,
          batchShops,
        };
      })
    );
  try {
    for (let index = 0; index < newBatchFileContents.length; index++) {
      const newBatchFileContent = newBatchFileContents[index];
      const { hashes, batchShops, prompts, batchSize } = newBatchFileContent;
      const filepath = await createJsonlFile(prompts);
      const file = await uploadFile(filepath);
      if (file.id) {
        const batch = await createBatch(file.id);
        let batchStatus = batch.status;
        // check status of batch every 15 seconds
        let success = false;
        let failed = false;
        let cnt = 0;
        while (!success) {
          cnt++;
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const _batchStatus = await retrieveBatch(batch.id);
          if (
            _batchStatus.status === "in_progress" ||
            _batchStatus.status === "completed"
          ) {
            success = true;
            batchStatus = _batchStatus.status;
          }
          if (_batchStatus.status === "failed") {
            failed = true;
            break;
          }
          if (cnt > 100) {
            break;
          }
        }
        if (success) {
          console.log(batch.id, " started successfully!");

          for (let index = 0; index < batchShops.length; index++) {
            const batchShop = batchShops[index];
            const hashesForShop = hashes.get(batchShop);
            await spotterDb.collection(batchShop).updateMany(
              { _id: { $in: hashesForShop.map((id) => new ObjectId(id)) } },
              {
                $set: {
                  nm_prop: "in_progress",
                  nm_batchId: batch.id,
                  nm_v: "v01",
                },
              }
            );
          }

          await tasksCol.updateOne(
            { type: "MATCH_TITLES" },
            {
              $push: {
                batches: {
                  batchId: batch.id,
                  shopDomains: batchShops,
                  count: batchSize,
                  filepath,
                  processed: false,
                  status: batchStatus,
                },
              },
            }
          );
        }
      }
    }
  } catch (error) {
    console.log("Error in checkForPendingProductsAndCreateBatches", error);
  }
};
