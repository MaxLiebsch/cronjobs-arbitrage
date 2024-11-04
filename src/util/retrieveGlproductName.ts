import { ProductMatchResponse } from "../types/ProductMatch.js";
import pkg from "lodash";
const { get } = pkg;

const glProductGroupNameKey = "data.otherProducts.products[0].gl";

export const retrieveGlProductGroupName = (
  data: ProductMatchResponse,
  productIndex: number
) => {
  return get(
    data,
    glProductGroupNameKey.replaceAll("[0]", `[${productIndex}]`),
    undefined
  );
};
