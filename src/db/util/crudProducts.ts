
import { getArbispotterDb, getProductsCol } from "../mongo.js";
import { MongoError } from "mongodb";
import {
  DbProductRecord,
  Filter,
  InsertOneResult,
  ObjectId,
} from "@dipmaxtech/clr-pkg";
import {
  pendingFallbackKeepaProductsQuery,
  pendingKeepaProductsQuery,
  recoverFallbackKeepaProductsQuery,
  recoverKeepaProductsQuery,
} from "../queries.js";

const getCollection = async (collectionName: string) => {
  const db = await getArbispotterDb();
  return db.collection<DbProductRecord>(collectionName);
};

export const findArbispotterProduct = async (id: ObjectId) => {
  const productCol = await getProductsCol();
  return productCol.findOne({ _id: id });
};


export const insertProductsToCol = async (
  colName: string,
  products: DbProductRecord[]
) => {
  const collectionName = colName;
  const collection = await getCollection(collectionName);
  return collection.insertMany(products);
};

export const insertProducts = async (products: DbProductRecord[]) => {
  try {
    const productsCol = await getProductsCol();
    products.forEach((product) => {
      product["createdAt"] = new Date().toISOString();
      product["updatedAt"] = new Date().toISOString();
    });

    return await productsCol.insertMany(products);
  } catch (error) {
    if (error instanceof MongoError) {
      console.error("Error creating products:", error?.message);
    }
    return { acknowledged: false } as InsertOneResult<Document>;
  }
};

export const findProducts = async (
  query: Filter<DbProductRecord>,
  limit = 500,
  page = 0
) => {
  const productCol = await getProductsCol();
  return productCol
    .find({ ...query })
    .limit(limit ?? 500)
    .skip(page * limit)
    .toArray();
};

export const deleteArbispotterProducts = async (query = {}) => {
  const collection = await getProductsCol();
  return collection.deleteMany(query);
};

export const updateProductWithQuery = async (
  id: ObjectId,
  query: Filter<DbProductRecord>
) => {
  const maxRetries = 3;
  let attempt = 0;
  const productsCol = await getProductsCol();

  while (attempt < maxRetries) {
    try {
      if (query?.$set) {
        query.$set["updatedAt"] = new Date().toISOString();
      } else {
        query["$set"] = { updatedAt: new Date().toISOString() };
      }

      return await productsCol.updateOne({ _id: id }, query); // Exit the function if the update is successful
    } catch (e) {
      attempt++;
      if (e instanceof MongoError && e.code === 11000) {
        console.error(
          "Duplicate key error:",
          e.message,
          `${id.toString()}`,
          JSON.stringify(query)
        );
        break; // Exit the function
      } else if (attempt >= maxRetries) {
        if (e instanceof Error) {
          console.error(
            "Error updating product:",
            e?.message,
            `${id.toString()}`,
            JSON.stringify(query)
          );
        }
        return; // Exit the function
      }
    }
  }
};

export const lockProductsForKeepa = async (
  domain: string,
  limit = 0,
  fallback: boolean,
  recovery: boolean
) => {
  const productCol = await getProductsCol();

  const options: { [key: string]: {} } = {};

  if (recovery) {
    let query = fallback
      ? recoverFallbackKeepaProductsQuery(domain)
      : recoverKeepaProductsQuery(domain);

    const documents = (await productCol
      .find(query, options)
      .toArray()) as DbProductRecord[];
    return documents;
  } else {
    // Determine the query based on the fallback condition
    let query = fallback
      ? pendingFallbackKeepaProductsQuery(domain)
      : pendingKeepaProductsQuery(domain);

    if (limit) {
      options["limit"] = limit;
    }

    const documents = (await productCol
      .find(query, options)
      .toArray()) as DbProductRecord[];

    // Update documents to mark them as locked
    await productCol.updateMany(
      { _id: { $in: documents.map((doc) => doc._id) } },
      { $set: { keepa_lckd: true } }
    );

    return documents;
  }
};
