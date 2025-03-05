import { AiTaskTypes } from "../../../types/aiTasks/index.js";
import { AiTask } from "../../AITask.js";
import { Model } from "../../Model.js";
import { ProductManager } from "../../ProductManager.js";
import { PromptTemplate } from "../../PromptTemplate.js";
import { TaskContext } from "../../Taskcontext.js";
import { TaskResultSchema } from "../../TaskResultSchema.js";
import { AiTaskQuery } from "../query/index.js";
import { DetectQuantityTaskResultSchema, MatchTitleTaskResultSchema } from "../resultSchema/MatchTitleTaskResultSchema.js";
import { DetectQuantityTask } from "./DetectQuantityTask.js";
import { MatchTitlesTask } from "./MatchTitlesTask.js";

type TaskConstructor = new (
  model: Model<any>,
  template: PromptTemplate<any>,
  taskContext: TaskContext,
  productManager: ProductManager,
  query: AiTaskQuery
) => AiTask<any>;

export const Tasks: Record<string, TaskConstructor> = {
  [AiTaskTypes.MATCH_TITLES]: MatchTitlesTask,
  [AiTaskTypes.DETECT_QUANTITY]: DetectQuantityTask,
} as const;


export const TaskResultSchemas: Record<string, TaskResultSchema> = {
  [AiTaskTypes.MATCH_TITLES]: MatchTitleTaskResultSchema,
  [AiTaskTypes.DETECT_QUANTITY]: DetectQuantityTaskResultSchema,
} as const;

