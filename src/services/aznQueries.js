import { UTCDate } from "@date-fns/utc";
import { keepaProperties } from "../constants.js";

export const resetAznProductQuery = (props = { info_prop: "" }) => {
  const { info_prop } = props;
  const query = {
    $unset: {
      //standard properties
      a_pblsh: "",
      a_nm: "",
      a_lnk: "",
      a_img: "",
      asin: "",
      a_prc: "",
      bsr: "",
      costs: "",
      a_uprc: "",
      a_qty: "",
      a_orgn: "",
      a_hash: "",
      tax: "",
      a_mrgn: "",
      a_mrgn_pct: "",
      a_w_mrgn: "",
      a_w_mrgn_pct: "",
      a_p_w_mrgn: "",
      a_p_w_mrgn_pct: "",
      a_p_mrgn: "",
      a_vrfd: "",
      a_p_mrgn_pct: "",
      // lookup info
      info_taskId: "",
      // keepa properties
      keepaEanUpdatedAt: "",
      keepaEan_lckd: "",
      keepaUpdatedAt: "",
      keepa_lckd: "",
      // scrape listing
      aznUpdatedAt: "",
      azn_taskId: "",
      // dealazn properties
      dealAznUpdatedAt: "",
      dealAznTaskId: "",
    },
  };
  keepaProperties.forEach((prop) => {
    query.$unset[prop.name ? prop.name : prop.key.replace("products[0].", "")] =
      "";
  });

  if (!query["$set"] && info_prop) {
    query["$set"] = {};
  }

  if (info_prop) {
    query["$set"]["info_prop"] = info_prop;
    query["$set"]["infoUpdatedAt"] = new UTCDate().toISOString();
  } else {
    query["$unset"]["info_prop"] = "";
    query["$unset"]["infoUpdatedAt"] = "";
  }

  return query;
};
