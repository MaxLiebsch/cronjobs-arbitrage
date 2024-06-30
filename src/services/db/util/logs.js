import { getCrawlDataDb, hostname, logsCollectionName } from "../mongo.js";

export const deleteLogs = async () => {
  const db = await getCrawlDataDb();
  const collection = db.collection(logsCollectionName);
  return collection.deleteMany({});
};

export const getLogs = async (query) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(logsCollectionName);

  return collection.find(query).toArray();
};
