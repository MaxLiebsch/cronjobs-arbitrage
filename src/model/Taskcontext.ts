import { ObjectId } from "@dipmaxtech/clr-pkg";
import { AiProvider, AiTaskTypes } from "../types/aiTasks/index.js";
import { AiTaskTotal } from "./AiTaskTotal.js";
import { BatchContext, BatchStatus } from "./BatchContext.js";
import { ModelType } from "./Model.js";
import { TaskRepository } from "./TaskRepository.js";
import { TaskResultSchemas } from "./implementations/tasks/index.js";

export class TaskContext {
  readonly type: string;
  readonly active: boolean;
  readonly total: number = 0;
  readonly yesterdaysTotal: number = 0;
  readonly totalBatches: number = 0;
  readonly yesterdaysTotalBatches: number = 0;
  readonly _id: ObjectId; // MongoDB document ID
  readonly taskType: AiTaskTypes; // Type of task (classification, generation, etc.)
  readonly provider: AiProvider;
  readonly resultSchema: Record<string, any>;
  readonly modelIdentifier: ModelType; // The model type being used
  readonly modelName: string;
  readonly promptVersion: string;
  readonly prefix: string;
  batchContext: BatchContext;
  retryAfter?: Date; // For rate limiting
  errorMessage?: string;
  taskRepository: TaskRepository = new TaskRepository();
  aiTaskTotal: AiTaskTotal = new AiTaskTotal(this);

  constructor(taskContext: TaskContext) {
    this._id = taskContext._id;
    this.active = taskContext.active;
    this.type = taskContext.type;
    this.taskType = taskContext.taskType;
    this.provider = taskContext.provider;
    this.modelIdentifier = taskContext.modelIdentifier;
    this.modelName = taskContext.modelName;
    this.promptVersion = taskContext.promptVersion;
    this.prefix = taskContext.prefix;
    this.resultSchema = TaskResultSchemas[taskContext.taskType];
    if (taskContext.batchContext) {
      this.batchContext = taskContext.batchContext;
    } else {
      this.batchContext = {
        status: BatchStatus.NotStarted,
        progress: {
          total: 0,
          completed: 0,
          failed: 0,
        },
      } as BatchContext;
    }
    this.retryAfter = taskContext.retryAfter;
    this.errorMessage = taskContext.errorMessage;
  }
  private async save() {
    const update = {
      batchContext: this.batchContext,
      errorMessage: this.errorMessage,
      retryAfter: this.retryAfter,
    };
    await this.taskRepository.update(this, update);
  }
  async updateBatchContext(batchContext: Partial<BatchContext>) {
    this.batchContext = {
      ...this.batchContext,
      ...batchContext,
    } as BatchContext;
    await this.save();
  }
  async resetBatchContext() {
    this.batchContext = {
      status: BatchStatus.NotStarted,
      progress: {
        total: 0,
        completed: 0,
        failed: 0,
      },
    };
    await this.save();
  }
  updateRetryAfter(retryAfter: Date) {
    this.retryAfter = retryAfter;
  }
  updateErrorMessage(errorMessage: string) {
    this.errorMessage = errorMessage;
  }
}
