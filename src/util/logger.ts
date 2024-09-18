import {
  DbProductRecord,
  DeleteResult,
  InsertOneResult,
  UpdateResult,
} from "@dipmaxtech/clr-pkg";
import pino from "pino";

type LOGGER = "TASK_LOGGER" | "GLOBAL";
// Create a placeholder for the task logger instance
let taskLoggers = {} as { [key in LOGGER]: pino.Logger | null };

// Function to set the logger for the current task
export function setTaskLogger(logger: pino.Logger | null, name: LOGGER) {
  taskLoggers[name] = logger;
}

// Function to get the current task logger
export function getTaskLogger(name?: LOGGER) {
  if (name) {
    return taskLoggers[name];
  } else {
    return taskLoggers["TASK_LOGGER"];
  }
}

export function logGlobal(message: string) {
  const logger = getTaskLogger("GLOBAL");
  const _message = message;

  logger?.info(_message);
}

export function log(
  message: string,
  result?:
    | UpdateResult<DbProductRecord>
    | InsertOneResult<Document>
    | DeleteResult
) {
  const logger = getTaskLogger("TASK_LOGGER");
  let resultStr = "";

  if (result) {
    if ("modifiedCount" in result) {
      resultStr = ` Operation: ${result.modifiedCount} document(s) modified.`;
    } else if ("insertedId" in result) {
      resultStr = ` Operation: Document inserted with ID ${result.insertedId}.`;
    } else if ("deletedCount" in result) {
      resultStr = ` Operation: ${result.deletedCount} document(s) deleted.`;
    }
  }
  const _message = message + resultStr;

  logger?.info(_message);
}
