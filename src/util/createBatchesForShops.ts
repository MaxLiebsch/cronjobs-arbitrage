import { OPENAI_TOKEN_LIMIT } from "../constants.js";
import { encodeChat } from "gpt-tokenizer";
import { createNameMatchingPrompt } from "../util/titles/createNamingPrompt.js";
import { ProductIdsMap, ProductWithShop } from "../types/products.js";
import { BatchRequestParams } from "../types/openai.js";
import { ShopBatches } from "../types/ShopBatches.js";
import { BatchTaskTypes } from "../types/tasks.js";
import { BATCH_TASK_TYPES } from "../services/productBatchProcessing.js";
import { createPrompt } from "./quantities/createPrompt.js";
import { addToMap } from "./addToProductIdMap.js";


export const createBatches = (
  products: ProductWithShop[],
  batchShops: string[],
  batchType: BatchTaskTypes
) => {
  if (products.length === 0) return null;
  const batches: ShopBatches = [];
  let tokens = 0;
  let cnt = 0;
  let prompts: BatchRequestParams[] = [];
  let productIds: ProductIdsMap = new Map();

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    const { shop: shopDomain, nm_prop, _id: productId } = product;
    let retry = false;
    if (nm_prop === "retry") {
      retry = true;
    }
    let prompt: BatchRequestParams = {
      body: {
        messages: [],
        model: "gpt-4o-mini-2024-07-18",
        temperature: 0.3,
        max_tokens: 1000,
      },
      custom_id: "",
      method: "",
      url: "",
    };

    if (batchType === BATCH_TASK_TYPES.MATCH_TITLES) {
      prompt = createNameMatchingPrompt(shopDomain, productId, product, retry);
    } else if (batchType === BATCH_TASK_TYPES.DETECT_QUANTITY) {
      prompt = createPrompt(shopDomain, productId, product, retry);
    }

    const tokenCnt = encodeChat(prompt.body.messages, "gpt-4").length;
    if (tokens + tokenCnt < OPENAI_TOKEN_LIMIT) {
      tokens += tokenCnt;
      cnt++;
      prompts.push(prompt);
      addToMap(productIds, shopDomain, productId);
    } else {
      batches.push({
        batchShops,
        batchSize: prompts.length,
        productIds,
        prompts: [...prompts],
        tokens,
      });
      tokens = 0;
      cnt = 0;
      prompts = [prompt];
      addToMap(productIds, shopDomain, productId);
      tokens += tokenCnt;
      cnt++;
    }
  }
  if (batches.length === 0) {
    batches.push({
      batchShops,
      batchSize: prompts.length,
      productIds,
      prompts,
      tokens,
    });
  }
  return batches;
};
