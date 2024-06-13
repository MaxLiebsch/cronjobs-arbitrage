import { MAX_EARNING_MARGIN } from "../../../constants.js";
import { getArbispotterDb, hostname } from "../mongo.js";
import { pendingKeepaProductsQuery } from "../queries.js";

export const countProducts = async (domain, query = {}) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.countDocuments({ ...query });
};

export const findProducts = async (domain, query, limit = 500, page = 0) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection
    .find({ ...query })
    .limit(limit ?? 500)
    .skip(page * limit)
    .toArray();
};

export const findProduct = async (domain, name) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ nm: name });
};

export const findProductByLink = async (domain, link) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ lnk: link });
};

export const lockProductsForKeepa = async (domain, limit = 0) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const options = {};
  let query = pendingKeepaProductsQuery;

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
      { $set: { keepa_lckd: true } }
    );

  return documents;
};

export const upsertProduct = async (domain, product) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);

  product["createdAt"] = new Date().toISOString();
  product["updatedAt"] = new Date().toISOString();

  return collection.replaceOne({ lnk: product.lnk }, product, {
    upsert: true,
  });
};

export const updateProduct = async (domain, link, update) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  update["updatedAt"] = new Date().toISOString();
  return collection.updateOne(
    { lnk: link },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const updateProducts = async (domain, query, update) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.updateMany(
    { ...query },
    {
      $set: {
        ...update,
      },
    },
    {
      returnNewDocument: true,
    }
  );
};


export const updateProductWithQuery = async (domain, query, update) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.updateOne(
    { ...query },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const deleteArbispotterProducts = async (domain, query = {}) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.deleteMany(query);
};

export const insertArbispotterProducts = async (collectionName, products) => {
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.insertMany(products);
};
