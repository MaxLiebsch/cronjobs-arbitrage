import { getArbispotterDb, getCrawlDataDb } from "../db/mongo.js";
import {
  createBatch,
  retrieveBatch,
  uploadFile,
} from "../services/openai/index.js";
import { retrieveProductsForBatchesForShops } from "./retrieveProductsForBatchesForShops.js";
import { CURRENT_MATCH_TITLES_PROMPT_VERSION } from "../services/matchTitelsBatchForShops.js";
import { createJsonlFile } from "./createJsonlFile.js";
import { BatchTaskTypes } from "../types/tasks.js";
import { CURRENT_DETECT_QUANTITY_PROMPT_VERSION } from "../services/detectQuantityBatchForShops.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";

const loggerName = CJ_LOGGER.BATCHES;

export const checkForPendingProductsAndCreateBatchesForShops = async (
  batchTaskType: BatchTaskTypes
) => {
  const crawlDataDb = await getCrawlDataDb();
  const spotterDb = await getArbispotterDb();
  const tasksCol = crawlDataDb.collection("tasks");
  const newBatchFileContents = await retrieveProductsForBatchesForShops(
    batchTaskType
  ); 

  if (!newBatchFileContents) return "No new batches found";

  newBatchFileContents.length &&
    logGlobal(
      loggerName,
      `${batchTaskType}: ${
        newBatchFileContents[0].prompts.length
      } prompts needed ${newBatchFileContents[0].batchShops.join(", ")}`
    );
  try {
    for (let index = 0; index < newBatchFileContents.length; index++) {
      const newBatchFileContent = newBatchFileContents[index];
      const { productIds, batchShops, prompts, batchSize } =
        newBatchFileContent;
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
          logGlobal(
            loggerName,
            batchTaskType + " " + batch.id + " started successfully!"
          );
          for (let index = 0; index < batchShops.length; index++) {
            const batchShop = batchShops[index];
            const hashesForShop = productIds.get(batchShop);
            await spotterDb.collection(batchShop).updateMany(
              { _id: { $in: hashesForShop! } },
              {
                $set: {
                  nm_prop: "in_progress",
                  nm_batchId: batch.id,
                  nm_v:
                    batchTaskType === "MATCH_TITLES"
                      ? CURRENT_MATCH_TITLES_PROMPT_VERSION
                      : CURRENT_DETECT_QUANTITY_PROMPT_VERSION,
                },
              }
            );
          }

          const result = await tasksCol.updateOne(
            { type: batchTaskType },
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
          logGlobal(
            loggerName,
            `Batch created. ${
              result.acknowledged && result.modifiedCount
                ? "Task updated"
                : "Task not updated"
            }`
          );
        }
      }
    }
  } catch (error) {
    console.log('error:', error)
    logGlobal(
      loggerName,
      "Error in checkForPendingProductsAndCreateBatches" +
        (error as Error)?.message
    );
  }
};
