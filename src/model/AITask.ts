import { Filter, ObjectId } from "@dipmaxtech/clr-pkg";
import { Model } from "./Model.js";
import { ProductManager } from "./ProductManager.js";
import { PromptTemplate } from "./PromptTemplate.js";
import { TaskContext } from "./Taskcontext.js";

export abstract class AiTask<T extends any = any> {
  abstract query: Filter<T>;
  constructor(
    readonly template: PromptTemplate,
    readonly model: Model<any>,
    readonly taskContext: TaskContext,
    readonly productManager: ProductManager
  ) {}
  abstract execute(): Promise<void>;
  abstract handleResults(results: AiTaskResult[]): Promise<void>;
  abstract handleError(error: Error): Promise<void>;
}

export enum AiTaskResultStatus {
  SUCCESS = "success",
  FAILED = "failed",
}

export interface AiTaskResult<T = any> {
  result: T | null;
  productId: ObjectId;
  status: AiTaskResultStatus;
}

