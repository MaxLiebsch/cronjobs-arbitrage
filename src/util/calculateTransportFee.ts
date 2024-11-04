import {
  amazonTransportFee,
  Dimensions,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { packageSize } from "../constants.js";
import transportFees from "../static/transportFees.js";

type PackageSizeKey = keyof typeof packageSize;

export function getPackageSize({
  width,
  height,
  length,
  weight,
}: Dimensions): PackageSizeKey | null {
  const sortedDimensions = [width, height, length].sort((a, b) => b - a); // Sort dimensions: longest, median, shortest
  const longest = sortedDimensions[0];
  const median = sortedDimensions[1];
  const shortest = sortedDimensions[2];

  const calculateVolumeWeight = (
    width: number,
    height: number,
    length: number
  ): number => {
    return (width * height * length) / 5000; // Assuming standard volumetric weight divisor
  };

  const smallEnvelope = packageSize.smallEnvelope;

  if (
    longest <= smallEnvelope.longest &&
    median <= smallEnvelope.median &&
    shortest <= smallEnvelope.shortest &&
    weight! <= smallEnvelope.maxWeight
  ) {
    return "smallEnvelope";
  }

  const standardEnvelope = packageSize.standardEnvelope;

  if (
    longest <= standardEnvelope.longest &&
    median <= standardEnvelope.median &&
    shortest <= standardEnvelope.shortest &&
    weight! <= standardEnvelope.maxWeight
  ) {
    return "standardEnvelope";
  }

  const bigEnvelope = packageSize.bigEnvelope;

  if (
    longest <= bigEnvelope.longest &&
    median <= bigEnvelope.median &&
    shortest <= bigEnvelope.shortest &&
    weight! <= bigEnvelope.maxWeight
  ) {
    return "bigEnvelope";
  }

  const extraEnvelope = packageSize.extraEnvelope;

  if (
    longest <= extraEnvelope.longest &&
    median <= extraEnvelope.median &&
    shortest <= extraEnvelope.shortest &&
    weight! <= extraEnvelope.maxWeight
  ) {
    return "extraEnvelope";
  }

  const volumeweight = calculateVolumeWeight(width, height, length);

  const small = packageSize.small;

  if (
    longest <= small.longest &&
    median <= small.median &&
    shortest <= small.shortest &&
    weight! <= small.maxWeight
  ) {
    return "small";
  }
  const standard = packageSize.standard;
  if (
    longest <= standard.longest &&
    median <= standard.median &&
    shortest <= standard.shortest &&
    weight! <= standard.maxWeight
  ) {
    return "standard";
  }

  const smallOversize = packageSize.smallOversize;

  if (
    volumeweight <= smallOversize.volumnWeight &&
    longest <= smallOversize.longest &&
    shortest <= smallOversize.shortest &&
    median <= smallOversize.median
  ) {
    return "smallOversize";
  }

  const standardOversize = packageSize.standardOversize;

  if (
    volumeweight <= standardOversize.volumnWeight &&
    longest <= standardOversize.longest &&
    shortest <= standardOversize.shortest &&
    median <= standardOversize.median
  ) {
    return "standardOversize";
  }

  const bigOversize = packageSize.bigOversize;

  if (
    longest <= bigOversize.longest &&
    longest >= bigOversize.shortest
  ) {
    return "bigOversize";
  }

  const extraOversize = packageSize.extraOversize;

  const permieter = longest + 2 * width + 2 * height;

  if (
    (longest > extraOversize.longest || permieter > extraOversize.perimeter)
  ) {
    return "extraOversize";
  }

  return null; // No matching package size
}

export type CountryCode =
  | "DE"
  | "FR"
  | "IT"
  | "ES"
  | "UK"
  | "Programm Mitteleuropa (DE/PL/CZ)";

export function retrieveTransportFee(
  packageSize: PackageSizeKey | null,
  weight: number,
  countryCode: CountryCode = "DE"
): number {
  const transportFeeGroup = transportFees.filter(
    (fees) => fees.package_type === packageSize
  );
  if (transportFeeGroup.length === 0) {
    return 0;
  }
  const sortedTransportFees = transportFeeGroup.sort(
    (a, b) => a.weight_limit_grams - b.weight_limit_grams
  );

  const transportFee = sortedTransportFees.find(
    (fee) => weight <= fee.weight_limit_grams
  );

  if (!transportFee) {
    const biggestFee = sortedTransportFees[sortedTransportFees.length - 1];
    const extrakgPrice = biggestFee.prices[countryCode]?.extrakg || 0.01;
    const price = biggestFee.prices[countryCode]?.price || 0;
    const overWeight = weight - biggestFee.weight_limit_grams;
    const extraKg = Math.ceil(overWeight / 1000); // Calculate the number of started kilograms
    const extraPrice =
      extraKg * extrakgPrice < 0.01 ? 0.01 : extraKg * extrakgPrice;
    return roundToTwoDecimals(extraPrice + price); // grams to kg
  } else {
    return roundToTwoDecimals(transportFee.prices[countryCode]!.price) || 0;
  }
}
