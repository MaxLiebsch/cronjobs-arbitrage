import pkg from "fs-jetpack";
import { join } from "path";
import { Readable } from "stream";
import { BatchRequest } from "../model/BatchContext.js";
import { BatchRequestParams } from "../types/openai.js";
const { createWriteStream, cwd, writeAsync } = pkg;

export const createJsonlFile = async (prompts: BatchRequestParams[]) =>
  new Promise<string>((resolve, reject) => {
    const filePath = join(cwd(), `/tmp/batches/batch-${Date.now()}.json`);
    const writeStream = createWriteStream(filePath, { flags: "w" });
    for (const prompt of prompts) {
      writeStream.write(JSON.stringify(prompt) + "\n");
    }
    writeStream.end();

    writeStream.on("finish", () => {
      resolve(filePath);
    });

    writeStream.on("error", (err) => {
      console.log("err:", err);
      reject("Error while writing to file: ${err.message}");
    });
  });

export const createJSONlFile = async (
  prompts: BatchRequest[],
  provider: string
) =>
  new Promise<string>((resolve, reject) => {
    const filePath = join(
      cwd(),
      `/tmp/batches/${provider}-batch-${Date.now()}.json`
    );
    const writeStream = createWriteStream(filePath, { flags: "w" });
    for (const prompt of prompts) {
      writeStream.write(JSON.stringify(prompt) + "\n");
    }
    writeStream.end();

    writeStream.on("finish", () => {
      resolve(filePath);
    });

    writeStream.on("error", (err) => {
      console.log("err:", err);
      reject("Error while writing to file: ${err.message}");
    });
  });

export const createJSONlArrayFile = async (
  prompts: BatchRequest[],
  provider: string
) =>{
    const filePath = join(
      cwd(),
      `/tmp/batches/${provider}-batch-${Date.now()}.json`
    );
    await writeAsync(filePath, prompts);
    return filePath;
}

export function createJsonReadStream(jsonObject: any) {
  // Convert the JSON object to a string.
  const jsonString = JSON.stringify(jsonObject);

  // Create a new Readable stream.
  const readable = new Readable({
    read() {
      // Push the JSON string into the stream.
      this.push(jsonString);
      // Signal that there's no more data.
      this.push(null);
    },
  });

  return readable;
}

export const generateReadStream = (prompts: BatchRequestParams[]) =>
  new ReadableStream({
    start(controller) {
      for (const prompt of prompts) {
        controller.enqueue(JSON.stringify(prompt) + "\n");
      }
      controller.close();
    },
  });
