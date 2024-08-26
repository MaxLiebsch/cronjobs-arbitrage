//@ts-ignore
import { safeJSONParse } from "@dipmaxtech/clr-pkg";
//@ts-ignore
import { describe, expect, test } from "@jest/globals";
//@ts-ignore
import { packs } from "../../be-fetcher-arbitrage/__test__/static/packRecognition/packs.js";
//@ts-ignore
import { bunches } from "../../be-fetcher-arbitrage/__test__/static/packRecognition/bunch.js";
//@ts-ignore
import { packung } from "../../be-fetcher-arbitrage/__test__/static/packRecognition/packung.js";
//@ts-ignore
import { none } from "../../be-fetcher-arbitrage/__test__/static/packRecognition/none.js";
//@ts-ignore
import { createPrompt } from "../src/util/createPrompt.js";
import OpenAI from "openai";

import "dotenv/config";
import { config } from "dotenv";

config({
  path: [`.env`],
});

const apiKey = process.env.OPEN_AI_KEY;

const openai = new OpenAI({
  apiKey, // This is the default and can be omitted
});

let cnt = 0;
let total = 0;
const chatP = async (messages: any[]) => {
  return openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 1000,
  });
};

const runTest = async (
  example: { input: string; package: number | null },
  i: number
) => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  cnt++;
  const id = crypto.randomUUID().toString();
  const prompt = createPrompt("all", id, { nm: example.input, mnftcr: "" }, true);
  const response = await chatP(prompt.body.messages);
  if (response?.choices[0]?.message?.content) {
    const json = safeJSONParse(response?.choices[0]?.message?.content);
    if(example.package !== json?.nm)
    console.log(
      "Packung: ",
      cnt,
      " / ",
      total,
      " ",
      example.input,
      "\nErklärung: ",
      json?.nm_explain,
      "\nErwartet: ",example.package,"\nErgebnis: ",
      json?.nm
    );
    let packageSize = json?.nm;
    expect(packageSize).toBe(example.package)
  }
};

describe("Parse Packete", () => {
  packs.forEach((example: any, i: any) => {
    total++;
    test(`${cnt} Packs - "${example.input}"`, () => runTest(example, i));
  });

  packung.forEach((example: any, i: any) => {
    total++;
    test(`${cnt} Packung- "${example.input}"`, () => runTest(example, i));
  });

  bunches.forEach((example: any, i: any) => {
    total++;
    test(`${cnt} Bunches - "${example.input}"`, () => runTest(example, i));
  });

  none.forEach((example: any, i: any) => {
    total++;
    test(`${cnt} Nones - "${example.input}"`, () => runTest(example, i));
  });
});
