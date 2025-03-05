import OpenAI from "openai";

import "dotenv/config";
import { config } from "dotenv";
import { Uploadable } from "openai/uploads";
import pkg from 'fs-jetpack';
const { createReadStream } = pkg;

config({
  path: [`.env`],
});

const apiKey = process.env.OPEN_AI_KEY;

const openai = new OpenAI({
  apiKey, // This is the default and can be omitted
});

/*
{
  object: 'file',
  id: 'file-pqVmvHzgw1Nc8dQOOAryBerS',
  purpose: 'batch',
  filename: 'batch-1721060768463.json',
  bytes: 9568,
  created_at: 1721060772,
  status: 'processed',
  status_details: null
}
*/

export const uploadFile = async (filepath: string) => {
  return openai.files.create({
    file: createReadStream(filepath),
    purpose: "batch",
  });
};

export const deleteFile = async (fileId: string) => {
  return openai.files.del(fileId);
};

export const uploadFileFromReadstream = async (readStream: Uploadable) => {
  return openai.files.create({
    file: readStream,
    purpose: "batch",
  });
};

/* 
{
  id: 'batch_Xk70u5w2vV0gyNKVp0t9s5hl',
  object: 'batch',
  endpoint: '/v1/chat/completions',
  errors: null,
  input_file_id: 'file-pqVmvHzgw1Nc8dQOOAryBerS',
  completion_window: '24h',
  status: 'validating',
  output_file_id: null,
  error_file_id: null,
  created_at: 1721060773,
  in_progress_at: null,
  expires_at: 1721147173,
  finalizing_at: null,
  completed_at: null,
  failed_at: null,
  output_file_id: null,
  error_file_id: null,
  created_at: 1721060773,
  in_progress_at: null,
  expires_at: 1721147173,
  finalizing_at: null,
  completed_at: null,
  failed_at: null,
  expired_at: null,
  cancelling_at: null,
  cancelled_at: null,
  request_counts: { total: 0, completed: 0, failed: 0 },
  output_file_id: null,
  error_file_id: null,
  created_at: 1721060773,
  in_progress_at: null,
  expires_at: 1721147173,
  finalizing_at: null,
  completed_at: null,
  failed_at: null,
  expired_at: null,
  cancelling_at: null,
  cancelled_at: null,
  request_counts: { total: 0, completed: 0, failed: 0 },
  metadata: null
} 
*/

export const createBatch = async (fileId: string) => {
  return openai.batches.create({
    input_file_id: fileId,
    endpoint: "/v1/chat/completions",
    completion_window: "24h",
  });
};

export const retrieveBatch = async (batchId: string) => {
  return openai.batches.retrieve(batchId);
};

export const retrieveOutputFile = async (outputfileId: string) => {
  const fileResponse = await openai.files.content(outputfileId);
  return fileResponse.text();
};
