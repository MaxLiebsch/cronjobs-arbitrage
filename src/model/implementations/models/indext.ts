import { AiProviders } from "../../../types/aiTasks/index.js";
import { Model, ModelType } from "../../Model.js";
import { TaskContext } from "../../Taskcontext.js";
import { AntropicModel } from "./AntropicModel.js";
import { MistralModel } from "./MistralModel.js";
import { OpenAIModel } from "./OpenAIModel.js";

type ModelConstructor = new (modelType: ModelType, taskContext: TaskContext) => Model<any>;

export const Models: Record<string, ModelConstructor> = {
  [AiProviders.OPENAI]: OpenAIModel,
  [AiProviders.MISTRAL]: MistralModel,
  [AiProviders.ANTHROPIC]: AntropicModel,
} as const;
