import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";

export type ProductIdsMap = Map<string, ObjectId[]>;

export interface ProductWithShop extends DbProductRecord {
  shop: string;
}

export type IKeepaTaskType = "KEEPA_NORMAL" | "KEEPA_EAN" | "KEEPA_WHOLESALE" | "KEEPA_SALES";

export enum KeepaTaskType {
  KEEPA_NORMAL = "KEEPA_NORMAL",
  KEEPA_EAN = "KEEPA_EAN",
  KEEPA_WHOLESALE = "KEEPA_WHOLESALE",  
  KEEPA_SALES = "KEEPA_SALES",
}

export interface ProductWithTask extends DbProductRecord {
  taskType: IKeepaTaskType
}
