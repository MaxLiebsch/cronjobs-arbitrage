import { getCrawlerDataDb } from "../mongo.js";

const collectionName = "asinean";

export const createOrUpdateAsinRecord = async (asin, eanList) => {
  const asinRecord = await findAsin();
};

export const findAsin = async (asin) => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ asin });
};

export const upsertAsin = async (asin, eanList) => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  return collection.updateOne(
    { asin },
    {
      $addToSet: {
        eans: { $each: eanList },
      },
      $set: {
        updatedAt: new Date().toISOString(),
      },
    },
    {
      upsert: true,
    }
  );
};
