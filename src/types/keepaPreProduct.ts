import { ObjectId } from "@dipmaxtech/clr-pkg";

export interface KeepaPreProduct {
  shopDomain: string;
  _id: ObjectId;
  asin?: string;
  ean?: string;
}
