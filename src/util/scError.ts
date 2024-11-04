export type ErrorTypes =
  | "productMatchError"
  | "glProductGroupNameError"
  | "feeFinderError"
  | "asinMatchError"
  | "missingAsinError"
  | "noDimensionsError"
  | "noCategoriesError"
  | "tRexIdError"
  | "newFeeFinderError";

export const ERRORS = {
  scHappyPath: {
    productMatch: "productMatchError",
    glProductGroupName: "glProductGroupNameError",
    feeFinder: "feeFinderError",
    asinMatch: "asinMatchError",
    missingAsin: "missingAsinError",
  },
  scNewHappyPath: {
    noDimensions: "noDimensionsError",
    noCategories: "noCategoriesError",
    tRexId: "tRexIdError",
    newFeeFinder: "newFeeFinderError",
  },
};
