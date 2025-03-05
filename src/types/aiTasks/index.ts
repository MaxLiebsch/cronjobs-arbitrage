export enum AiTaskTypes {
    MATCH_TITLES = "MATCH_TITLES",
    DETECT_QUANTITY = "DETECT_QUANTITY",
}

export type AiTaskType = keyof typeof AiTaskTypes

export enum AiProviders {
    OPENAI = "OPENAI",
    ANTHROPIC = "ANTHROPIC",
    MISTRAL = "MISTRAL"
}

export type AiProvider = keyof typeof AiProviders



