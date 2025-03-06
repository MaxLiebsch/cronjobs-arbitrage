import Anthropic from '@anthropic-ai/sdk';
import { getArbispotterDb, getProductsCol } from "../src/db/mongo.js";
import { createPrompt } from "../src/util/quantities/createPrompt.js";

import { config } from "dotenv";
import "dotenv/config";
config({
  path: [`.env`],
});

const apiKey = process.env.ANTHROPIC_KEY;

const anthropic = new Anthropic({
  apiKey
});

describe("testQtyPrompt", () => {
  it("should return a valid response", async () => {
    // const response = await anthropic.models.list({
    //   limit: 20,
    // });
    // console.log(response);
    const response = await testQtyPrompt();
    expect(response).toBeDefined();
  }, 30000);
});

export const testQtyPrompt = async () => {
  const db = await getArbispotterDb();
  const col = await getProductsCol();

  const products = await col
    .find({ eanList: "5060947541153", sdmn: "idealo.de" }, { limit: 1 })
    .toArray();
  const prompt = createPrompt(
    products[0].sdmn,
    products[0]._id,
    products[0],
    true
  );


  console.log("prompts:", JSON.stringify(prompt.body.messages[1], null, 2));
  console.log("prompts:", JSON.stringify(prompt.body.messages[0], null, 2));
  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    temperature:0,
    system: prompt.body.messages[0].content,
    messages: prompt.body.messages.slice(1) as unknown as any[]
  });
  console.log(
    "response:",
    JSON.stringify(response.content[0], null, 2)
  );
  return response.content[0];
  // const set: any = {};
  // //@ts-ignore
  // Object.entries(JSON.parse(response.choices[0].message.content)).forEach(
  //   ([key, value]) => {
  //     let qty = Number(value);
  //     if (qty) {
  //       if (qty === 0) qty = 1;
  //       if (key === "a_nm") {
  //         set["a_qty"] = qty;
  //       }
  //       if (key === "e_nm") {
  //         set["e_qty"] = qty;
  //       }
  //       if (key === "nm") {
  //         set["qty"] = qty;
  //       }
  //     }
  //   }
  // );
  // console.log('set:', set)
  // const inputTokenCnt = encodeChat(prompt.body.messages, "gpt-3.5-turbo").length;
  // console.log("tokenCnt:", inputTokenCnt);
};


