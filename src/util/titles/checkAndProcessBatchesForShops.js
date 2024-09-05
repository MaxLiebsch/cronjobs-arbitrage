import {
  deleteFile,
  retrieveBatch,
  retrieveOutputFile,
} from "../../services/openai/index.js";
import { processFailedBatch } from "./processFailedBatch.js";
import { getCrawlDataDb } from "../../services/db/mongo.js";
import fsjetpack from "fs-jetpack";
import { NotFoundError } from "openai";
import { processResultsForShops } from "./processResultsForShops.js";
import { TASK_TYPES } from "../../services/productBatchProcessing.js";
const { remove } = fsjetpack;

export const checkAndProcessBatchesForShops = async (batchesData) => {
  if (!batchesData.length) {
    console.info("No batches to process for " + TASK_TYPES.MATCH_TITLES);
    return "processed";
  }
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  let inProgress = false;
  while (batchesData.length > 0) {
    const batchData = batchesData.pop();
    const { filepath, batchId, status, processed } = batchData;
    try {
      const batch = await retrieveBatch(batchId);
      if (batch.status === "in_progress") {
        inProgress = true;
      }
      if (batch.status === "completed" && !processed) {
        console.log(
          "Processing completed batch ",
          batchId,
          " for " + TASK_TYPES.MATCH_TITLES,
          "..."
        );
        const fileContents = await retrieveOutputFile(batch.output_file_id);
        await processResultsForShops(fileContents, batchData);
        // clean up
        await deleteFile(batch.input_file_id);
        await deleteFile(batch.output_file_id);
        remove(filepath);
      }
      if (batch.status === status) continue;
      if (batch.status === "failed") {
        await deleteFile(batch.input_file_id);
        await processFailedBatch(batchData);
      }
      await tasksCol.updateOne(
        { type: TASK_TYPES.MATCH_TITLES, "batches.batchId": batchId },
        {
          $set: {
            "batches.$.status": batch.status,
          },
        }
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      if (error instanceof NotFoundError) {
        console.error("Batch not found: ", batchId, "deleting batch");
        await tasksCol.updateOne(
          { type: TASK_TYPES.MATCH_TITLES },
          {
            $pull: {
              batches: { batchId },
            },
          }
        );
      }
    }
  }

  if (!inProgress) return "processed";
};
