import { Mistral } from "@mistralai/mistralai";
import { getArbispotterDb, getProductsCol } from "../src/db/mongo.js";
import { createPrompt } from "../src/util/quantities/createPrompt.js";

import { config } from "dotenv";
import "dotenv/config";
config({
  path: [`.env`],
});

const apiKey = process.env.MISTRAL_KEY;

const client = new Mistral({ apiKey: apiKey });

describe("testQtyPrompt", () => {
  it("should return a valid response", async () => {
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
  const response = await client.chat.complete({
    model: "mistral-small-latest",
    responseFormat: {
      type: "json_object",
      jsonSchema: {
        strict: true,
        name: "quantities",
        schemaDefinition: {
          nm: { type: "number" },
          nm_score: { type: "number" },
          nm_produktart: { type: "string" },
          nm_explain: { type: "string" },
          a_nm: { type: "number" },
          a_score: { type: "number" },
          a_produktart: { type: "string" },
          a_explain: { type: "string" },
        },
      },
    },
    messages: prompt.body.messages as any[],
  });
  console.log(
    "response:",
    JSON.stringify(response.choices?.[0].message.content, null, 2)
  );
  return response.choices?.[0].message.content;
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
