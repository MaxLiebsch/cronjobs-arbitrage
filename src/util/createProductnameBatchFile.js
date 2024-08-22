import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import OpenAI from "openai";

import "dotenv/config";
import { config } from "dotenv";
import fsjetpack from "fs-jetpack";
import { join } from "path";
const { createWriteStream, cwd, createReadStream, path } = fsjetpack;
import { encodeChat } from "gpt-tokenizer";
import { createPrompt } from "./createPrompt.js";
import { createJsonlFile } from "./createJsonlFile.js";
config({
  path: [`.env`],
});

const apiKey = process.env.OPEN_AI_KEY;

const openai = new OpenAI({
  apiKey, // This is the default and can be omitted
});

export const createProductnameBatchFile = async () => {
  const db = await getArbispotterDb();
  const shopDomain = "idealo.de";
  const col = db.collection(shopDomain);

  const products = await col
    .find({ eanList: "8719018025630" }, { limit: 1 })
    .toArray();
  const prompt = createPrompt(
    shopDomain,
    products[0].s_hash,
    {
      nm: 'Vitakraft 25226 Kräcker Meerschweinchen Trio-Mix, 3Stk',
      mnfctr: ""
    },
    true
  );
  console.log("prompts:", JSON.stringify(prompt.body.messages[1], null, 2));
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: prompt.body.messages,
    max_tokens: 1000,
    temperature: 0.1,
  });
  console.log(
    "response:",
    JSON.stringify(response.choices[0].message.content, null, 2)
  );

  // console.log(products.length);
  // const prompts = [];
  // let tokens = 0;
  // let cnt = 0;
  // for (const product of products) {
  //   const tokenCnt = encodeChat(prompt.body.messages, "gpt-3.5-turbo").length;

  //   if (tokens + tokenCnt < 3000) {
  //     tokens += tokenCnt;
  //     cnt++;
  //     prompts.push(prompt);
  //   } else {
  //     break;
  //   }
  // }
  // console.log("prompts:", JSON.stringify(prompts[0], null, 2));

  // console.log("cnt: ", cnt, "Tokens: ", tokens);

  try {
    // const filepath = await createJsonlFile(prompts);
    // console.log("filepath:", filepath);
    // const file = await openai.files.create({
    //   file: createReadStream(filepath),
    //   purpose: "batch",
    // });
    // console.log(file); //file.id
    // const batch = await openai.batches.create({
    //   input_file_id: file.id,
    //   endpoint: "/v1/chat/completions",
    //   completion_window: "24h",
    // });
    // console.log(batch); // batch.id
    // const batch = await openai.batches.retrieve('batch_yGT3DVu5wM6BtgrdVhQtHiel');
    // console.log('batch:', batch)
    // const fileResponse = await openai.files.content(
    //   "file-tsEj4QUJ382ztYPN3wPDsFsn"
    // );
    // const fileContents = await fileResponse.text();
    // console.log(
    //   JSON.parse(
    //     fileContents.split("\n").filter(Boolean).map(JSON.parse)[0].response
    //       .body.choices[0].message.content
    //   )
    // );
  } catch (error) {
    console.log("error:", error);
  }
};

createProductnameBatchFile().then(() => {
  process.exit(0);
});
