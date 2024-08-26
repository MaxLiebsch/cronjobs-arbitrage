import { TOKEN_LIMIT } from "../../constants.js";
import { getArbispotterDb, getCrawlDataDb } from "../../services/db/mongo.js";
import { getAllShops } from "../../services/db/util/shops.js";
import { createPrompt } from "./createPrompt.js";
import { encodeChat } from "gpt-tokenizer";

export const retrieveProductsForBatches = async () => {
  const shops = await getAllShops();
  const activeShops = shops.filter(
    (shop) =>
      shop.active &&
      shop.d !== "amazon.de" &&
      shop.d !== "ebay.de" &&
      shop.d !== "sellercentral.amazon.de"
  );
  const batches = [];
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const db = await getCrawlDataDb();
    const spotterDb = await getArbispotterDb();
    const crawlDataShopCol = db.collection(shop.d);
    const arbispotterShopCol = spotterDb.collection(shop.d);
    const rawProducts = await crawlDataShopCol
      .find(
        {
          $and: [
            {
              $or: [
                { qty_batchId: { $exists: false } },
                { qty_batchId: { $exists: true, $eq: "" } },
              ],
            },
            {
              $or: [
                { qty_prop: { $exists: false } },
                {
                  qty_prop: {
                    $exists: true,
                    $nin: ["complete", "in_progress", "backlog"],
                  },
                },
                { qty_prop: { $exists: true, $eq: "retry" } },
              ],
            },
            {
              $or: [
                { eby_prop: { $in: ["complete", "missing"] } },
                { info_prop: { $in: ["complete", "missing"] } },
              ],
            },
          ],
        },
        { limit: 6000 }
      )
      .toArray();

    if (rawProducts.length > 1000) {
      const ids = rawProducts.map((p) => p.s_hash);
      const products = await arbispotterShopCol
        .find({ s_hash: { $in: ids } }, { limit: rawProducts.length })
        .project({
          nm: 1,
          e_nm: 1,
          a_nm: 1,
          s_hash: 1,
          costs: 1,
          tax: 1,
          prc: 1,
          mnfctr: 1,
          qty: 1,
          uprc: 1,
          ebyCategories: 1,
        })
        .toArray();

      if (products.length < rawProducts.length) {
        const productsNotInRaw = rawProducts.filter(
          (p) => !products.some((p2) => p2.s_hash === p.s_hash)
        );
        await crawlDataShopCol.updateMany(
          { _id: { $in: productsNotInRaw.map((p) => p._id) } },
          {
            $set: {
              qty_prop: "backlog",
              qty_batchId: "",
            },
          }
        );
      }

      const productsWithProp = products.reduce((acc, product) => {
        const crawlDataProduct = rawProducts.find(
          (p) => p.s_hash === product.s_hash
        );
        if (crawlDataProduct) {
          product.qty_prop = crawlDataProduct.qty_prop;
          acc.push(product);
        }
        return acc;
      }, []);

      const shopBatches = createBatches(shop.d, productsWithProp);
      if (shopBatches) {
        batches.push(...shopBatches);
      }
      break;
    } else {
      continue;
    }
  }
  return [batches[0]];
};

const createBatches = (shopDomain, products) => {
  if (products.length === 0) return null;
  /*
      steps:
       - iterate over products
       - create prompt for each
       - check if token count is less than 200000
          - if yes, add to prompts
          - else, add prompts to batches
       - reset tokens and cnt
       - repeat until all products are processed
       - return batches
    
    */
  const batches = [];
  let tokens = 0;
  let cnt = 0;
  let prompts = [];
  let hashes = [];

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    let retry = false;
    if (product.qty_prop === "retry") {
      retry = true;
    }
    const prompt = createPrompt(shopDomain, product.s_hash, product, retry);
    const tokenCnt = encodeChat(prompt.body.messages, "gpt-3.5-turbo").length;
    if (tokens + tokenCnt < TOKEN_LIMIT) {
      tokens += tokenCnt;
      cnt++;
      prompts.push(prompt);
      hashes.push(product.s_hash);
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
      hashes = [product.s_hash];
      tokens += tokenCnt;
      cnt++;
    }
  }
  if (batches.length === 0) {
    batches.push({ shopDomain, hashes, prompts, tokens });
  }
  return batches;
};
