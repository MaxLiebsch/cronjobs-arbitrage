import OpenAI from "openai";
import "dotenv/config";
import { config } from "dotenv";
import { encodeChat } from "gpt-tokenizer";
import { getArbispotterDb } from "../src/db/mongo.js";
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
  const shopDomain = "sales";
  const col = db.collection(shopDomain);

  const products = await col
    .find({ eanList: "4008429156113" }, { limit: 1 })
    .toArray()
  const prompt = createPrompt(
    shopDomain,
    products[0].s_hash,
    //@ts-ignore
    products[0],
    true
  );
  console.log("prompts:", JSON.stringify(prompt.body.messages[1], null, 2));
  console.log("prompts:", JSON.stringify(prompt.body.messages[0], null, 2));
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    //@ts-ignore
    messages: prompt.body.messages,
    max_tokens: 1000,
    temperature: 0.1,
  });
  console.log(
    "response:",
    JSON.stringify(response.choices[0].message.content, null, 2)
  );
  const tokenCnt = encodeChat(prompt.body.messages, "gpt-3.5-turbo").length;
  console.log("tokenCnt:", tokenCnt);
};

testQtyPrompt().then(() => {
  process.exit(0);
});
