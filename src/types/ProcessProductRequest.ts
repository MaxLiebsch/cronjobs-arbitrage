import { DbProductRecord } from "@dipmaxtech/clr-pkg";
import { ErrorTypes } from "../util/scError.js";

export interface ProcessProductRequest {
  product: DbProductRecord;
  errors: ErrorTypes[];
  update: Partial<DbProductRecord>;
}

export interface ProcessProductReponse {
  errors: ErrorTypes[];
  update: Partial<DbProductRecord>;
}
