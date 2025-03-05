import {
  ebayMarginCalculationAggregationStep,
  totalPositivAmazon,
  totalPositivEbay,
} from "../../db/queries.js";

export const titleAggregation = (limit: number, domain: string) => [
  {
    $match: {
      sdmn: domain,
    },
  },
  ...ebayMarginCalculationAggregationStep,
  {
    $match: {
      $or: [
        {
          $and: totalPositivAmazon.$and,
        },
        { $and: totalPositivEbay.$and },
      ],
    },
  },
  {
    $match: {
      $and: [
        {
          $or: [
            { nm_prop: { $exists: false } },
            { nm_prop: { $exists: true, $nin: ["in_progress", "backlog"] } },
          ],
        },
        {
          $or: [
            {
              $and: [
                ...totalPositivAmazon.$and,
                { a_nm: { $exists: true, $nin: ["", null] } },
                {
                  $or: [
                    { a_vrfd: { $exists: false } },
                    { "a_vrfd.nm_prop": { $exists: false } },
                    {
                      "a_vrfd.nm_prop": {
                        $exists: true,
                        $nin: ["complete", "in_progress", "backlog"],
                      },
                    },
                    { "a_vrfd.nm_prop": { $exists: true, $eq: "retry" } },
                  ],
                },
              ],
            },
            {
              $and: [
                ...totalPositivEbay.$and,
                { e_nm: { $exists: true, $nin: ["", null] } },
                {
                  $or: [
                    { e_vrfd: { $exists: false } },
                    { "e_vrfd.nm_prop": { $exists: false } },
                    {
                      "e_vrfd.nm_prop": {
                        $exists: true,
                        $nin: ["complete", "in_progress", "backlog"],
                      },
                    },
                    { "e_vrfd.nm_prop": { $exists: true, $eq: "retry" } },
                  ],
                },
              ],
            },
          ],
        },
        {
          $or: [
            { eby_prop: { $in: ["complete", "missing"] } },
            { info_prop: { $in: ["complete", "missing"] } },
          ],
        },
      ],
    },
  },
  { $sort: { createdAt: -1}}, // Sort by createdAt newest first
  { $limit: limit },
];
