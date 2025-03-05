import { ObjectId } from "@dipmaxtech/clr-pkg";

export type BatchContext = {
  status: BatchStatus;
  batchId?: string | null;
  fileId?: string;
  dataIds?: ObjectId[];
  inputPath?: string;
  createdAt?: number;
  canceledAt?: number;
  completedAt?: number;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
};

export enum BatchStatus {
  NotStarted = "NotStarted",
  Submitted = "Submitted",
  Processing = "Processing",
  Completed = "Completed",
  Failed = "Failed",
}

export type BatchRequest = Record<string, any>;
