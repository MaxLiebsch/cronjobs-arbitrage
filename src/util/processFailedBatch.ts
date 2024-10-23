import { getCrawlDataDb, getProductsCol } from "../db/mongo.js";

import "dotenv/config";
import { config } from "dotenv";
config({
  path: [`.env`],
});

import fsjetpack from "fs-jetpack";
import { Batch, BatchTaskTypes } from "../types/tasks.js";
import { ObjectId, safeJSONParse } from "@dipmaxtech/clr-pkg";
import { BatchResults } from "../types/batchResult.js";
const { readAsync } = fsjetpack;

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
    (r) => new ObjectId(r.custom_id.split("-")[1])
  );
  const productCol = await getProductsCol();
  let unset: any = {
    nm_prop: "",
    nm_batchId: "",
  };
  if (batchTaskType === "DETECT_QUANTITY") {
    unset = {
      qty_prop: "",
      nm_batchId: "",
    };
  }
  await productCol.updateMany(
    { _id: { $in: productIds } },
    {
      $unset: { ...unset },
    }
  );
};
