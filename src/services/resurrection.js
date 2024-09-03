import { keepaProperties, RECOVER_LIMIT_PER_DAY } from "../constants.js";
import { getArbispotterDb } from "../services/db/mongo.js";
import { transformProduct } from "@dipmaxtech/clr-pkg";
import { aznUnsetProperties } from "./aznQueries.js";
import { ebyUnsetProperties } from "./ebyQueries.js";
import { UTCDate } from "@date-fns/utc";

function deleteProperties(product, properties) {
  properties.forEach((prop) => {
    delete product[
      prop.name ? prop.name : prop.key.replace("products[0].", "")
    ];
  });
}

function deleteUnsetProperties(product, unsetProperties) {
  Object.keys(unsetProperties).forEach((prop) => {
    delete product[prop];
  });
}

function handleAmazonLink(product) {
  deleteProperties(product, keepaProperties);
  deleteUnsetProperties(product, {
    ...aznUnsetProperties,
    info_prop: "",
    infoUpdatedAt: "",
  });
}

function handleEbayLink(product) {
  deleteUnsetProperties(product, {
    ...ebyUnsetProperties,
    eby_prop: "",
    qEbyUpdatedAt: "",
    cat_prop: "",
    catUpdatedAt: "",
  });
}

function handleProductWithoutEAN(product, a_lnk, e_lnk) {
  if (a_lnk) {
    handleAmazonLink(product);
  }
  if (e_lnk) {
    handleEbayLink(product);
  }
  delete product.ean_prop;
  delete product.eanUpdatedAt;
  delete product.eanList;
  delete product.ean;
}

function handleProductWithEAN(product, a_lnk, e_lnk) {
  if (a_lnk && !product.costs) {
    product["a_pblsh"] = false;
    delete product.info_prop;
  }
  if (a_lnk && product?.costs?.azn <= 0.3) {
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
          updatedAt: { $lte: "2024-04-28T11:29:49.308Z" },
          recoveredAt: { $exists: false },
        },
        { limit: 500 }
      )
      .toArray();

    const bulkWrites = {};

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
      const transformedProduct = transformProduct(product, product.shop);
      const { a_lnk, e_lnk } = transformedProduct;
      if (
        !transformedProduct.ean &&
        !transformedProduct.eanList &&
        !transformedProduct.eanList?.length &&
        (a_lnk || e_lnk)
      ) {
        handleProductWithoutEAN(transformedProduct, a_lnk, e_lnk);
      } else {
        handleProductWithEAN(transformedProduct, a_lnk, e_lnk);
      }

      if (!a_lnk) {
        handleAmazonLink(transformedProduct);
      }

      if (!e_lnk) {
        handleEbayLink(transformedProduct);
      }

      if (transformedProduct.eanList && transformedProduct.eanList.length) {
        transformedProduct["ean_prop"] = "found";
        transformedProduct["eanUpdatedAt"] = new UTCDate().toISOString();
      }

      if (transformedProduct.costs?.azn > 0.3 && transformedProduct.asin) {
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
        lnk: transformedProduct.lnk,
      });

      if (spotterProduct) {
        continue;
      }

      delete transformedProduct._id;

      const bulkWrite = {
        insertOne: {
          ...transformedProduct,
          updatedAt: new UTCDate().toISOString(),
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
        console.log("Shop: ", key, "Inserted documents: ", result.insertedCount);
      }
    }
  }
  await db.close();
  console.log('Resurrection finished');
}
