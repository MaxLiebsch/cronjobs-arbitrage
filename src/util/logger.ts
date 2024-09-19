import {
  DbProductRecord,
  DeleteResult,
  InsertOneResult,
  UpdateResult,
  CronjobTasks,
} from "@dipmaxtech/clr-pkg";
import pino from "pino";

// Define the logger types
/*
  Delete unwatched products
  Control process props
  Look for pending keepa lookups
  Resurrection from grave
*/

export const CJ_LOGGER: { [key in CronjobTasks]: CronjobTasks } = {
  UNWATCHED_PRODUCTS: "UNWATCHED_PRODUCTS",
  PROCESS_PROPS: "PROCESS_PROPS",
  PENDING_KEEPAS: "PENDING_KEEPAS",
  RESURRECTION: "RESURRECTION",
  BATCHES: "BATCHES",
};

// Create a placeholder for the task logger instance
let taskLoggers = {} as { [key in CronjobTasks]: pino.Logger | null };

// Function to set the logger for the current task
export function setTaskLogger(logger: pino.Logger | null, name: CronjobTasks) {
  taskLoggers[name] = logger;
}

// Function to get the current task logger
export function getTaskLogger(name: CronjobTasks) {
  if (name) {
    return taskLoggers[name];
  }
}

export function logGlobal(name: CronjobTasks, message: string) {
  const logger = getTaskLogger(name);
  const _message = message;

  logger?.info(_message);
}

// export function log(
//   message: string,
//   result?:
//     | UpdateResult<DbProductRecord>
//     | InsertOneResult<Document>
//     | DeleteResult
// ) {
//   const logger = getTaskLogger("TASK_Logger");
//   let resultStr = "";

//   if (result) {
//     if ("modifiedCount" in result) {
//       resultStr = ` Operation: ${result.modifiedCount} document(s) modified.`;
//     } else if ("insertedId" in result) {
//       resultStr = ` Operation: Document inserted with ID ${result.insertedId}.`;
//     } else if ("deletedCount" in result) {
//       resultStr = ` Operation: ${result.deletedCount} document(s) deleted.`;
//     }
//   }
//   const _message = message + resultStr;

//   logger?.info(_message);
// }
