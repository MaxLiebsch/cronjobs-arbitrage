import { getCrawlDataDb } from "../services/db/mongo.js";

const updateTask = async (batch) => {
  const crawlDataDb = await getCrawlDataDb();
  const tasksCol = crawlDataDb.collection("tasks");
  const result = await tasksCol.updateOne(
    { type: "DETECT_QUANTITY", "batches.batchId": batch.id },
    {
      $set: {
        "batches.$.status": batch.status,
      },
    }
  );
  console.log("result:", result);
};

updateTask({ id: "batch_CGnIPJFFZ8FbIwlqYp80oqO0", status: "done" }).then();
