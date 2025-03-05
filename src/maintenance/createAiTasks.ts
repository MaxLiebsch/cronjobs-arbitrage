import { getCrawlDataCollection } from "../db/mongo";
import { MODEL_NAMES } from "../model/Model";
import { TaskContext } from "../model/Taskcontext";
import { AiProviders, AiTaskTypes } from "../types/aiTasks";

const providers = [
  AiProviders.OPENAI,
  AiProviders.MISTRAL,
  AiProviders.ANTHROPIC,
];

const taskTypes = [AiTaskTypes.MATCH_TITLES, AiTaskTypes.DETECT_QUANTITY];

async function createAiTasks() {
  const taskRepository = await getCrawlDataCollection("tasks");

  for (const provider of providers) {
    for (const taskType of taskTypes) {
      let modelName = "";
      switch (provider) {
        case AiProviders.OPENAI:
          modelName = "GPT4_MINI";
          break;
        case AiProviders.MISTRAL:
          modelName = "SMALL";
          break;
        case AiProviders.ANTHROPIC:
          modelName = "HAIKU";
          break;
      }
      const modelType = MODEL_NAMES[provider][modelName];
      const task: Partial<TaskContext> = {
        type: "AI_TASKS_NEW",
        taskType,
        provider,
        active: true,
        modelIdentifier: modelType,
        modelName,
        promptVersion: taskType === AiTaskTypes.MATCH_TITLES ? "v1" : "v6",
        prefix: taskType === AiTaskTypes.MATCH_TITLES ? "nm" : "qty",
      };
      await taskRepository.insertOne(task);
    }
  }
}

createAiTasks().then(() => {
  console.log("Ai tasks created");
  process.exit(0);
});
