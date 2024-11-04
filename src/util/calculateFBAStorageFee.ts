import { Dimensions } from "@dipmaxtech/clr-pkg";

export function calculateFBAStorage(
  dimensions: Dimensions,
  pricePerCubicMeter: number
) {
  const { width, height, length } = dimensions;
  // Convert from mm³ to m³
  const volumeM3 = (length * width * height) / 1000000000;

  // Calculate monthly storage cost
  const monthlyStorageCost = volumeM3 * pricePerCubicMeter * 6;

  return {
    volumeM3,
    monthlyStorageCost,
    calculationBreakdown: `${volumeM3} x ${pricePerCubicMeter} = ${monthlyStorageCost}`,
  };
}
