import { Filter, Shop } from "@dipmaxtech/clr-pkg";
import {
  getArbispotterDb,
  getCrawlDataDb,
  shopCollectionName,
} from "../mongo.js";
import { MatchKeysAndValues } from "mongodb";

export const getAllShops = async (shopDomains = []) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  let query = {};
  if (shopDomains.length) {
    query = { d: { $in: shopDomains } };
  }
  const shops = await collection.find(query).toArray();
  return shops;
};

export const updateShopWithQuery = async (
  query: Filter<Shop>,
  update: MatchKeysAndValues<Shop>
) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection<Shop>(collectionName);
  return collection.updateOne(query, {
    $set: {
      ...update,
    },
  });
};

export const getShop = async (shopDomain: string) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection<Shop>(collectionName);
  return collection.findOne({ d: shopDomain });
};

export const getShops = async (retailerList: Pick<Shop, "d">[]) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection<Shop>(collectionName);

  let query = {};
  if (retailerList && retailerList.length) {
    const retailerListQueryArr = retailerList.reduce<string[]>(
      (targetShops, shop) => {
        targetShops.push(shop.d);
        return targetShops;
      },
      []
    );
    query = { d: { $in: retailerListQueryArr } };
  }

  const shops = await collection.find(query).toArray();
  if (shops.length) {
    return shops.reduce<{ [key: string]: Shop }>((acc, shop) => {
      acc[shop.d] = shop;
      return acc;
    }, {});
  } else {
    return null;
  }
};

export const findShops = async (shopList: string[]) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection<Shop>(collectionName);

  let query = {};
  if (shopList && shopList.length) {
    query = { d: { $in: shopList } };
  }

  const shops = await collection.find(query).toArray();
  if (shops.length) {
    return shops.reduce<{ [key: string]: Shop }>((acc, shop) => {
      acc[shop.d] = shop;
      return acc;
    }, {});
  } else {
    return null;
  }
};


export const getActiveShops = async () => {
  const collectionName = shopCollectionName;
  const db = await getArbispotterDb();
  const collection = db.collection<Shop>(collectionName);

  const shops = await collection.find({ active: true }).toArray();
  if (shops.length) {
    return shops;
  } else {
    return null;
  }
};
