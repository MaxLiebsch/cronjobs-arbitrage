import { DbProductRecord } from "@dipmaxtech/clr-pkg";
import { AiTaskResult } from "./AITask.js";
import { BatchRequest, BatchStatus } from "./BatchContext.js";
import { PromptTemplate } from "./PromptTemplate.js";

export interface BatchProcessor<T extends any = DbProductRecord> {
  createBatchRequest(
    message: string,
    instruction: string,
    ...rest: any[]
  ): BatchRequest;
  startBatch(
    promptTemplate: PromptTemplate,
    products: T[]
  ): Promise<
    { data: any; unusedProducts: T[] } | { error: Error; unusedProducts: T[] }
  >;
  retrieveContent<F = any>(fileId: string): F;
  retrieveBatch<B = any>(batchId: string): B;
  getProgress(): Promise<BatchStatus>;
  batchStatus(status: unknown): BatchStatus;
  getResults(): Promise<AiTaskResult[]>;
}


export abstract class FileBasedProcessor<T extends any = DbProductRecord> implements BatchProcessor<T> {
  abstract createBatchRequest(
    message: string,
    instruction: string,
    ...rest: any[]
  ): BatchRequest;
  abstract startBatch(
    promptTemplate: PromptTemplate,
    products: T[]
  ): Promise<
    { data: any; unusedProducts: T[] } | { error: Error; unusedProducts: T[] }
  >;
  abstract getProgress(): Promise<BatchStatus>;
  abstract retrieveContent<F = any>(fileId: string): F;
  abstract retrieveBatch<B = any>(batchId: string): B;
  abstract batchStatus(status: unknown): BatchStatus;
  abstract getResults(): Promise<AiTaskResult[]>;
  abstract uploadFile<F>(filepath: string): F;
  abstract deleteFile<F>(fileId: string): F;
}

export abstract class ApiBasedProcessor<T extends any = DbProductRecord> implements BatchProcessor<T> {
  abstract createBatchRequest(
    message: string,
    instruction: string,
    ...rest: any[]
  ): BatchRequest;
  abstract startBatch(
    promptTemplate: PromptTemplate,
    products: T[]
  ): Promise<
    { data: any; unusedProducts: T[] } | { error: Error; unusedProducts: T[] }
  >;
  abstract retrieveContent<F = any>(fileId: string): F;
  abstract retrieveBatch<B = any>(batchId: string): B;
  abstract getProgress(): Promise<BatchStatus>;
  abstract batchStatus(status: unknown): BatchStatus;
  abstract getResults(): Promise<AiTaskResult[]>;
}
