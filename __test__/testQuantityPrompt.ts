import OpenAI from "openai";
import "dotenv/config";
import { config } from "dotenv";
import { encodeChat } from "gpt-tokenizer";
import { getArbispotterDb, getProductsCol } from "../src/db/mongo.js";
import { createPrompt } from "../src/util/quantities/createPrompt.js";
config({
  path: [`.env`],
});

const apiKey = process.env.OPEN_AI_KEY;

const openai = new OpenAI({
  apiKey, // This is the default and can be omitted
});

export const testQtyPrompt = async () => {
  const db = await getArbispotterDb();
  const col = await getProductsCol();

  const products = await col
    .find({ eanList: "0649528822505", sdmn: "idealo.de" }, { limit: 1 })
    .toArray();
  const prompt = createPrompt(
    products[0].sdmn,
    products[0]._id,
    products[0],
    true
  );
  console.log("prompts:", JSON.stringify(prompt.body.messages[1], null, 2));
  console.log("prompts:", JSON.stringify(prompt.body.messages[0], null, 2));
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
    //@ts-ignore
    messages: prompt.body.messages,
    max_tokens: 1000,
    temperature: 0.1,
  });
  console.log(
    "response:",
    JSON.stringify(response.choices[0].message.content, null, 2)
  );
  const set: any = {};
  //@ts-ignore
  Object.entries(JSON.parse(response.choices[0].message.content)).forEach(
    ([key, value]) => {
      let qty = Number(value);
      if (qty) {
        if (qty === 0) qty = 1;
        if (key === "a_nm") {
          set["a_qty"] = qty;
        }
        if (key === "e_nm") {
          set["e_qty"] = qty;
        }
        if (key === "nm") {
          set["qty"] = qty;
        }
      }
    }
  );
  console.log('set:', set)
  const inputTokenCnt = encodeChat(prompt.body.messages, "gpt-3.5-turbo").length;
  console.log("tokenCnt:", inputTokenCnt);
};

testQtyPrompt().then(() => {
  process.exit(0);
});
