import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";

export type ProductIdsMap = Map<string, ObjectId[]>;

export interface ProductWithShop extends DbProductRecord {
  shop: string;
}

export interface ProductWithTask extends DbProductRecord {
  taskType: "KEEPA_NORMAL" | "KEEPA_EAN" | "KEEPA_WHOLESALE" | "KEEPA_SALES";
}
