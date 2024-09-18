import { Filter, UpdateFilter } from "@dipmaxtech/clr-pkg";
import { getCrawlDataDb } from "../mongo.js";

export const updateTaskWithQuery = async (
  query: Filter<any>,
  update: UpdateFilter<any>
) => {
  const db = await getCrawlDataDb();
  const collection = db.collection("tasks");
  return collection.updateOne(query, {
    $set: {
      ...update,
    },
  });
};
