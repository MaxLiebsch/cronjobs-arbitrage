import OpenAI from "openai";
import "dotenv/config";
import { config } from "dotenv";
import { encodeChat } from "gpt-tokenizer";
import { getArbispotterDb, getProductsCol } from "../src/db/mongo.js";
import { createNameMatchingPrompt } from "../src/util/titles/createNamingPrompt.js";
config({
  path: [`.env`],
});

const apiKey = process.env.OPEN_AI_KEY;

const openai = new OpenAI({
  apiKey, // This is the default and can be omitted
});

export const testNamingPrompt = async () => {
  const db = await getArbispotterDb();
  const shopDomain = "idealo.de";
  const col = await getProductsCol();

  const products = await col
    .find({ asin: "B00OYZHMV2" }, { limit: 1 })
    .toArray();
  const prompt = createNameMatchingPrompt(
    shopDomain,
    products[0]._id,
    products[0],
    true
  );
  console.log("prompts:", JSON.stringify(prompt.body.messages[0], null, 2));
  console.log("prompts:", JSON.stringify(prompt.body.messages[1], null, 2));
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
      //@ts-ignore
    messages: prompt.body.messages,
    max_tokens: 1000,
    temperature: 0.3,
  });
  console.log(
    "response:",
    JSON.stringify(response.choices[0].message.content, null, 2)
  );
  const tokenCnt = encodeChat(prompt.body.messages, "gpt-3.5-turbo").length;
  console.log("tokenCnt:", tokenCnt);
};

testNamingPrompt().then(() => {
  process.exit(0);
});
