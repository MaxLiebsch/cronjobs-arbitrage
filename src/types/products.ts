import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";

export type ProductIdsMap = Map<string, ObjectId[]>;

export interface ProductWithShop extends DbProductRecord {
  shop: string;
}
