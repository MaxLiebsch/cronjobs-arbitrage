import { RECOVER_LIMIT_PER_DAY } from "../constants.js";
import { getArbispotterDb } from "../db/mongo.js";
import {
  AnyBulkWriteOperation,
  aznUnsetProperties,
  createHash,
  DbProductRecord,
  ebyUnsetProperties,
  KeepaNameProperties,
  keepaProperties,
  removeSearchParams,
  transformProduct,
} from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";

function deleteProperties(product: any, properties: KeepaNameProperties) {
  Object.keys(properties).forEach((prop) => {
    delete product[prop];
  });
}

function deleteUnsetProperties(product: DbProductRecord, unsetProperties: any) {
  Object.keys(unsetProperties).forEach((prop) => {
    delete (product as any)[prop];
  });
}

function handleAmazonLink(product: DbProductRecord) {
  deleteProperties(product, keepaProperties);
  deleteUnsetProperties(product, {
    ...aznUnsetProperties,
    info_prop: "",
    infoUpdatedAt: "",
  });
}

function handleEbayLink(product: DbProductRecord) {
  deleteUnsetProperties(product, {
    ...ebyUnsetProperties,
    eby_prop: "",
    qEbyUpdatedAt: "",
    cat_prop: "",
    catUpdatedAt: "",
  });
}

function handleProductWithoutEAN(
  product: DbProductRecord,
  a_lnk: string,
  e_lnk: string
) {
  if (a_lnk) {
    handleAmazonLink(product);
  }
  if (e_lnk) {
    handleEbayLink(product);
  }
  delete product.ean_prop;
  delete product.eanUpdatedAt;
  delete (product as any).eanList;
  delete (product as any).ean;
}

function handleProductWithEAN(
  product: DbProductRecord,
  a_lnk: string,
  e_lnk: string
) {
  const { costs, eanList } = product;
  if (a_lnk && !product.costs) {
    product["a_pblsh"] = false;
    delete product.info_prop;
  }
  if (a_lnk && costs && costs?.azn <= 0.3) {
    product["a_pblsh"] = false;
    delete product.info_prop;
  }

  if (e_lnk && (!product.ebyCategories || product.ebyCategories.length === 0)) {
    product["e_pblsh"] = false;
    delete product.cat_prop;
  }

  if (
    product.ebyCategories &&
    product.ebyCategories.every((cat) => typeof cat === "number")
  ) {
    product["e_pblsh"] = false;
    delete product.cat_prop;
  }
}

export async function resurrectionFromGrave() {
  const db = await getArbispotterDb();
  const collection = db.collection("grave");
  const limit = RECOVER_LIMIT_PER_DAY;
  let cnt = 0;
  while (cnt <= limit) {
    const products = await collection
      .find(
        {
          recoveredAt: { $exists: false },
        },
        { limit: 500 }
      )
      .toArray();

    const bulkWrites: {
      [key: string]: AnyBulkWriteOperation<Partial<DbProductRecord>>[];
    } = {};

    if (products.length === 0) {
      console.log("No products found in the grave");
      cnt = limit + 1;
      return;
    } else {
      cnt += products.length;
    }

    for (const product of products) {
      const link = product.lnk || product.link;
      if (!product.shop && link) {
        try {
          const url = new URL(link);
          product.shop = url.hostname.replace("www.", "");
        } catch (error) {
          console.log("error", error);
          continue;
        }
      }
      let transformedProduct = transformProduct(product, product.shop);
      transformedProduct.lnk = removeSearchParams(transformedProduct.lnk);
      transformedProduct.s_hash = createHash(transformedProduct.lnk);

      const { a_lnk, e_lnk, eanList, costs } = transformedProduct;
      if (
        !transformedProduct.ean &&
        !transformedProduct.eanList &&
        (a_lnk || e_lnk)
      ) {
        handleProductWithoutEAN(transformedProduct, a_lnk!, e_lnk!);
      } else {
        handleProductWithEAN(transformedProduct, a_lnk!, e_lnk!);
      }

      if (!a_lnk) {
        handleAmazonLink(transformedProduct);
      }

      if (!e_lnk) {
        handleEbayLink(transformedProduct);
      }

      if (eanList && eanList.length) {
        transformedProduct["ean_prop"] = "found";
        transformedProduct["eanUpdatedAt"] = new UTCDate().toISOString();
      }

      if (costs && costs?.azn > 0.3 && transformedProduct.asin) {
        transformedProduct["a_pblsh"] = true;
        transformedProduct["info_prop"] = "complete";
        transformedProduct["infoUpdatedAt"] = new UTCDate().toISOString();
      }

      if (
        transformedProduct.ebyCategories &&
        transformedProduct.ebyCategories?.length &&
        transformedProduct.ebyCategories.every((cat) => typeof cat !== "number")
      ) {
        transformedProduct["e_pblsh"] = true;
        transformedProduct["cat_prop"] = "complete";
        transformedProduct["catUpdatedAt"] = new UTCDate().toISOString();
      }

      if (transformedProduct.esin) {
        transformedProduct["qEbyUpdatedAt"] = new UTCDate().toISOString();
        transformedProduct["eby_prop"] = "complete";
      }

      const spotterProduct = await db.collection(product.shop).findOne({
        s_hash: transformedProduct.s_hash,
      });

      if (spotterProduct) {
        await collection.deleteOne({ _id: product._id });
        continue;
      }
      
      const bulkWrite = {
        insertOne: {
          document: {
            ...transformedProduct,
            updatedAt: new UTCDate().toISOString(),
          },
        },
      };
      const shopBulkWrites = bulkWrites[product.shop];
      bulkWrites[product.shop] = [
        ...(shopBulkWrites && shopBulkWrites.length ? shopBulkWrites : []),
        bulkWrite,
      ];
    }

    await collection.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      { $set: { recoveredAt: new UTCDate().toISOString() } }
    );

    if (Object.keys(bulkWrites).length > 0) {
      const array = Object.keys(bulkWrites);
      for (let index = 0; index < array.length; index++) {
        const key = array[index];
        const result = await db.collection(key).bulkWrite(bulkWrites[key]);
        console.log(
          "Shop: ",
          key,
          "Inserted documents: ",
          result.insertedCount
        );
      }
    }
  }
  console.log("Resurrection finished");
}
