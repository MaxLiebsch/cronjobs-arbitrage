import { createHash, verifyHash } from "../../../util/hash.js";
import {
  findProductByLink,
  updateProduct,
  upsertProduct,
} from "./crudArbispotterProduct.js";

export const createOrUpdateProduct = async (domain, procProd, infoCb) => {
  let isNewProduct = true;
  const product = await findProductByLink(domain, procProd.lnk);

  if (product) {
    isNewProduct = false;
    if (procProd.a_lnk) {
      if (!verifyHash(procProd.a_lnk, product.a_hash)) {
        procProd.a_props = "incomplete";
        procProd.bsr = [];
        procProd.asin = "";
        procProd.a_hash = createHash(procProd.a_lnk);
        procProd.a_vrfd = {
          vrfd: false,
          vrfn_pending: true,
          flags: [],
          flag_cnt: 0,
        };
      }
    }
    if (procProd.e_lnk) {
      if (!verifyHash(procProd.e_lnk, product.e_hash)) {
        procProd.e_hash = createHash(procProd.e_lnk);
        procProd.e_vrfd = {
          vrfd: false,
          vrfn_pending: true,
          flags: [],
          flag_cnt: 0,
        };
      }
    }
    await updateProduct(domain, procProd.lnk, procProd);
  } else {
    const newProduct = {
      pblsh: false,
      a_vrfd: {
        vrfd: false,
        vrfn_pending: true,
        flags: [],
        flag_cnt: 0,
      },
      e_vrfd: {
        vrfd: false,
        vrfn_pending: true,
        flags: [],
        flag_cnt: 0,
      },
      lckd: false,
      taskId: "",
      a_props: "incomplete",
      ean: "",
      asin: "",
      bsr: [],
      ...procProd,
    };

    if (newProduct.a_lnk) {
      const a_hash = createHash(newProduct.a_lnk);
      newProduct.a_hash = a_hash;
    }

    if (newProduct.e_lnk) {
      const e_hash = createHash(newProduct.e_lnk);
      newProduct.e_hash = e_hash;
    }
    
    await upsertProduct(domain, newProduct);
  }
  infoCb(isNewProduct);
};
