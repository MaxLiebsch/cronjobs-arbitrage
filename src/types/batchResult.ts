import { Batch } from "mongodb";

export interface BatchResult {
  id: string;
  custom_id: string;
  response: Response;
  error: any;
}

export interface Response {
  status_code: number;
  request_id: string;
  body: Body;
}

export interface Body {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
  system_fingerprint: string;
}

export interface Choice {
  index: number;
  message: Message;
  logprobs: any;
  finish_reason: string;
}

export interface Message {
  role: string;
  content: string;
  refusal: any;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  completion_tokens_details: CompletionTokensDetails;
}

export interface CompletionTokensDetails {
  reasoning_tokens: number;
}

export type BatchResults = Array<BatchResult>;
