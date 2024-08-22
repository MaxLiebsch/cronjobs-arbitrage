import { getCrawlDataDb } from "../mongo.js";

export const updateTaskWithQuery = async (query, update) => {
    const db = await getCrawlDataDb();
    const collection = db.collection('tasks');
    return collection.updateOne(query, {
      $set: {
        ...update,
      },
    });
  };