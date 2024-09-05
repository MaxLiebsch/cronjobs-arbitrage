import { getCrawlDataDb } from "../../services/db/mongo.js";
import { safeJSONParse } from "../safeParseJson.js";

import "dotenv/config";
import { config } from "dotenv";
config({
  path: [`.env`],
});

import fsjetpack from "fs-jetpack";
import { ObjectId } from "mongodb";
const { readAsync } = fsjetpack;

export const processFailedBatch = async (batchData) => {
  const fileContents = await readAsync(batchData.filepath, "utf8");
  const results = fileContents
    .split("\n")
    .filter(Boolean)
    .map(safeJSONParse)
    .filter(Boolean);
  const hashes = results.map((r) => r.custom_id.split("-")[1]);
  const crawlDataDb = await getCrawlDataDb();
  await crawlDataDb.collection(batchData.shopDomain).updateMany(
    { _id: { $in: hashes.map((id) => new ObjectId(id)) } },
    {
      $set: { qty_prop: "", qty_batchId: "" },
    }
  );
};
