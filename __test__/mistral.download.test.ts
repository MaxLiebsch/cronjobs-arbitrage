import { generateTaskcontext } from "../src/util/generateTaskcontext";
import { readTestFile } from "../src/util/readTestFile";

describe('Mistral Download Test', () => {
    const _tasks: any[] = [];
  beforeAll(async () => {
    const tasks = await readTestFile("mistral-complete.tasks.json");
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
  });
});
