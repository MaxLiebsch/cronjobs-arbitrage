import { MAX_EARNING_MARGIN } from "../../constants.js";

export const pendingKeepaProductsQuery = {
  $and: [
    {
      $and: [
        { a_prc: { $gt: 0 } },
        { a_mrgn: { $gt: 0 } },
        { a_mrgn_pct: { $gt: 0, $lte: MAX_EARNING_MARGIN } },
      ],
    },
    {
      $or: [{ keepa_lckd: { $exists: false } }, { keepa_lckd: { $eq: false } }],
    },
    { asin: { $exists: true, $nin: ["", null]  } },
    {
      $or: [
        { keepaUpdatedAt: { $exists: false } },
        {
          keepaUpdatedAt: {
            $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
        },
      ],
    },
  ],
};

export const recoverKeepaProductsQuery = {
  keepa_lckd: true,
  asin: { $exists: true, $nin: ["", null]  },
};

export const pendingFallbackKeepaProductsQuery = {
  $and: [
    { keepaEan_lckd: { $exists: false } },
    {
      $or: [
        { info_prop: { $in: ["missing"] } },
        { "costs.azn": { $lte: 0.3 } },
      ],
    },
    { eanList: { $exists: true, $ne: [] } },
    {
      $or: [
        { keepaEanUpdatedAt: { $exists: false } },
        {
          keepaEanUpdatedAt: {
            $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
        },
      ],
    },
  ],
};

export const recoverFallbackKeepaProductsQuery = {
  keepaEan_lckd: true,
  eanList: { $exists: true, $ne: [] } 
};
