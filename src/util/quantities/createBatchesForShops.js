import { TOKEN_LIMIT } from "../../constants.js";
import { encodeChat } from "gpt-tokenizer";
import { createPrompt } from "./createPrompt.js";
const addToMap = (hashes, shopDomain, id) => {
  const shopHashes = hashes.get(shopDomain) || [];
  shopHashes.push(id);
  hashes.set(shopDomain, shopHashes);
};

export const createBatches = (products, batchShops) => {
  if (products.length === 0) return null;
  const batches = [];
  let tokens = 0;
  let cnt = 0;
  let prompts = [];
  let hashes = new Map();

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    const { shop: shopDomain} = product;
    let retry = false;
    const id = product._id.toString();
    const prompt = createPrompt(shopDomain, id, product, retry);
    // @ts-ignore
    const tokenCnt = encodeChat(prompt.body.messages, "gpt-4").length;
    if (tokens + tokenCnt < TOKEN_LIMIT) {
      tokens += tokenCnt;
      cnt++;
      prompts.push(prompt);
      addToMap(hashes, shopDomain, id);
    } else {
      batches.push({
        batchShops,
        batchSize: prompts.length,
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
