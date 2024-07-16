import { getCrawlDataDb } from "../services/db/mongo.js";
import {
  createBatch,
  retrieveBatch,
  uploadFile,
} from "../services/openai/index.js";
import { retrieveProductsForBatches } from "./createBatches.js";
import { createJsonlFile } from "./createJsonlFile.js";

export const checkForPendingProductsAndCreateBatches = async () => {
  console.log('WHY IS THIS NOT RUNNING?')
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  console.log('tasksCol:', tasksCol)
  const newBatchFileContents = await retrieveProductsForBatches();
  console.log('newBatchFileContents:', newBatchFileContents.length)
  newBatchFileContents.length &&
    console.log(
      "newBatchFileContents:\n",
      newBatchFileContents.map((newBatch) => {
        const { shopDomain, prompts, hashes } = newBatch;
        return {
          shopDomain,
          prompts: prompts.length,
          hashes: hashes.length,
        };
      })
    );

  for (let index = 0; index < newBatchFileContents.length; index++) {
    const newBatchFileContent = newBatchFileContents[index];
    const { hashes, shopDomain, prompts } = newBatchFileContent;
    const filepath = await createJsonlFile(shopDomain, prompts);
    const file = await uploadFile(filepath);
    if (file.id) {
      const batch = await createBatch(file.id);
      let batchStatus = batch.status
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
        console.log(
          shopDomain,
          " - ",
          batch.id,
          " started successfully!"
        );
        await crawlDataDb
          .collection(shopDomain)
          .updateMany(
            { s_hash: { $in: hashes } },
            { $set: { qty_prop: "in_progress", qty_batchId: batch.id } }
          );
        await tasksCol.updateOne(
          { type: "DETECT_QUANTITY" },
          {
            $push: {
              batches: {
                batchId: batch.id,
                shopDomain,
                count: hashes.length,
                filepath,
                status: batchStatus,
              },
            },
          }
        );
      }
    }
  }
};
