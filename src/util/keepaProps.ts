import { KeepaProps } from "../types/keepaProps.js";

export const keepaEanProps: KeepaProps = {
  lock: "keepaEan_lckd",
  updatedAt: "keepaEanUpdatedAt",
  unset: {
    keepaEan_lckd: "",
  },
};

export const keepaProps: KeepaProps = {
  lock: "keepa_lckd",
  updatedAt: "keepaUpdatedAt",
  unset: {
    keepa_lckd: "",
  },
};
