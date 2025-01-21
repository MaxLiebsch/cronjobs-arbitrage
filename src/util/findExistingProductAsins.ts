import { getCrawlDataCollection } from "../db/mongo.js";

export const findExistingProductAsins = async (eans: string[]) => {
  const eanAsinTable = await getCrawlDataCollection("asinean");
  const eanAsinMatches = await eanAsinTable
    .aggregate([
      {
        $match: {
          $and: [
            {
              eans: { $in: eans },
            },
            { asin: { $exists: true, $ne: null } },
          ],
        },
      },
      { $group: { _id: "$eans", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ])
    .toArray();
  return eanAsinMatches;
};
