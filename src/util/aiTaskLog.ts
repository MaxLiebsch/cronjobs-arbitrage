import { CJ_LOGGER, logGlobal } from "./logger.js";

const debug = process.env.NODE_ENV === "development";

export function aiTaskLog(message: string) {
  if (debug) {
    console.log(message);
  } else {
    logGlobal(CJ_LOGGER.BATCHES, message);
  }
}
