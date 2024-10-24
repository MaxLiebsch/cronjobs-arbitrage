import { DbProductRecord } from "@dipmaxtech/clr-pkg";

export function getEanFromProduct(product: DbProductRecord) {
  const { ean, eanList } = product;
  return ean || eanList?.[0];
}
