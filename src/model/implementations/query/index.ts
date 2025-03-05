import { AiTaskTypes } from "../../../types/aiTasks/index.js";
import { detectQuantityAggregation } from "./detectQuantity.js";
import { matchTitleAggregation } from "./matchTitles.js";

export type AiTaskQuery = (limit: number) => any[];

export const Queries: Record<AiTaskTypes, AiTaskQuery> = {
  [AiTaskTypes.MATCH_TITLES]: matchTitleAggregation,
  [AiTaskTypes.DETECT_QUANTITY]: detectQuantityAggregation,
} as const;


