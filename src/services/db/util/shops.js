//getShop

import {
  getArbispotterDb,
  getCrawlerDataDb,
  shopCollectionName,
} from "../mongo.js";

export const getAllShops = async (shopDomains = []) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  let query = {};
  if (shopDomains.length) {
    query = { d: { $in: shopDomains } };
  }
  const shops = await collection.find(query).toArray();
  return shops;
};

export const getShops = async (retailerList) => {
  const collectionName = shopCollectionName ;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  const retailerListQueryArr = retailerList.reduce((targetShops, shop) => {
    targetShops.push(shop.d);
    return targetShops;
  }, []);

  const shops = await collection
    .find({ d: { $in: retailerListQueryArr } })
    .toArray();
  if (shops.length) {
    return retailerList.reduce((acc, val) => {
      const shop = shops.find((shop) => shop.d === val.d);
      acc[val.d] = shop;
      return acc;
    }, {});
  } else {
    return null;
  }
};

export const insertShop = async (shop) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return await collection.replaceOne({ d: shop.d }, shop, { upsert: true });
};

export const updateShopStats = async (shopDomain) => {
  const db = await getArbispotterDb();
  const shopCollection = db.collection(shopDomain);
  if (!shopCollection) return;

  const total = await shopCollection.count();
  const a_fat_total = await shopCollection.count({
    a_mrgn_pct: { $gt: 0 },
  });
  const e_fat_total = await shopCollection.count({
    e_mrgn_pct: { $gt: 0 },
  });
  const shopsCollection = db.collection(shopCollectionName);
  if (!shopsCollection) return;

  return await shopsCollection.updateOne(
    { d: shopDomain },
    {
      $set: {
        a_fat_total,
        e_fat_total,
        total,
      },
    }
  );
};

export const getActiveShops = async () => {
  const collectionName = shopCollectionName;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);

  const shops = await collection.find({ active: true }).toArray();
  if (shops.length) {
    return shops;
  } else {
    return null;
  }
};
