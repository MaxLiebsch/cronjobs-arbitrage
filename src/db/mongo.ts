import { DbProductRecord, SiteMap } from "@dipmaxtech/clr-pkg";
import clientPool from "./mongoPool.js";
import os from "os";
export const arbispotter_db = "arbispotter";
export const crawl_data_db = "crawler-data";
export const sitemapcollectionName = "sitemaps";
export const tasksCollectionName = "tasks";
export const logsCollectionName = "logs";
export const productsCollectionNams = "products";
export const shopCollectionName = "shops";
export const wholesaleCollectionName = "wholesale";
export const salesDbName = "sales";
export const hostname = os.hostname();

export const getCrawlDataCollection = async (name: string) => {
  const client = await clientPool[crawl_data_db];
  return client.db().collection(name);
};

export const getProductsCol = async () => {
  const db = await getArbispotterDb();
  return db.collection<DbProductRecord>(productsCollectionNams);
};

export const getArbispotterDb = async () => {
  const client = await clientPool[arbispotter_db];
  return client.db();
};

export const getCrawlDataDb = async () => {
  const client = await clientPool[crawl_data_db];
  return client.db();
};

