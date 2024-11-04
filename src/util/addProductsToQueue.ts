import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import PQueue from "p-queue";
import { handleProcessedProduct } from "./handleProcessedProduct.js";

export async function addProductsToQueue(
  products: DbProductRecord[],
  queue: PQueue,
  processingProducts: Set<ObjectId>
): Promise<void> {
  for (const product of products) {
    processingProducts.add(product._id);
    queue.add(
      async () => await handleProcessedProduct(product, processingProducts)
    );
  }
}
