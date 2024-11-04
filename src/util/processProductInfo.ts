import { AznProduct, DbProductRecord } from "@dipmaxtech/clr-pkg";
import { ProductInfo } from "../types/ProductInfo.js";

export function processProductInfo(
  productInfo: ProductInfo[]
): Partial<DbProductRecord> {
  const result: Partial<DbProductRecord> = {};

  for (const info of productInfo) {
    if (info.targetKey === "bsrRank" || info.targetKey === "bsrName") {
      continue;
    }
    if (info.targetKey === "a_img") {
      (result as any)[info.targetKey as keyof AznProduct] =
        info.value as string;
    }
    if (info.targetKey === "a_nm") {
      (result as any)[info.targetKey as keyof AznProduct] =
        info.value as string;
    }
    if (info.targetKey === "a_reviewcnt") {
      (result as any)[info.targetKey as keyof AznProduct] =
        info.value as number;
    }
    if (info.targetKey === "a_rating") {
      (result as any)[info.targetKey as keyof AznProduct] =
        info.value as number;
    }
    if (info.targetKey === "totalOfferCount") {
      (result as any)[info.targetKey as keyof AznProduct] =
        info.value as number;
    }
  }

  const bsrName = productInfo.find((info) => info.targetKey === "bsrName");
  const bsrRank = productInfo.find((info) => info.targetKey === "bsrRank");

  if (bsrName && bsrRank) {
    result.bsr = [
      {
        category: bsrName.value as string,
        number: bsrRank.value as number,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  return result;
}
