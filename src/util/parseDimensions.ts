import { Dimensions, roundToTwoDecimals } from "@dipmaxtech/clr-pkg";

export const parseDimensions = (dimensions: Dimensions) => {
  const parsedDimensions = Object.entries(dimensions).reduce<Dimensions>(
    (acc, [key, value]) => {
      if (key !== "weight" && value > 0) {
        acc[key as keyof Dimensions] = roundToTwoDecimals(value / 10); // value is in cm, convert to mm
      } else if (key === "weight" && value > 0) {
        acc[key as keyof Dimensions] = value / 1000; // value is in grams, convert to kg
      }
      return acc;
    },
    {} as Dimensions
  );
  return parsedDimensions;
};
