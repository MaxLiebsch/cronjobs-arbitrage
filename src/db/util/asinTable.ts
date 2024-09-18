import { Costs } from "@dipmaxtech/clr-pkg";
import { getCrawlDataDb } from "../mongo.js";
import { UTCDate } from "@date-fns/utc";
const collectionName = "asinean";

export const findAsin = async (asin: string) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ asin });
};

export const findEan = async (ean: string) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ eans: ean });
};

export const upsertAsin = async (asin: string, eanList: string[]) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);

  return collection.updateOne(
    { asin },
    {
      $addToSet: {
        eans: { $each: eanList },
      },
      $set: {
        updatedAt: new UTCDate().toISOString(),
      },
    },
    {
      upsert: true,
    }
  );
};
