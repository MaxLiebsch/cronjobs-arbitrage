import { subDateDaysISO } from "./dates.js";
import { createHash, verifyHash } from "./hash.js";
import {
  findProductByLink,
  updateProduct,
  upsertProduct,
} from "./crudArbispotterProduct.js";

//ARBISPOTTER DB UTILS
export const createOrUpdateArbispotterProduct = async (domain, procProd) => {
  const { lnk, a_lnk, e_lnk, bsr } = procProd;
  const product = await findProductByLink(domain, procProd.lnk);
  try {
    if (product) {
      if (a_lnk && product.a_hash) {
        if (!verifyHash(a_lnk, product.a_hash)) {
          if (!bsr || !bsr.length) {
            procProd["bsr"] = [];
          }
          // Remove keepa properties
          const keepaProperties = [
            { name: "categories" },
            { name: "k_eanList" },
            { name: "brand" },
            { name: "numberOfItems" },
            { name: "availabilityAmazon" },
            { name: "categoryTree" },
            { name: "salesRanks" }, // Sales Rank nullable
            { name: "monthlySold" },
            { name: "ahstprcs" }, // Amazon history prices
            { name: "anhstprcs" }, // Amazon new history prices
            { name: "auhstprcs" }, // Amazon used history prices
            { name: "curr_ahsprcs" },
            { name: "curr_ansprcs" },
            { name: "curr_ausprcs" },
            { name: "curr_salesRank" },
            { name: "avg90_ahsprcs" }, // Average of the Amazon history prices of the last 90 days
            { name: "avg90_ansprcs" }, // Average of the Amazon history prices of the last 90 days
            { name: "avg90_ausprcs" }, // Average of the Amazon history prices of the last 90 days
            { name: "avg90_salesRank" }, // Average of the Amazon history prices of the last 90 days
            { name: "buyBoxIsAmazon" },
            { name: "stockAmount" }, //  The stock of the Amazon offer, if available. Otherwise undefined.
            { name: "stockBuyBox" }, // he stock of the buy box offer, if available. Otherwise undefined.
            { name: "totalOfferCount" }, // The total count of offers for this product (all conditions combined). The offer count per condition can be found in the current field.
          ];
          keepaProperties.forEach((prop) => {
            procProd[prop.name] = null;
          });
          procProd["a_pblsh"] = false;
          procProd["keepaUpdatedAt"] = subDateDaysISO(14);
          procProd.a_hash = createHash(a_lnk);
          procProd.a_vrfd = {
            vrfd: false,
            vrfn_pending: true,
            flags: [],
            flag_cnt: 0,
          };
        }
      }
      if (e_lnk && product.e_hash) {
        if (!verifyHash(e_lnk, product.e_hash)) {
          procProd["e_hash"] = createHash(e_lnk);
          procProd["e_pblsh"] = false;
          procProd["e_vrfd"] = {
            vrfd: false,
            vrfn_pending: true,
            flags: [],
            flag_cnt: 0,
          };
        }
      }
      return await updateProduct(domain, lnk, procProd);
    } else {
      const newProduct = {
        a_pblsh: false,
        a_vrfd: {
          vrfd: false,
          vrfn_pending: true,
          flags: [],
          flag_cnt: 0,
        },
        e_pblsh: false,
        e_vrfd: {
          vrfd: false,
          vrfn_pending: true,
          flags: [],
          flag_cnt: 0,
        },
        ...procProd,
      };

      if (newProduct.a_lnk) {
        const a_hash = createHash(newProduct.a_lnk);
        newProduct["a_hash"] = a_hash;
      }

      if (newProduct.e_lnk) {
        const e_hash = createHash(newProduct.e_lnk);
        newProduct["e_hash"] = e_hash;
      }

      return await upsertProduct(domain, newProduct);
    }
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        return { acknowledged: false, upsertedId: null };
      }
    }
  }
};
