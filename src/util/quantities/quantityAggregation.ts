import { MAX_BATCH_SIZE } from "../../constants.js";
import {
  ebayMarginCalculationAggregationStep,
  totalPositivAmazon,
  totalPositivEbay,
} from "../../db/queries.js";

export const quantityAggregation = (limit: number) => [
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
        { qty_batchId: { $exists: false } },
        {
          $or: [
            { qty_prop: { $exists: false } },
            { qty_prop: { $exists: true, $nin: ["in_progress", "backlog"] } },
          ],
        },
        {
          $or: [
            {
              $or: [
                { a_vrfd: { $exists: false } },
                { "a_vrfd.qty_prop": { $exists: false } },
                {
                  "a_vrfd.qty_prop": {
                    $exists: true,
                    $nin: ["complete", "in_progress", "backlog"],
                  },
                },
                { "a_vrfd.qty_prop": { $exists: true, $eq: "retry" } },
              ],
            },
            {
              $or: [
                { e_vrfd: { $exists: false } },
                { "e_vrfd.qty_prop": { $exists: false } },
                {
                  "e_vrfd.qty_prop": {
                    $exists: true,
                    $nin: ["complete", "in_progress", "backlog"],
                  },
                },
                { "e_vrfd.qty_prop": { $exists: true, $eq: "retry" } },
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
