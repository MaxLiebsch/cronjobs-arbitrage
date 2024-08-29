import { UTCDate } from "@date-fns/utc";

export const resetEbyProductQuery = (
  props = { eby_prop: "", cat_prop: "" }
) => {
  const { eby_prop, cat_prop } = props;
  const query = {
    $unset: {
      //standard properties
      e_pblsh: "",
      e_nm: "",
      e_lnk: "",
      e_img: "",
      esin: "",
      e_prc: "",
      e_uprc: "",
      e_qty: "",
      e_orgn: "",
      e_hash: "",
      e_mrgn: "",
      e_mrgn_pct: "",
      e_ns_costs: "",
      e_ns_mrgn: "",
      e_ns_mrgn_pct: "",
      e_tax: "",
      ebyCategories: "",
      e_vrfd: "",
      // lookup category
      cat_taskId: "",
      // scrape listing
      ebyUpdatedAt: "",
      eby_taskId: "",
      // dealeby properties
      dealEbyUpdatedAt: "",
      dealEbyTaskId: "",
    },
  };

  if (!query["$set"] && (eby_prop || cat_prop)) {
    query["$set"] = {};
  }
  if (eby_prop) {
    query["$set"]["eby_prop"] = eby_prop;
    query["$set"]["qEbyUpdatedAt"] = new UTCDate().toISOString();
  } else {
    query["$unset"]["eby_prop"] = "";
    query["$unset"]["qEbyUpdatedAt"] = "";
  }

  if (cat_prop) {
    query["$set"]["cat_prop"] = cat_prop;
    query["$set"]["catUpdatedAt"] = new UTCDate().toISOString();
  } else {
    query["$unset"]["cat_prop"] = "";
    query["$unset"]["catUpdatedAt"] = "";
  }

  return query;
};
