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
    { e_prc: { $gt: 0 } },
    { e_uprc: { $gt: 0 } },
    { e_mrgn: { $gt: 0 } },
    { e_mrgn_pct: { $gt: 0 } },
  ],
};

export const totalPositivEbayCond = {
  $and: [
    { e_pblsh: true },
    { $gt: ["$e_prc",0] },
    { $gt: ["$e_uprc",0] },
    { $gt: ["$e_mrgn",0] },
    { $gt: ["$e_mrgn_pct",0] },
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
                  "$e_prc",
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
                    $divide: ["$e_mrgn", "$e_prc"],
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

export const pendingKeepaProductsQuery = {
  $and: [
    {
      $and: [
        { a_prc: { $gt: 0 } },
        { a_mrgn: { $gt: 0 } },
        { a_mrgn_pct: { $gt: 0 } },
      ],
    },
    {
      $or: [{ keepa_lckd: { $exists: false } }, { keepa_lckd: { $eq: false } }],
    },
    { asin: { $exists: true, $nin: ["", null] } },
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
  asin: { $exists: true, $nin: ["", null] },
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
  eanList: { $exists: true, $ne: [] },
};
