import { MongoError, ObjectId } from "@dipmaxtech/clr-pkg";
import { path, readAsync, removeAsync } from "fs-jetpack";
import { PromptTemplates } from "../src/model/implementations/promptTemplates";
import { Queries } from "../src/model/implementations/query";
import { TaskResultSchemas, Tasks } from "../src/model/implementations/tasks";
import { MODEL_NAMES, ModelLimitType } from "../src/model/Model";
import { ProductManager } from "../src/model/ProductManager";
import { TaskContext } from "../src/model/Taskcontext";
import { AiProviders } from "../src/types/aiTasks";
import { Models } from "../src/model/implementations/models/indext";
import {
  MISTRAL_REQUEST_LIMIT,
  OPENAI_TOKEN_LIMIT,
  RECURRENCE_RULE_AI_TASK_MANAGER,
} from "../src/constants";
import { readTestFile } from "../src/util/readTestFile";
import { getProductsCol } from "../src/db/mongo";
import { aiTaskLog } from "../src/util/aiTaskLog";
import { Job, scheduleJob } from "node-schedule";
import { BatchStatus } from "../src/model/BatchContext";
import { FileBasedProcessor } from "../src/model/BatchProceessor";
import { AiTask } from "../src/model/AITask";
import { generateTaskcontext } from "../src/util/generateTaskcontext";

