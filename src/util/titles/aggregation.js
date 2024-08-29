import { MAX_BATCH_SIZE } from "../../constants.js";
import {
  ebayMarginCalculationAggregationStep,
  totalPositivAmazon,
  totalPositivEbay,
} from "../../services/db/queries.js";

export const aggregation = [
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
        {
          $or: [
            { eby_prop: { $in: ["complete", "missing"] } },
            { info_prop: { $in: ["complete", "missing"] } },
          ],
        },
      ],
    },
  },
  { $limit: MAX_BATCH_SIZE },
];
