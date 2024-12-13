import {
  deleteFile,
  retrieveBatch,
  retrieveOutputFile,
} from "../services/openai/index.js";
import { processFailedBatch } from "./processFailedBatch.js";
import { getCrawlDataDb } from "../db/mongo.js";
import fsjetpack from "fs-jetpack";
import { NotFoundError, RateLimitError } from "openai";
import { processResultsForShops } from "./processResultsForShops.js";
import { Batch, BatchTaskTypes } from "../types/tasks.js";
import { CJ_LOGGER, logGlobal } from "./logger.js";
const { remove } = fsjetpack;

const loggerName = CJ_LOGGER.BATCHES;

// Define the retry function
async function retry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1 || !(error instanceof NotFoundError)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries reached");
}

export const checkAndProcessBatchesForShops = async (
  batchesData: Batch[],
  batchTaskType: BatchTaskTypes
) => {
  if (!batchesData.length) {
    logGlobal(loggerName, "No batches to process for " + batchTaskType);
    return "processed";
  }
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  let inProgress = false;
  while (batchesData.length > 0) {
    const batchData = batchesData.pop()!;

    const { filepath, batchId, status, processed } = batchData;
    try {
      const batch = await retry(() => retrieveBatch(batchId), 3, 2500);
      if (batch.status === "in_progress" || batch.status === "finalizing") {
        inProgress = true;
      }
      if (batch.status === "completed" && !processed) {
        logGlobal(
          loggerName,
          "Processing completed batch " +
            batchId +
            " for " +
            batchTaskType +
            "..."
        );
        if (batch.output_file_id) {
          const fileContents = await retrieveOutputFile(batch.output_file_id);
          await processResultsForShops(fileContents, batchData, batchTaskType);
        }
        // clean up
        if (batch.input_file_id && batch.output_file_id) {
          await deleteFile(batch.input_file_id);
          await deleteFile(batch.output_file_id);
        }
        remove(filepath);
      }
      if (
        batch.status === "failed" ||
        batch.status === "expired" ||
        batch.status === "cancelled"
      ) {
        await deleteFile(batch.input_file_id);
        await processFailedBatch(batchData, batchTaskType);
        await tasksCol.updateOne(
          { type: batchTaskType, "batches.batchId": batchId },
          {
            $pull: {
              batches: { batchId },
            },
          }
        );
        continue;
      }
      await tasksCol.updateOne(
        { type: batchTaskType, "batches.batchId": batchId },
        {
          $set: {
            "batches.$.status": batch.status,
          },
        }
      );
      if (batch.status === status) continue;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      if (error instanceof NotFoundError) {
        logGlobal(
          loggerName,
          "Batch not found: " + batchId + " " + error.message + " " + error.code
        );
      } else if (error instanceof RateLimitError) {
        logGlobal(
          loggerName,
          `Error processing batch ${batchId}: ${(error as Error).message} ${
            error.code
          }`
        );
      } else {
        logGlobal(
          loggerName,
          `Error processing batch ${batchId}: ${(error as Error).message}`
        );
      }
    }
  }

  if (!inProgress) return "processed";
};
