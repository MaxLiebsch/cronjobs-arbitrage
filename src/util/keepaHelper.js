import axios from "axios";
import { updateProductWithQuery } from "../services/db/util/crudArbispotterProduct.js";
import { eanKeepa } from "./eanKeepa.js";
import { asinKeepa } from "./asinKeepa.js";

export async function makeRequestsForEan(product) {
  const { ean } = product;
  try {
    const response = await axios.get(
      `${process.env.KEEPA_URL}/product?key=${process.env.KEEPA_API_KEY}&domain=3&code=${ean}&stats=90&history=1&days=90`
    );

    if (
      response.status === 200 &&
      response.data.error === undefined &&
      response.data.products.length > 0 &&
      response.data.products[0].asin
    ) {
      console.log(`Request for ID ${ean} - ${product.shopDomain}`);
      await eanKeepa({
        ...product,
        analysis: response.data,
        asin: response.data.products[0].asin,
      });
    } else {
      await updateProductWithQuery(
        product.shopDomain,
        { _id: product._id },
        {
          $set: {
            keepaEanUpdatedAt: new Date().toISOString(),
          },
          $unset: {
            keepaEan_lckd: "",
          },
        }
      );
      console.log(
        `Request for ID ${ean} - ${product.shopDomain} failed with status ${response.status}`,
        response.data.error
      );
    }
  } catch (error) {
    console.error(`Error for ID ${ean} - ${product.shopDomain}:`, error);
  }
}

// Function to make two requests for each ID
export async function makeRequestsForId(product) {
  const trimedAsin = product.asin.replace(/\W/g, "");
  try {
    const response = await axios.get(
      `${process.env.KEEPA_URL}/product?key=${process.env.KEEPA_API_KEY}&domain=3&asin=${trimedAsin}&stats=90&history=1&days=90`
    );

    if (response.status === 200 && response.data.error === undefined) {
      console.log(`Request for ID ${trimedAsin} - ${product.shopDomain}`);
      await asinKeepa({
        ...product,
        analysis: response.data,
        asin: trimedAsin,
      });
    } else {
      await updateProductWithQuery(
        product.shopDomain,
        { _id: product._id },
        {
          $set: {
            asin: trimedAsin,
          },
          $unset: {
            keepa_lckd: "",
          },
        }
      );
      console.log(
        `Request for ID ${trimedAsin} - ${product.shopDomain} failed with status ${response.status}`,
        response.data.error
      );
    }
  } catch (error) {
    console.error(`Error for ID ${trimedAsin} - ${product.shopDomain}:`, error);
  }
}
