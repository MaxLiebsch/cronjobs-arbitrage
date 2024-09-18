export interface BatchTask {
  type: string;
  id: string;
  createdAt: string;
  startedAt: string;
  batches: Batch[];
}

export interface Batch {
  batchId: string;
  shopDomains: string[];
  count: number;
  filepath: string;
  processed: boolean;
  status: string;
}

export type BatchTaskTypes = "MATCH_TITLES" | "DETECT_QUANTITY"
