import { getProductsCol } from "../db/mongo.js";

import { ObjectId, safeJSONParse } from "@dipmaxtech/clr-pkg";
import { config } from "dotenv";
import "dotenv/config";
import pkg from 'fs-jetpack';
import { BatchResults } from "../types/batchResult.js";
import { Batch, BatchTaskTypes } from "../types/tasks.js";
import { extractId } from "./extractId.js";
config({
  path: [`.env`],
});
const { readAsync } = pkg;

export const processFailedBatch = async (
  batchData: Batch,
  batchTaskType: BatchTaskTypes
) => {
  const fileContents = await readAsync(batchData.filepath, "utf8");
  const results = fileContents!
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean) as BatchResults;

  const batchMap = new Map<string, BatchResults>();
  results.forEach((result) => {
    const shopDomain = result.custom_id.split("-")[0];
    if (!batchMap.has(shopDomain)) {
      batchMap.set(shopDomain, []);
    }
    batchMap.get(shopDomain)!.push(result);
  });

  const productIds = results.map(
    (r) => new ObjectId(extractId(r.custom_id))
  );
  const productCol = await getProductsCol();
  let unset: any = {
    nm_prop: "",
  };
  if (batchTaskType === "DETECT_QUANTITY") {
    unset = {
      qty_prop: "",
    };
  }
  await productCol.updateMany(
    { _id: { $in: productIds } },
    {
      $unset: { ...unset },
    }
  );
};
