import { LocalLogger } from "@dipmaxtech/clr-pkg";
import pkg from "fs-jetpack";
import { Job, scheduleJob } from "node-schedule";
import { RECURRENCE_RULE_AI_TASK_MANAGER } from "../constants.js";
import { AiProviders } from "../types/aiTasks/index.js";
import { aiTaskLog } from "../util/aiTaskLog.js";
import { generateTaskcontext } from "../util/generateTaskcontext.js";
import { CJ_LOGGER, setTaskLogger } from "../util/logger.js";
import { AiTask } from "./AITask.js";
import { BatchStatus } from "./BatchContext.js";
import { FileBasedProcessor } from "./BatchProceessor.js";
import { TaskRepository } from "./TaskRepository.js";
const { removeAsync } = pkg;

export class AiTaskManager {
  private aitasks: AiTask[] = [];
  private taskRepository: TaskRepository = new TaskRepository();
  private job: Job | null = null;
  private loggerName = CJ_LOGGER.BATCHES;

  public async init() {
    const aiTasks = await this.taskRepository.findAll();
    const logger = new LocalLogger().createLogger(this.loggerName);
    setTaskLogger(logger, this.loggerName);
    for (const aiTask of aiTasks) {
      if (!aiTask.active) continue;
      const { _task } = await generateTaskcontext(aiTask);
      this.addTask(_task);
    }
    aiTaskLog("AiTaskManager initialized");
    this.startProgressCheck();
    aiTaskLog("Progress check started");
  }
  public startProgressCheck() {
    if (this.job) return;
    aiTaskLog("Starting progress check");
    this.job = scheduleJob(RECURRENCE_RULE_AI_TASK_MANAGER, async () => {
      // Sort tasks to prioritize in order: Anthropic, Mistral, then OpenAI
      this.aitasks.sort((a, b) => {
        const getProviderPriority = (task: AiTask) => {
          const provider = task.taskContext.provider.toLowerCase();
          if (provider === AiProviders.ANTHROPIC) return 1;
          if (provider === AiProviders.MISTRAL) return 2;
          if (provider === AiProviders.OPENAI) return 3;
          return 4; // Any other provider
        };
        return getProviderPriority(a) - getProviderPriority(b);
      });
      for (const aiTask of this.aitasks) {
        const remoteTask = await this.taskRepository.findById(
          aiTask.taskContext
        );
        // Replace the task in aiTasks with the latest version from the repository
        if (remoteTask) {
          const index = this.aitasks.findIndex(
            (t) =>
              t.taskContext.provider === remoteTask.provider &&
              t.taskContext.taskType === remoteTask.taskType
          );
          if (index !== -1 && remoteTask.active) {
            const { _task } = await generateTaskcontext(remoteTask);
            this.aitasks[index] = _task;
          } else if (index !== -1 && !remoteTask.active) {
            continue; // Skip processing this task because it is inactive
          }
        } else {
          const index = this.aitasks.findIndex(
            (t) =>
              t.taskContext.provider === aiTask.taskContext.provider &&
              t.taskContext.taskType === aiTask.taskContext.taskType
          );

          aiTaskLog(
            `Task ${aiTask.taskContext.taskType} for ${aiTask.taskContext.provider} not found in repository`
          );
          this.aitasks.splice(index, 1);
          continue;
        }
        await this.processTaskBatch(aiTask);
      }
    });
  }
  public stopProgressCheck() {
    if (!this.job) return;
    this.job.cancel();
  }
  public addTask(aiTask: AiTask) {
    this.aitasks.push(aiTask);
  }
  private processTaskBatch = async (aiTask: AiTask) => {
    const { batchContext } = aiTask.taskContext;
    if (batchContext.status === BatchStatus.NotStarted) {
      await aiTask.execute();
      return;
    }

    const progress = await aiTask.model.getProgress();
    if (progress === BatchStatus.Completed) {
      await this.handleCompletedTask(aiTask);
    }

    if (progress === BatchStatus.Failed) {
      await this.handleFailedTask(aiTask);
    }
  };
  private handleCompletedTask = async (aiTask: AiTask) => {
    const results = await aiTask.model.getResults();
    aiTaskLog(
      `Task ${aiTask.taskContext.taskType} for ${aiTask.taskContext.provider} completed with ${results.length} results`
    );
    await aiTask.handleResults(results);
    aiTaskLog(
      `Task ${aiTask.taskContext.taskType} for ${aiTask.taskContext.provider} handled ${results.length} results`
    );
    await this.cleanupAndRestartTask(aiTask);
  };
  private handleFailedTask = async (aiTask: AiTask) => {
    aiTaskLog(
      `Task ${aiTask.taskContext.taskType} for ${aiTask.taskContext.provider} failed`
    );
    await aiTask.handleError(new Error("Batch failed"));
    aiTaskLog(
      `Task ${aiTask.taskContext.taskType} for ${aiTask.taskContext.provider} handled error`
    );
    await this.cleanupAndRestartTask(aiTask, true);
  };
  private cleanupAndRestartTask = async (aiTask: AiTask, isFailure = false) => {
    if (
      (aiTask.model as unknown as FileBasedProcessor).deleteFile &&
      aiTask.taskContext.batchContext.fileId
    ) {
      if (isFailure) {
        aiTaskLog(`Deleting file ${aiTask.taskContext.batchContext.fileId}`);
      }
      try {
        await (aiTask.model as unknown as FileBasedProcessor).deleteFile(
          aiTask.taskContext.batchContext.fileId  
        );
      } catch (error) {
        aiTaskLog(`Error deleting file ${aiTask.taskContext.batchContext.fileId}: ${error}`);
      }
    }
    if (aiTask.taskContext.batchContext.inputPath) {
      if (isFailure) {
        aiTaskLog(
          `Removing input file ${aiTask.taskContext.batchContext.inputPath}`
        );
      }
      await removeAsync(aiTask.taskContext.batchContext.inputPath);
    }
    if (isFailure) {
      aiTaskLog(
        `Resetting batch context for ${aiTask.taskContext.taskType} for ${aiTask.taskContext.provider}`
      );
    }
    await aiTask.taskContext.resetBatchContext();
    if (isFailure) {
      aiTaskLog(
        `Executing task ${aiTask.taskContext.taskType} for ${aiTask.taskContext.provider}`
      );
    }
    await aiTask.execute();
  };
}
