import { Models } from "../model/implementations/models/indext.js";
import { PromptTemplates } from "../model/implementations/promptTemplates/index.js";
import { Queries } from "../model/implementations/query/index.js";
import { Tasks } from "../model/implementations/tasks/index.js";
import { MODEL_NAMES } from "../model/Model.js";
import { ProductManager } from "../model/ProductManager.js";
import { TaskContext } from "../model/Taskcontext.js";

export const generateTaskcontext = async (task: TaskContext)=>{
  const modelIdentifier = MODEL_NAMES[task.provider][task.modelName];
  const template = PromptTemplates[task.provider][task.taskType];
  const query = Queries[task.taskType];
  const taskContext = new TaskContext(task);
  await taskContext.aiTaskTotal.init();
  const productManager = new ProductManager(taskContext);
  const model = new Models[task.provider](modelIdentifier, taskContext);
  const _task = new Tasks[task.taskType](
    model,
    template,
    taskContext,
    productManager,
    query
  ); 
  return {
    _task,
    taskContext,
    productManager,
    model
  }
}