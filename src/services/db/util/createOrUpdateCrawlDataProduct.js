import { createHash } from "../../../util/hash.js";
import {
  findCrawledProductByLink,
  updateCrawledProduct,
  upsertCrawledProduct,
} from "./crudCrawlDataProduct.js";

export const createOrUpdateCrawlDataProduct = async (
  domain,
  rawProd,
  infoCb
) => {
  let isNewProduct = true;
  const product = await findCrawledProductByLink(domain, rawProd.link);
  if (product) {
    const s_hash = createHash(rawProd.link);
    isNewProduct = false;
    await updateCrawledProduct(domain, rawProd.link, { ...rawProd, s_hash });
  } else {
    await upsertCrawledProduct(domain, rawProd);
  }
  infoCb(isNewProduct);
};
