import { DbProductRecord } from "@dipmaxtech/clr-pkg";
import { AiProvider } from "../types/aiTasks/index.js";
import { AiTaskResult } from "./AITask.js";
import { BatchStatus } from "./BatchContext.js";
import { PromptTemplate } from "./PromptTemplate.js";


export type OpenAIModels= 'gpt-4o-mini-2024-07-18'
export type AnthropicModels= 'claude-3-5-haiku-20241022'
export type MistralModels= 'mistral-small-latest'

export type ModelType = OpenAIModels | AnthropicModels | MistralModels;

export const MODEL_NAMES: Record<AiProvider, Record<string, ModelType>> = {
  OPENAI: {
    GPT4_MINI: "gpt-4o-mini-2024-07-18",
  },
  ANTHROPIC: {
    HAIKU: "claude-3-5-haiku-20241022",
  },
  MISTRAL: {
    SMALL: "mistral-small-latest",
  },
} as const;

export type ModelIdentifier = keyof (typeof MODEL_NAMES)[AiProvider];

export enum ModelLimitType {
  TOKENS = "tokens",
  REQUESTS = "requests",
}

export abstract class Model<C extends unknown> {
  abstract limit: number;
  abstract name: ModelType;
  abstract limitType: ModelLimitType;
  abstract client: C;
  abstract startBatch(
    promptTemplate: PromptTemplate,
    products: DbProductRecord[]
  ): Promise<
    | { data: any; batchSize: number; unusedProducts: DbProductRecord[] }
    | { error: Error; unusedProducts: DbProductRecord[] }
  >;
  abstract getProgress(): Promise<BatchStatus>;
  abstract getResults(): Promise<AiTaskResult[]>;
}
