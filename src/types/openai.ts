import { ChatMessage } from "gpt-tokenizer/esm/GptEncoding";

export interface BatchRequestParams {
  custom_id: string;
  method: string;
  url: string;
  body: Body;
}

export interface Body {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  max_tokens: number;
}

export interface Message {
  role: string;
  content: string;
}



