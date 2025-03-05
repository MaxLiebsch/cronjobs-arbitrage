export const detectQuantityAggregation = (limit: number) => [
  {
    $match: {
      $or: [
        {
          $and: [
            {
              info_prop: 'complete',
            },
            { a_pblsh: true },
            { a_prc: { $gt: 0 } },
            { a_mrgn: { $gt: 0 } },
            {
              "a_vrfd.nm_prop": 'complete',
            },
            {
              $or: [
                {
                  "a_vrfd.qty_prop": {
                    $exists: false,
                  },
                },
                {
                  "a_vrfd.qty_prop": {
                    $exists: true,
                    $nin: ["complete", "in_progress", "backlog"],
                  },
                },
                {
                  "a_vrfd.qty_prop":"retry",
                },
              ],
            },
          ],
        },
        {
          $and: [
            { e_pblsh: true },
            {
              eby_prop: 'complete',
            },
            { "e_pRange.median": { $gt: 0 } },
            { e_mrgn: { $gt: 0 } },
            {
              "e_vrfd.nm_prop": 'complete',
            },
            {
              $or: [
                { qty_prop: { $exists: false } },
                {
                  "e_vrfd.qty_prop": {
                    $exists: true,
                    $nin: ["in_progress", "complete", "backlog"],
                  },
                },
                {
                  "a_vrfd.qty_prop": "retry",
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    $addFields: {
      e_mrgn: {
        $cond: {
          if: {
            $and: [
              { e_pblsh: true },
              { $gt: ["$e_pRange.median", 0] },
              { $gt: ["$e_uprc", 0] },
              { $gt: ["$e_mrgn", 0] },
              { $gt: ["$e_mrgn_pct", 0] },
            ],
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
                              {
                                $divide: ["$e_qty", "$qty"],
                              },
                            ],
                          },
                          {
                            $add: [
                              1,
                              {
                                $divide: [
                                  {
                                    $ifNull: ["$tax", 19],
                                  },
                                  100,
                                ],
                              },
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
            $and: [
              { e_pblsh: true },
              { $gt: ["$e_pRange.median", 0] },
              { $gt: ["$e_uprc", 0] },
              { $gt: ["$e_mrgn", 0] },
              { $gt: ["$e_mrgn_pct", 0] },
            ],
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
  { $sort: { createdAt: -1 } }, // Sort by createdAt newest first
  { $limit: limit },
];
