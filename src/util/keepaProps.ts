import { KeepaProps } from "../types/keepaProps.js";

export const keepaEanProps: KeepaProps = {
  lock: "keepaEan_lckd",
  updatedAt: "keepaUpdatedAt",
  unset: {
    keepaEan_lckd: "",
    info_prop: "",
    infoUpdatedAt: '',
  },
};

export const keepaProps: KeepaProps = {
  lock: "keepa_lckd",
  updatedAt: "keepaUpdatedAt",
  unset: {
    keepa_lckd: "",
  },
};