describe("Ai Tasks", () => {
  const _tasks: any[] = [];
  beforeAll(async () => {
    const tasks = await readTestFile("crawler-data.tasks.json");
    _tasks.push(...tasks);
  });

  test("should have a test", () => {
    expect(_tasks.length).toBeGreaterThan(0);
  });

  test("should test openai match titles task", () => {
    const task = _tasks.find(
      (task) =>
        task.taskType === "MATCH_TITLES" && task.provider === AiProviders.OPENAI
    );
    if (!task) throw new Error("Task not found");
    const modelIdentifier = MODEL_NAMES[task.provider][task.modelName];
    const template = PromptTemplates[task.provider][task.taskType];
    const query = Queries[task.taskType];
    const taskContext = new TaskContext(task);
    const productManager = new ProductManager(taskContext);
    const model = new Models[task.provider](modelIdentifier, taskContext);
    const _task = new Tasks[task.taskType](
      model,
      template,
      taskContext,
      productManager,
      query
    );
    expect(model.limit).toBe(OPENAI_TOKEN_LIMIT);
    expect(model.limitType).toBe(ModelLimitType.TOKENS);
    expect(model.name).toBe(modelIdentifier);
    expect(model.client).toBeDefined();
    // Test task properties
    expect(_task).toBeDefined();
    expect(_task.model).toBe(model);
    expect(_task.template).toBe(template);
    expect(_task.taskContext).toBe(taskContext);
    expect(_task.productManager).toBe(productManager);
    expect(_task.query).toBeDefined();

    // Test task context properties
    expect(taskContext.taskType).toBe(task.taskType);
    expect(taskContext._id).toBe(task._id);
    expect(taskContext.provider).toBe(task.provider);
    expect(taskContext.modelName).toBe(task.modelName);
    expect(taskContext.promptVersion).toBe(task.promptVersion);
    expect(taskContext.prefix).toBe(task.prefix);
    expect(taskContext.modelIdentifier).toBe(modelIdentifier);
    expect(taskContext.resultSchema).toBe(TaskResultSchemas[task.taskType]);
  });

  test("should test openai match titles task", () => {
    const task = _tasks.find(
      (task) =>
        task.taskType === "MATCH_TITLES" &&
        task.provider === AiProviders.MISTRAL
    );
    if (!task) throw new Error("Task not found");
    const modelIdentifier = MODEL_NAMES[task.provider][task.modelName];
    const template = PromptTemplates[task.provider][task.taskType];
    const query = Queries[task.taskType];
    const taskContext = new TaskContext(task);
    const productManager = new ProductManager(taskContext);
    const model = new Models[task.provider](modelIdentifier, taskContext);
    const _task = new Tasks[task.taskType](
      model,
      template,
      taskContext,
      productManager,
      query
    );
    expect(model.limit).toBe(MISTRAL_REQUEST_LIMIT);
    expect(model.limitType).toBe(ModelLimitType.REQUESTS);
    expect(model.name).toBe(modelIdentifier);
    expect(model.client).toBeDefined();
    // Test task properties
    expect(_task).toBeDefined();
    expect(_task.model).toBe(model);
    expect(_task.template).toBe(template);
    expect(_task.taskContext).toBe(taskContext);
    expect(_task.productManager).toBe(productManager);
    expect(_task.query).toBeDefined();

    // Test task context properties
    expect(taskContext.taskType).toBe(task.taskType);
    expect(taskContext._id).toBe(task._id);
    expect(taskContext.provider).toBe(task.provider);
    expect(taskContext.modelName).toBe(task.modelName);
    expect(taskContext.promptVersion).toBe(task.promptVersion);
    expect(taskContext.prefix).toBe(task.prefix);
    expect(taskContext.modelIdentifier).toBe(modelIdentifier);
    expect(taskContext.resultSchema).toBe(TaskResultSchemas[task.taskType]);
  });

  // test("should test openai match titles task", async () => {
  //   await addTestProducts();
  //   const task = await getTask(_tasks, "MATCH_TITLES", AiProviders.OPENAI);
  //   const {_task} = await getTaskContext(task);
  //   const completed = await checkTaskCompletion(_task);
  //   expect(completed).toBe(true);
  // }, 100000000);

  // test("should test mistral match titles task", async () => {
  //   await addTestProducts();
  //   const task = await getTask(_tasks, "MATCH_TITLES", AiProviders.MISTRAL);
  //   const {_task} = await getTaskContext(task);
  //   const completed = await checkTaskCompletion(_task);
  //   expect(completed).toBe(true);
  // }, 100000000);

  // test("should test antropic match titles task", async () => {
  //   await addTestProducts();
  //   const task = await getTask(_tasks, "MATCH_TITLES", AiProviders.ANTHROPIC);
  //   const { _task } = await generateTaskcontext(task);
  //   const completed = await checkTaskCompletion(_task);
  //   expect(completed).toBe(true);
  // }, 100000000);

  //  test("should test antropic match titles task", async () => {
  //   await addTestProducts();
  //   const task = await getTask(_tasks, "MATCH_TITLES", AiProviders.ANTHROPIC);
  //   const { _task } = await generateTaskcontext(task);
  //   const completed = await checkTaskCompletion(_task);
  //   expect(completed).toBe(true);
  // }, 100000000);

  //  test("should test antropic quantity task", async () => {
  //   await addNewQtyProducts();
  //   const task = await getTask(_tasks, "DETECT_QUANTITY", AiProviders.ANTHROPIC);
  //   const { _task } = await generateTaskcontext(task);
  //   const completed = await checkTaskCompletion(_task);
  //   expect(completed).toBe(true);
  // }, 100000000);

  // test("should test mistral quantity task", async () => {
  //   await addNewQtyProducts();
  //   const task = await getTask(_tasks, "DETECT_QUANTITY", AiProviders.MISTRAL);
  //   const { _task } = await generateTaskcontext(task);
  //   const completed = await checkTaskCompletion(_task);
  //   expect(completed).toBe(true);
  // }, 100000000);


});

const addTestProducts = async () => {
  const products = await readTestFile("arbispotter_nm.products.json");
  const productCol = await getProductsCol();
  try {
    await productCol.insertMany(
      products.map((p) => {
        delete p.nm_prop;
        delete p.qty_prop;
        delete p.a_vrfd;
        delete p.e_vrfd;
        return p;
      })
    );
  } catch (error) {
    console.log("error:", error);
    if (error instanceof MongoError) {
      if (error.code === 11000) {
        console.log("Already existing");
        await productCol.updateMany(
          {
            _id: { $in: products.map((p) => p._id) },
          },
          {
            $unset: {
              nm_prop: "",
              qty_prop: "",
              a_vrfd: "",
              e_vrfd: "",
            },
          }
        );
      }
    }
  }
};

