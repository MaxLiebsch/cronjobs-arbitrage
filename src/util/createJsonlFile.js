import { join } from "path";
import fsjetpack from "fs-jetpack";
const { createWriteStream, cwd } = fsjetpack;

export const createJsonlFile = async (shopDomain, prompts) =>
  new Promise((resolve, reject) => {
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

export const generateReadStream = (prompts) =>
  new ReadableStream({
    start(controller) {
      for (const prompt of prompts) {
        controller.enqueue(JSON.stringify(prompt) + "\n");
      }
      controller.close();
    },
  });
