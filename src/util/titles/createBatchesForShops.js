import { BATCH_SIZE, TOKEN_LIMIT } from "../../constants.js";
import { getArbispotterDb } from "../../services/db/mongo.js";
import { getActiveShops } from "../../services/db/util/shops.js";
import { encodeChat } from "gpt-tokenizer";
import { createNameMatchingPrompt } from "./createNamingPrompt.js";
import { shopFilter } from "../shopFilter.js";
import { aggregation } from "./aggregation.js";

export const retrieveProductsForBatchesForShops = async () => {
  const shops = await getActiveShops();
  const spotterDb = await getArbispotterDb();
  const activeShops = shops.filter((shop) => shopFilter(shop));
  console.log(
    "activeShops:",
    activeShops.reduce((acc, shop) => `${acc} ${shop.d}`, "")
  );
  const products = [];
  const batchShops = [];
  for (let index = 0; index < activeShops.length; index++) {
    if (products.length >= BATCH_SIZE) break;

    const shop = activeShops[index];
    try {
      const rawProducts = await spotterDb
        .collection(shop.d)
        .aggregate(aggregation)
        .limit(250)
        .toArray();
      if (rawProducts.length === 0) continue;
      const productsWithShop = rawProducts.map((product) => {
        return { ...product, shop: shop.d };
      });
      batchShops.push(shop.d);
      products.push(...productsWithShop);
    } catch (error) {
      console.error(`Error fetching products for shop ${shop.d}:`, error);
      continue;
    }
  }

  console.log("products:", products.length);

  if (products.length === 0) return null;

  const shopBatches = createBatches(products, batchShops);

  if (!shopBatches || shopBatches.length === 0) return null;
  console.log("shopBatches:", shopBatches.length);

  return [shopBatches[0]];
};

const addToMap = (hashes, shopDomain, id) => {
  const shopHashes = hashes.get(shopDomain) || [];
  shopHashes.push(id);
  hashes.set(shopDomain, shopHashes);
};

const createBatches = (products, batchShops) => {
  if (products.length === 0) return null;
  const batches = [];
  let tokens = 0;
  let cnt = 0;
  let prompts = [];
  let hashes = new Map();

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    const { shop: shopDomain, nm_prop } = product;
    let retry = false;
    if (nm_prop === "retry") {
      retry = true;
    }
    const id = product._id.toString();
    const prompt = createNameMatchingPrompt(shopDomain, id, product, retry);
    // @ts-ignore
    const tokenCnt = encodeChat(prompt.body.messages, "gpt-4").length;
    if (tokens + tokenCnt < TOKEN_LIMIT) {
      tokens += tokenCnt;
      cnt++;
      prompts.push(prompt);
      addToMap(hashes, shopDomain, id);
    } else {
      batches.push({
        shopDomain,
        hashes,
        prompts: [...prompts],
        tokens,
      });
      tokens = 0;
      cnt = 0;
      prompts = [prompt];
      addToMap(hashes, shopDomain, id);
      tokens += tokenCnt;
      cnt++;
    }
  }
  if (batches.length === 0) {
    batches.push({
      batchShops,
      batchSize: prompts.length,
      hashes,
      prompts,
      tokens,
    });
  }
  return batches;
};
