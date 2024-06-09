import { getCrawlerDataDb , hostname} from "../mongo.js";

const collectionName = "wholesale";

export const unlockProduts = async (products) => {
  const db = await getCrawlerDataDb();
  await db.collection(collectionName).updateMany(
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

export const lockProducts = async (limit = 0, taskId, action) => {
  const db = await getCrawlerDataDb();

  const options = {};
  const query = {};

  query["taskId"] = `${taskId.toString()}`;

  if (action === "recover") {
    query["clrName"] = `${hostname}`;
  } else {
    query["locked"] = { $eq: false };
    query["lookup_pending"] = { $eq: true };
    query["clrName"] = { $eq: "" };
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
        { $set: { locked: true, clrName: `${hostname}` } }
      );

  return documents;
};

export const updateWholeSaleProduct = async (productId, update) => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  update["updatedAt"] = new Date().toISOString();
  
  await collection.updateOne(
    { _id: productId },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const updateWholeSaleProducts = async (query, update) => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.updateMany(
    { ...query },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const deleteProductsForTask = async (taskId) => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.deleteMany({ taskId });
};
