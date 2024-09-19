import {
  ebayMarginCalculationAggregationStep,
  totalPositivAmazon,
  totalPositivEbay,
} from "../../db/queries.js";

export const titleAggregation = (limit: number) => [
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
        { nm_batchId: { $exists: false } },
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
  { $limit: limit },
];
