import { ProductInfo } from "../types/ProductInfo.js";
import { ProductMatchResponse } from "../types/ProductMatch.js";
import pkg from "lodash";
const { get } = pkg;

const productInfos = [
  {
    key: "data.otherProducts.products[0].imageUrl",
    defaultValue: "",
    targetKey: "a_img",
  },
  {
    key: "data.otherProducts.products[0].title",
    defaultValue: "",
    targetKey: "a_nm",
  },
  {
    key: "data.otherProducts.products[0].customerReviewsCount",
    defaultValue: 0,
    targetKey: "a_reviewcnt",
  },
  {
    key: "data.otherProducts.products[0].customerReviewsRatingValue",
    defaultValue: 0,
    targetKey: "a_rating",
  },
  {
    key: "data.otherProducts.products[0].offerCount",
    defaultValue: 0,
    targetKey: "totalOfferCount",
  },
  {
    key: "data.otherProducts.products[0].salesRank",
    defaultValue: 0,
    targetKey: "bsrRank",
  },
  {
    key: "data.otherProducts.products[0].salesRankContextName",
    defaultValue: "",
    targetKey: "bsrName",
  },
];

export const retrieveProductInfo = (
  data: ProductMatchResponse,
  productIndex: number
): ProductInfo[] => {
  return productInfos.map((info) => {
    return {
      ...info,
      value: get(
        data,
        info.key.replaceAll("[0]", `[${productIndex}]`),
        info.defaultValue
      ),
    };
  });
};
