import { MongoServerError } from "mongodb";
import { createHash } from "./hash.js";
import {
  findCrawledProductByLink,
  updateCrawlDataProduct,
  upsertCrawledProduct,
} from "./crudCrawlDataProduct.js";

export const createOrUpdateCrawlDataProduct = async (domain, rawProd) => {
  const product = await findCrawledProductByLink(domain, rawProd.link);
  try {
    if (product) {
      const s_hash = createHash(rawProd.link);
      return updateCrawlDataProduct(domain, rawProd.link, {
        ...rawProd,
        s_hash,
      });
    } else {
      return upsertCrawledProduct(domain, rawProd);
    }
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        return { acknowledged: false, upsertedId: null };
      }
    }
  }
};
