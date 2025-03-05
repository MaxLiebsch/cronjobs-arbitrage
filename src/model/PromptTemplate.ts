
export interface PromptTemplate<T extends unknown = unknown> {
    formatMessage(context: T): string
    formatInstruction(context: T): string
}



