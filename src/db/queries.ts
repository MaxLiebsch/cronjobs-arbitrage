import { keepaEanProps, keepaProps } from "../util/keepaProps.js";

export const totalPositivAmazon = {
  $and: [
    { a_pblsh: true },
    { a_prc: { $gt: 0 } },
    { a_uprc: { $gt: 0 } },
    { a_mrgn: { $gt: 0 } },
    { a_mrgn_pct: { $gt: 0 } },
  ],
};

export const totalPositivEbay = {
  $and: [
    { e_pblsh: true },
    { 'e_pRange.median': { $gt: 0 } },
    { 'e_uprc': { $gt: 0 } },
    { e_mrgn: { $gt: 0 } },
    { e_mrgn_pct: { $gt: 0 } },
  ],
};

export const totalPositivEbayCond = {
  $and: [
    { e_pblsh: true },
    { $gt: ["$e_pRange.median", 0] },
    { $gt: ["$e_uprc", 0] },
    { $gt: ["$e_mrgn", 0] },
    { $gt: ["$e_mrgn_pct", 0] },
  ],
};

export const ebayMarginCalculationAggregationStep = [
  {
    $addFields: {
      e_mrgn: {
        $cond: {
          if: {
            $and: totalPositivEbayCond.$and,
          },
          then: {
            $round: [
              {
                $subtract: [
                  "$e_pRange.median",
                  {
                    $add: [
                      {
                        $divide: [
                          {
                            $multiply: [
                              "$prc",
                              { $divide: ["$e_qty", "$qty"] },
                            ],
                          },
                          {
                            $add: [
                              1,
                              { $divide: [{ $ifNull: ["$tax", 19] }, 100] },
                            ],
                          },
                        ],
                      },
                      "$e_tax",
                      0,
                      0,
                      "$e_costs",
                    ],
                  },
                ],
              },
              2,
            ],
          },
          else: 0,
        },
      },
    },
  },
  {
    $addFields: {
      e_mrgn_pct: {
        $cond: {
          if: {
            $and: totalPositivEbayCond.$and,
          },
          then: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: ["$e_mrgn", "$e_pRange.median"],
                  },
                  100,
                ],
              },
              2,
            ],
          },
          else: 0,
        },
      },
    },
  },
];

export const pendingKeepaProductsQuery = (domain: string) => {
  const { lock, updatedAt } = keepaProps;
  return {
    $and: [
      { sdmn: domain },
      {
        $and: [
          { a_prc: { $gt: 0 } },
          { a_mrgn: { $gt: 0 } },
          { a_mrgn_pct: { $gt: 0 } },
        ],
      },
      {
        $or: [{ [lock]: { $exists: false } }, { [lock]: { $eq: false } }],
      },
      { asin: { $exists: true, $nin: ["", null] } },
      {
        $or: [
          { [updatedAt]: { $exists: false } },
          {
            [updatedAt]: {
              $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            },
          },
        ],
      },
    ],
  };
};

export const recoverKeepaProductsQuery: any = (domain: string) => {
  return {
    sdmn: domain,
    keepa_lckd: true,
    asin: { $exists: true, $nin: ["", null] },
  };
};

export const pendingEanKeepaProductsQuery: any = (domain: string) => {
  const { lock, updatedAt } = keepaEanProps;
  return {
    $and: [
      { sdmn: domain },
      { [lock]: { $exists: false } },
      { a_mrgn: { $lt: 0 } },
      { a_mrgn_pct: { $lt: 0 } },
      { eanList: { $exists: true, $ne: [] } },
      { info_prop: { $in: ["complete"] } },
      {
        $or: [
          { [updatedAt]: { $exists: false } },
          {
            [updatedAt]: {
              $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            },
          },
        ],
      },
    ],
  };
};

export const keepaFallbackResetQuery = {
  $set: {
    [keepaEanProps.updatedAt]: new Date().toISOString(),
  },
  $unset: {
    [keepaEanProps.lock]: "",
  },
};

export const recoverFallbackKeepaProductsQuery: (domain: string) => any = (
  domain: string
) => {
  return {
    sdmn: domain,
    keepaEan_lckd: true,
    eanList: { $exists: true, $ne: [] },
  };
};
