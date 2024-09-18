import { ObjectId } from "@dipmaxtech/clr-pkg";
import { ProductIdsMap } from "../types/products";

export const addToMap = (
  productIds: ProductIdsMap,
  shopDomain: string,
  id: ObjectId
) => {
  const shopHashes = productIds.get(shopDomain) || [];
  shopHashes.push(id);
  productIds.set(shopDomain, shopHashes);
};
