import { BATCH_SIZE, TOKEN_LIMIT } from "../../constants.js";
import { getArbispotterDb } from "../../services/db/mongo.js";
import { getActiveShops } from "../../services/db/util/shops.js";
import { encodeChat } from "gpt-tokenizer";
import { createNameMatchingPrompt } from "./createNamingPrompt.js";
import { shopFilter } from "../shopFilter.js";
import { aggregation } from "./aggregation.js";

export const retrieveProductsForBatches = async () => {
  const shops = await getActiveShops();
  const activeShops = shops.filter((shop) => shopFilter(shop));
  console.log(
    "activeShops:",
    activeShops.reduce((acc, shop) => `${acc} ${shop.d}`, "")
  );
  const batches = [];
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const spotterDb = await getArbispotterDb();
    const rawProducts = await spotterDb
      .collection(shop.d)
      .aggregate(aggregation)
      .toArray();

    if (rawProducts.length >= BATCH_SIZE) {
      const shopBatches = createBatches(shop.d, rawProducts);
      if (shopBatches) {
        batches.push(...shopBatches);
      }
      break;
    } else {
      continue;
    }
  }
  if(batches.length === 0) return null;
  return [batches[0]];
};

const createBatches = (shopDomain, products) => {
  if (products.length === 0) return null;
  const batches = [];
  let tokens = 0;
  let cnt = 0;
  let prompts = [];
  let hashes = [];

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    let retry = false;
    if (product.nm_prop === "retry") {
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
      hashes.push(id);
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
      hashes = [id];
      tokens += tokenCnt;
      cnt++;
    }
  }
  if (batches.length === 0) {
    batches.push({ shopDomain, hashes, prompts, tokens });
  }
  return batches;
};
