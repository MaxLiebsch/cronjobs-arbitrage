import { createHash } from "./hash.js";
import { getCrawlerDataDb, hostname } from "../mongo.js";
import { pendingEanLookupProductsQuery } from "../queries.js";
import { getEanLookupProgress } from "./getEanLookupProgress.js";
import { getActiveShops } from "./shops.js";

//Add crawled product //crawler-data
export const upsertCrawledProduct = async (domain, product) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  product["createdAt"] = new Date().toISOString();
  product["updatedAt"] = new Date().toISOString();

  const s_hash = createHash(product.link);

  return collection.updateOne(
    { link: product.link },
    { $set: { ...product, s_hash } },
    {
      upsert: true,
    }
  );
};

export const findCrawlDataProducts = async (domain, query, limit = 500, page = 0) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection
    .find({ ...query })
    .limit(limit ?? 500)
    .skip(page * limit)
    .toArray();
};

export const findCrawledProductByName = async (domain, name) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ name });
};

export const findCrawledProductByLink = async (domain, link) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ link });
};

export const updateCrawledProduct = async (domain, link, update) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  update["updatedAt"] = new Date().toISOString();

  return collection.updateOne(
    { link },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const updateCrawlDataProducts = async (domain, query, update) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  update["updatedAt"] = new Date().toISOString();

  return collection.updateMany(
    { ...query },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const unlockProduts = async (domain, products) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  return db.collection(collectionName).updateMany(
    {
      _id: {
        $in: products.reduce((ids, product) => {
          ids.push(product._id);
          return ids;
        }, []),
      },
    },
    {
      $set: {
        locked: false,
        taskId: "",
      },
    }
  );
};

export const lockProducts = async (domain, limit = 0, taskId, action) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();

  const options = {};
  const query = {};

  if (action === "recover") {
    query["taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
    query["locked"] = { $exists: true, $eq: false };
    query["matched"] = { $exists: true, $eq: false };
    if (limit) {
      options["limit"] = limit;
    }
  }

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover")
    await db
      .collection(collectionName)
      .updateMany(
        { _id: { $in: documents.map((doc) => doc._id) } },
        { $set: { locked: true, taskId: `${hostname}:${taskId.toString()}` } }
      );

  return documents;
};

export const lockProductsForEanLookup = async (domain, limit = 0) => {
  const collectionName = domain + '.products';
  const db = await getCrawlerDataDb();

  const options = {};
  let query = pendingEanLookupProductsQuery;

  if (limit) {
    options["limit"] = limit;
  }

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  await db
    .collection(collectionName)
    .updateMany(
      { _id: { $in: documents.map((doc) => doc._id) } },
      { $set: { ean_locked: true } }
    );

  return documents;
};

export const deleteAllProducts = async (domain) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.deleteMany({});
};

export async function lookForPendingEanLookups() {
  const activeShops = await getActiveShops();

  const filteredShops = activeShops.filter((shop) => shop.ean);

  const shops = await getShops(filteredShops);
  const eanLookupProgressPerShop = await Promise.all(
    Object.values(
      Object.keys(shops).map(async (shop) => {
        const progress = await getEanLookupProgress(shops[shop].d);
        return { pending: progress.pending, shop: shops[shop] };
      })
    )
  );

  const pendingShops = eanLookupProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  numberOfShops = pendingShops.length;

  const products = await Promise.all(
    pendingShops.map(async ({ shop, pending }) => {
      console.log(`Shop ${shop.d} has ${pending} pending ean lookup lookups`);
      const products = await lockProductsForEanLookup(
        shop.d,
        PRODUCTS_PER_MINUTE
      );
      const productsWithShop = products.map((product) => {
        return { shop, product, retry: 0 };
      });
      return productsWithShop;
    })
  );

  addToQueue(shuffle(products).flatMap((ps) => ps));
}

export const insertCrawlDataProducts = async (collectionName, products) => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.insertMany(products);
};


export const deleteCrawlDataProducts = async (domain, query = {}) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.deleteMany(query);
};
