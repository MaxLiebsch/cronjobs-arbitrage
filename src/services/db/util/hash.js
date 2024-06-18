import crypto from "crypto";

export const createHash = (str) => crypto.createHash("md5").update(str).digest("hex")

export const verifyHash = (str, hash) => createHash(str) === hash;