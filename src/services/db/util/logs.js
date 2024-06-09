import { getCrawlerDataDb, hostname, logsCollectionName } from "../mongo.js";

export const deleteLogs = async () => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(logsCollectionName);
  return collection.deleteMany({});
};

export const getLogs = async (query) => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(logsCollectionName);

  return collection.find(query).toArray();
};
