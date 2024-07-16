import {
  deleteFile,
  retrieveBatch,
  retrieveOutputFile,
} from "../services/openai/index.js";
import { processFailedBatch } from "./processFailedBatch.js";
import { processResults } from "./processResults.js";
import { getCrawlDataDb } from "../services/db/mongo.js";
import fsjetpack from "fs-jetpack";
import { NotFoundError } from "openai";
const { remove } = fsjetpack;

export const checkAndProcessBatches = async (batchesData) => {
  if (!batchesData.length) {
    console.info("No batches to process");
    return 'processed';
  }
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  for (let index = 0; index < batchesData.length; index++) {
    const batchData = batchesData[index];
    const { filepath, batchId, status } = batchData;
    try {

      const batch = await retrieveBatch(batchId);
      if (batch.status === status || batchData.status === "done") continue;
      if (batch.status === "completed") {
        const fileContents = await retrieveOutputFile(batch.output_file_id);

        await processResults(fileContents, batchData);

        // clean up
        await deleteFile(batch.input_file_id);
        await deleteFile(batch.output_file_id);
        remove(filepath);
        return "processed";
      }
      if (batch.status === "failed") {
        await deleteFile(batch.input_file_id);
        await processFailedBatch(batchData);
      }
      await tasksCol.updateOne(
        { type: "DETECT_QUANTITY", "batches.batchId": batchId },
        {
          $set: {
            "batches.$.status": batch.status,
          },
        }
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      if (error instanceof NotFoundError) {
        console.error("Batch not found: ", batchId);
      }
    }
  }
};
