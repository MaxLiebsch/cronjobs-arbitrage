import { TaskResultSchema } from "../../TaskResultSchema.js";


export interface MatchTitleTaskResult {
  a_score?: number;
  a_isMatch?: boolean;
  a_explain?: string;
  e_score?: number;
  e_isMatch?: boolean;
  e_explain?: string;
}

export const MatchTitleTaskResultSchema: TaskResultSchema = {
    type: "json_object",
    jsonSchema: {
      strict: true,
      name: "match_title",
      schemaDefinition: {
        a_score: { type: "number" },
        a_isMatch: { type: "boolean" },
        e_score: { type: "number" },
        e_isMatch: { type: "boolean" },
      },
    },
  
};

export interface DetectQuantityTaskResult {
  nm: number;
  nm_score: number;
  nm_produktart?: string;
  nm_explain?: string;
  a_nm?: number;
  a_score?: number;
  a_produktart?: string;
  a_explain?: string;
  e_nm?: number;
  e_score?: number;
  e_produktart?: string;
  e_explain?: string;
}

export const DetectQuantityTaskResultSchema: TaskResultSchema = {
  type: "json_object",
  jsonSchema: {
    strict: true,
    name: "quantities",
    schemaDefinition: {
      nm: { type: "number" },
      nm_score: { type: "number" },
      nm_produktart: { type: "string" },
      nm_explain: { type: "string" },
      a_nm: { type: "number" },
      a_score: { type: "number" },
      a_produktart: { type: "string" },
      a_explain: { type: "string" },
      e_nm: { type: "number" },
      e_score: { type: "number" },
      e_produktart: { type: "string" },
      e_explain: { type: "string" },
    },
  },
}
