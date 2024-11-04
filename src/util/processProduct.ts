import { handleHappyPath } from "./handleScHappyPath.js";
import { handleNewHappyPath } from "./handleScNewHappyPath.js";
import { ProcessProductReponse, ProcessProductRequest } from "../types/ProcessProductRequest.js";

export async function processProduct(
  processProductRequest: ProcessProductRequest
): Promise<ProcessProductReponse> {
  const updatedData = await handleHappyPath(processProductRequest);

  if (updatedData.errors.length > 0) {
    const updatedData = await handleNewHappyPath(processProductRequest);

    if (updatedData.errors.length > 0) {
      return updatedData
    }

    return updatedData;
  }

  return updatedData;
}