const addNewQtyProducts = async () => {
  const products = await readTestFile("arbispotter_nm.products.json");
  const productCol = await getProductsCol();
  try {
    await productCol.insertMany(
      products.map((p) => {
        delete p.nm_prop;
        delete p.qty_prop;
        p.a_vrfd = {
          nm_prop: "complete"
        }
        p.e_vrfd = {
          nm_prop: "complete"
        }
        return p;
      })
    );
  } catch (error) {
    console.log("error:", error);
    if (error instanceof MongoError) {
      if (error.code === 11000) {
        console.log("Already existing");
        await productCol.updateMany(
          {
            _id: { $in: products.map((p) => p._id) },
          },
          {
            $set: {
              nm_prop: "",
              qty_prop: "",
              a_qty: 1,
              a_mrgn: 1,
              a_mrgn_pct: 1,
              e_mrgn: 1,
              e_mrgn_pct: 1,
              e_qty: 1,
              a_vrfd: {
                nm_prop: "complete"
              },
              e_vrfd: {
                nm_prop: "complete"
              }
              
            },
          }
        );
      }
    }
  }
};

const getTask = async (_tasks: any[], taskType: string, provider: string) => {
  const task = _tasks.find(
    (task) => task.taskType === taskType && task.provider === provider
  );
  if (!task) throw new Error("Task not found");
  return task;
};

const checkTaskCompletion = async (_task: AiTask) => {
  return new Promise((resolve) => {
    let job:Job | null = null;
    job = scheduleJob(RECURRENCE_RULE_AI_TASK_MANAGER, async () => {
      const { batchContext } = _task.taskContext;
      if (batchContext.status === BatchStatus.NotStarted) {
        aiTaskLog(
          `Starting task ${_task.taskContext.taskType} for ${_task.taskContext.provider}`
        );
        await _task.execute();
        return;
      }
      const progress = await _task.model.getProgress();
      if (progress === BatchStatus.Completed) {
        aiTaskLog(
          `Task ${_task.taskContext.taskType} for ${_task.taskContext.provider} completed`
        );
        const results = await _task.model.getResults();
        aiTaskLog(
          `Task ${_task.taskContext.taskType} for ${_task.taskContext.provider} completed with ${results.length} results`
        );
        await _task.handleResults(results);
        aiTaskLog(
          `Task ${_task.taskContext.taskType} for ${_task.taskContext.provider} handled ${results.length} results`
        );
        if (
          (_task.model as unknown as FileBasedProcessor).deleteFile &&
          _task.taskContext.batchContext.fileId
        ) {
          await (_task.model as unknown as FileBasedProcessor).deleteFile(
            _task.taskContext.batchContext.fileId
          );
        }
        if (_task.taskContext.batchContext.inputPath) {
          await removeAsync(_task.taskContext.batchContext.inputPath);
        }
        await _task.taskContext.resetBatchContext();
        
        if(job)job.cancel();
        resolve(true);
      }

      if (progress === BatchStatus.Failed) {
        aiTaskLog(
          `Task ${_task.taskContext.taskType} for ${_task.taskContext.provider} failed`
        );
        await _task.handleError(new Error("Batch failed"));
        aiTaskLog(
          `Task ${_task.taskContext.taskType} for ${_task.taskContext.provider} handled error`
        );
        if (
          (_task.model as unknown as FileBasedProcessor).deleteFile &&
          _task.taskContext.batchContext.fileId
        ) {
          aiTaskLog(`Deleting file ${_task.taskContext.batchContext.fileId}`);
          await (_task.model as unknown as FileBasedProcessor).deleteFile(
            _task.taskContext.batchContext.fileId
          );
        }
        if (_task.taskContext.batchContext.inputPath) {
          aiTaskLog(
            `Removing input file ${_task.taskContext.batchContext.inputPath}`
          );
          await removeAsync(_task.taskContext.batchContext.inputPath);
        }
        aiTaskLog(
          `Resetting batch context for ${_task.taskContext.taskType} for ${_task.taskContext.provider}`
        );
        await _task.taskContext.resetBatchContext();
        aiTaskLog(
          `Executing task ${_task.taskContext.taskType} for ${_task.taskContext.provider}`
        );
        await _task.execute();
        aiTaskLog(
          `Task ${_task.taskContext.taskType} for ${_task.taskContext.provider} executed`
        );
        if(job)job.cancel();
        resolve(false);
      }
    });
  });
};
