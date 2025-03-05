import pkg from 'fs-jetpack';
import { AiTask } from "../src/model/AITask";
import { FileBasedProcessor } from "../src/model/BatchProceessor";
import { aiTaskLog } from "../src/util/aiTaskLog";
import { generateTaskcontext } from "../src/util/generateTaskcontext";
import { readTestFile } from "../src/util/readTestFile";
const {removeAsync} = pkg;

describe('Antropic Download Test', () => {
    const _tasks: any[] = [];
  beforeAll(async () => {
    const tasks = await readTestFile("antropic-complete.tasks.json");
    _tasks.push(...tasks);
  });

  it('should download a file', async () => {
    const task = _tasks[0];

    if (!task) {
      throw new Error("No task context found");
    }
    const {_task} = await generateTaskcontext(task);
    const file = await _task.model.getResults();
    await _task.handleResults(file);
    const cleanupAndRestartTask = async (aiTask: AiTask, isFailure = false) => {
      if (
        (aiTask.model as unknown as FileBasedProcessor).deleteFile &&
        aiTask.taskContext.batchContext.fileId
      ) {
        if (isFailure) {
          aiTaskLog(`Deleting file ${aiTask.taskContext.batchContext.fileId}`);
        }
        await (aiTask.model as unknown as FileBasedProcessor).deleteFile(
          aiTask.taskContext.batchContext.fileId
        );
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
    await cleanupAndRestartTask(_task, false);
  });
});