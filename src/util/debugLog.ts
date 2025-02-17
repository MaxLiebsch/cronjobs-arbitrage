const debug = process.env.DEBUG === "true"; 

export const debugLog = (message: string, ...args: any[]) => {
  if (debug) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};
