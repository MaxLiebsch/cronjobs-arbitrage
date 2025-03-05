import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { getProductsCol } from "../db/mongo.js";
import { TaskContext } from "./Taskcontext.js";

const THRESHOLD_PRODUCTS_TO_LOCK = 30;

export class ProductManager {
  constructor(readonly taskContext: TaskContext) {}

  async unlockProducts(products: Pick<DbProductRecord, "_id">[]): Promise<void> {
    const col = await getProductsCol();
    await col.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      {
        $unset: {
          [`${this.taskContext.prefix}_prop`]: "",
          [`${this.taskContext.prefix}_v`]: "",
        },
      }
    );
  }
  async lockProducts(products: DbProductRecord[]): Promise<void> {
    const col = await getProductsCol();
    await col.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      {
        $set: {
          [`${this.taskContext.prefix}_prop`]: "in_progress",
          [`${this.taskContext.prefix}_v`]: this.taskContext.promptVersion,
        },
      }
    );
  }
  async getDataset(query: any[]): Promise<DbProductRecord[]> {
    const col = await getProductsCol();
    const products = await col.aggregate(query).toArray() as DbProductRecord[];
    if(products.length > THRESHOLD_PRODUCTS_TO_LOCK){
      await this.lockProducts(products);
      return products;
    }
    return [];
  }
  async getProducts(ids: ObjectId[]): Promise<DbProductRecord[]> {
    const col = await getProductsCol();
    const products = await col.find({ _id: { $in: ids } }).toArray();
    return products;
  }
  async resetProducts(products: DbProductRecord[]): Promise<void> {
    const col = await getProductsCol();
    await col.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      {
        $unset: {
          [`${this.taskContext.prefix}_prop`]: "",
          [`${this.taskContext.prefix}_v`]: "",
        },
      }
    );
  }
  async bulkWrite(bulkSpotterUpdates: any[]): Promise<void> {
    const col = await getProductsCol();
    await col.bulkWrite(bulkSpotterUpdates);
  }
}
