
import { ProductIdsMap } from "./products";

export interface ShopBatch {
  batchShops: any;
  batchSize: number;
  productIds: ProductIdsMap;
  prompts: any[];
  tokens: number;
}
export type ShopBatches = Array<ShopBatch>;
