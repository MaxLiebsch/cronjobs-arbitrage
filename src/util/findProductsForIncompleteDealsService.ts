import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../db/mongo.js";

export const findProductsForIncompleteDeals = async (
  batchSize: number,
  processingProducts?: Set<ObjectId>
) => {
  const aggregation = [];
  const col = await getProductsCol();

  const matchStage: { $match: any } = {
    $match: {
      $and: [
        { info_prop: "incomplete" },
        { asin: { $exists: true, $ne: null } },
      ],
    },
  };

  if (processingProducts && processingProducts.size > 0) {
    matchStage.$match.$and.push({
      _id: { $nin: [...processingProducts.keys()] },
    });
  }

  aggregation.push(matchStage);

  aggregation.push(
    {
      $group: {
        _id: {
          field2: "$asin",
        },
        document: { $first: "$$ROOT" },
      },
    },
    {
      $replaceRoot: { newRoot: "$document" },
    }
  );

  aggregation.push({ $limit: batchSize });

  return (await col.aggregate(aggregation).toArray()) as DbProductRecord[];
};
