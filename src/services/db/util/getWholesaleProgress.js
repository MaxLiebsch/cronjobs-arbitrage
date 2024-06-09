import { getCrawlerDataDb } from "../mongo.js";

const collectionName = "wholesale";

export const getProductsToLookupCount = async (taskId) => {
  const db = await getCrawlerDataDb();
  const wholesaleCollection = db.collection(collectionName);
  return wholesaleCollection.count({
    taskId: taskId.toString(),
    locked: false,
    lookup_pending: true,
  });
};

export const getWholesaleProgress = async (taskId, total) => {
  const pending = await getProductsToLookupCount(taskId);
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
