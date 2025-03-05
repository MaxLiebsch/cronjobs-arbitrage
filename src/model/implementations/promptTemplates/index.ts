import { AiProviders, AiTaskTypes } from "../../../types/aiTasks/index.js";
import { DetectQuantityAntropicPromptTemplate } from "./detectQuantityAntropicPromptTemplate.js";
import { DetectQuantityMistralPromptTemplate } from "./detectQuantityMistralPromptTemplate.js";
import { DetectQuantityOpenaiPromptTemplate } from "./detectQuantityOpenaiPromptTemplate.js";
import { MatchTitlesAntropicPromptTemplate } from "./matchTitlesAntropicPromptTemplate.js";
import { MatchTitlesMistralPromptTemplate } from "./matchTitlesMistralPromptTemplate.js";
import { MatchTitlesOpenaiPromptTemplate } from "./matchTitlesOpenaiPromptTemplate.js";

type PromptTemplateMap = {
  [K: string]: any; // Replace 'any' with specific template types
};

export const PromptTemplates: Record<string, PromptTemplateMap> = {
  [AiProviders.OPENAI]: {
    [AiTaskTypes.DETECT_QUANTITY]: new DetectQuantityOpenaiPromptTemplate(),    
    [AiTaskTypes.MATCH_TITLES]: new MatchTitlesOpenaiPromptTemplate(),
  },
  [AiProviders.MISTRAL]: {
    [AiTaskTypes.DETECT_QUANTITY]: new DetectQuantityMistralPromptTemplate(),
    [AiTaskTypes.MATCH_TITLES]: new MatchTitlesMistralPromptTemplate(),
  },
  [AiProviders.ANTHROPIC]: {
    [AiTaskTypes.DETECT_QUANTITY]: new DetectQuantityAntropicPromptTemplate(),
    [AiTaskTypes.MATCH_TITLES]: new MatchTitlesAntropicPromptTemplate(),
  },
};