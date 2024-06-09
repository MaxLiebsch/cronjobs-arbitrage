import clientPool from "./mongoPool.js";
import os from "os";

export const arbispotter_db = "arbispotter";
export const crawler_data_db = "crawler-data";
export const sitemapcollectionName = "sitemaps";
export const tasksCollectionName = "tasks";
export const logsCollectionName = "logs";
export const shopCollectionName = "shops";
export const hostname = os.hostname();

export const getCollection = async (name) => {
  const client = await clientPool[crawler_data_db];
  return client.db().collection(name);
};

export const getArbispotterDb = async () => {
  const client = await clientPool[arbispotter_db];
  return client.db();
};

export const getCrawlerDataDb = async () => {
  const client = await clientPool[crawler_data_db];
  return client.db();
};

export const doesCollectionExists = async (name) => {
  const collections = (await getCrawlerDataDb()).collections();
  return collections.some((collection) => collection.collectionName === name);
};

export const createCollection = async (name) => {
  const db = await getCrawlerDataDb();
  return db.createCollection(name);
};

export const createArbispotterCollection = async (name) => {
  const db = await getArbispotterDb();
  return db.createCollection(name);
};

export const getSiteMap = async (domain) => {
  const sitemap = await (
    await getCollection(sitemapcollectionName)
  )
    .find({
      "sitemap.name": domain,
    })
    .toArray();

  if (sitemap.length) {
    return sitemap[0];
  } else {
    return null;
  }
};

export const upsertSiteMap = async (domain, stats) => {
  const sitemap = (await getCollection(sitemapcollectionName)).replaceOne(
    { "sitemap.name": domain },
    stats,
    { upsert: true }
  );
  return sitemap;
};

