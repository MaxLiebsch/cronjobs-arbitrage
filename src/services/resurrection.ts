import { RECOVER_LIMIT_PER_DAY } from "../constants.js";
import { getArbispotterDb, getProductsCol } from "../db/mongo.js";
import {
  aznUnsetProperties,
  createHash,
  DbProductRecord,
  ebyUnsetProperties,
  KeepaNameProperties,
  keepaProperties,
  reduceSalesRankArray,
  removeSearchParams,
  transformProduct,
} from "@dipmaxtech/clr-pkg";

import { CJ_LOGGER, logGlobal } from "../util/logger.js";
import { BulkWrite } from "../types/BulkTypes.js";

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

function isArrayOfNumbers(arr: any) {
  if (!Array.isArray(arr)) return false;
  return arr.every((item) => typeof item === "number");
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

function uniqueBulkWrite(bulkWriteArray: BulkWrite[]): any[] {
  const uniqueProducts = new Set();
  const uniqueBulkWriteArray = [];

  for (const item of bulkWriteArray) {
    //@ts-ignore
    const lnk = item.insertOne.document.lnk; // Assuming each item has a productId property
    if (!uniqueProducts.has(lnk)) {
      uniqueProducts.add(lnk);
      uniqueBulkWriteArray.push(item);
    }
  }

  return uniqueBulkWriteArray;
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
  const loggerName = CJ_LOGGER.RESURRECTION;
  const db = await getArbispotterDb();
  const graveCol = db.collection("grave");
  const productCol = await getProductsCol();
  const limit = RECOVER_LIMIT_PER_DAY;
  let cnt = 0;
  while (cnt <= limit) {
    let products = await graveCol.find({}, { limit: 500 }).toArray();

    const bulkWrites: any = {};

    if (products.length === 0) {
      logGlobal(loggerName, "No products found in the grave");
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
          product["shop"] = url.hostname.replace("www.", "");
        } catch (error) {
          logGlobal(loggerName, `Error parsing URL: ${link}`);
          continue;
        }
      }
      let transformedProduct = transformProduct(product, product.shop);
      transformedProduct.lnk = removeSearchParams(transformedProduct.lnk);
      transformedProduct.s_hash = createHash(transformedProduct.lnk);

      const { a_lnk, e_lnk, eanList, costs } = transformedProduct;
      if (!transformedProduct.eanList && (a_lnk || e_lnk)) {
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
        transformedProduct["eanUpdatedAt"] = new Date().toISOString();
      }

      if (costs && costs?.azn > 0.3 && transformedProduct.asin) {
        transformedProduct["a_pblsh"] = true;
        transformedProduct["info_prop"] = "complete";
        transformedProduct["infoUpdatedAt"] = new Date().toISOString();
      }

      if (
        transformedProduct.ebyCategories &&
        transformedProduct.ebyCategories?.length &&
        transformedProduct.ebyCategories.every((cat) => typeof cat !== "number")
      ) {
        transformedProduct["e_pblsh"] = true;
        transformedProduct["cat_prop"] = "complete";
        transformedProduct["catUpdatedAt"] = new Date().toISOString();
      }

      if (transformedProduct.esin) {
        transformedProduct["qEbyUpdatedAt"] = new Date().toISOString();
        transformedProduct["eby_prop"] = "complete";
      }
      const { salesRanks, ahstprcs, auhstprcs, anhstprcs } = transformedProduct;
      if (salesRanks) {
        const _salesRanks = salesRanks;
        Object.entries(salesRanks).forEach(([key, value]) => {
          if (value.length > 2 && isArrayOfNumbers(value)) {
            (_salesRanks as any)[key] = reduceSalesRankArray(
              value as unknown as number[]
            );
          }
        });
        if (Object.keys(_salesRanks).length > 0) {
          transformedProduct.salesRanks = _salesRanks;
        } else {
          delete transformedProduct.salesRanks;
        }
      }

      if (ahstprcs && isArrayOfNumbers(ahstprcs)) {
        if (ahstprcs.length > 2) {
          transformedProduct.ahstprcs = reduceSalesRankArray(
            ahstprcs as unknown as number[]
          );
        } else {
          delete transformedProduct.ahstprcs;
        }
      }
      if (auhstprcs && isArrayOfNumbers(auhstprcs)) {
        if (auhstprcs.length > 2) {
          transformedProduct.auhstprcs = reduceSalesRankArray(
            auhstprcs as unknown as number[]
          );
        } else {
          delete transformedProduct.auhstprcs;
        }
      }
      if (anhstprcs && isArrayOfNumbers(anhstprcs)) {
        if (anhstprcs.length > 2) {
          transformedProduct.anhstprcs = reduceSalesRankArray(
            anhstprcs as unknown as number[]
          );
        } else {
          delete transformedProduct.anhstprcs;
        }
      }

      const spotterProduct = await productCol.findOne({
        lnk: transformedProduct.lnk,
      });

      if (spotterProduct) {
        const result = await graveCol.deleteOne({ _id: product._id });
        products = products.filter((p) => p._id !== product._id);
        logGlobal(
          loggerName,
          `Product with hash ${transformedProduct.s_hash} already exists in shop ${product.shop}, Deleted: ${result.deletedCount}`
        );
        continue;
      }

      const bulkWrite = {
        insertOne: {
          document: {
            ...transformedProduct,
            sdmn: product.shop,
            updatedAt: new Date().toISOString(),
          },
        },
      };
      logGlobal(
        loggerName,
        `Product with hash ${transformedProduct.s_hash} is new`
      );
      const shopBulkWrites = bulkWrites[product.shop];
      bulkWrites[product.shop] = [
        ...(shopBulkWrites && shopBulkWrites.length ? shopBulkWrites : []),
        bulkWrite,
      ];
    }

    const result = await graveCol.deleteMany({
      _id: { $in: products.map((p) => p._id) },
    });
    logGlobal(loggerName, `Recovered ${result.deletedCount} products`);

    if (Object.keys(bulkWrites).length > 0) {
      const shopDomains = Object.keys(bulkWrites);
      for (let index = 0; index < shopDomains.length; index++) {
        const shopDomain = shopDomains[index];
        const result = await productCol.bulkWrite(
          uniqueBulkWrite(bulkWrites[shopDomain] as BulkWrite[])
        );

        logGlobal(
          loggerName,
          `Shop: ${shopDomain} Inserted documents: ${result.insertedCount}`
        );
      }
    }
  }
  logGlobal(loggerName, "Resurrection finished");
}
