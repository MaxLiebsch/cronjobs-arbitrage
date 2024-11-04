import {
  getPackageSize,
  retrieveTransportFee,
} from "../src/util/calculateTransportFee.js";
import { describe, expect, test, beforeAll } from "@jest/globals";
import { testCases } from "./testcasesTransport.js";

describe("getPackageSize", () => {
  test("should return small package", () => {
    const dimensions = {
      height: 103,
      length: 189,
      width: 121,
      weight: 920,
    };
    const size = getPackageSize(dimensions);
    const fee = retrieveTransportFee(size, dimensions.weight, "DE");
    console.log("small fee:", fee);
    expect(size).toBe("small");
  });

  test("should return standard package", () => {
    const dimensions = {
      height: 450,
      length: 220,
      width: 330,
      weight: 10920,
    };
    const size = getPackageSize(dimensions);
    const fee = retrieveTransportFee(size, dimensions.weight, "DE");
    console.log("standard fee:", fee);
    expect(size).toBe("standard");
  });

  test("should return smallOversize package", () => {
    const dimensions = {
      height: 610,
      length: 460,
      width: 460,
      weight: 25810,
    };
    const size = getPackageSize(dimensions);
    const fee = retrieveTransportFee(size, dimensions.weight, "DE");
    console.log("smallOversize fee:", fee);
    expect(size).toBe("smallOversize");
  });

  test("should return standardOversize pacakge", () => {
    const dimensions = {
      height: 600,
      length: 1200,
      width: 600,
      weight: 29760,
    };
    const size = getPackageSize(dimensions);
    const fee = retrieveTransportFee(size, dimensions.weight, "DE");
    console.log("standardOversize fee:", fee);
    expect(size).toBe("standardOversize");
  });

  test("should return bigOversize package", () => {
    const dimensions = {
      height: 1750,
      length: 1200,
      width: 600,
      weight: 31500,
    };
    const size = getPackageSize(dimensions);
    const fee = retrieveTransportFee(size, dimensions.weight, "DE");
    console.log("bigOversize fee:", fee);
    expect(size).toBe("bigOversize");
  });

  test("should return bgiOversize package", () => {
    const dimensions = {
      height: 1750,
      length: 1750,
      width: 1750,
      weight: 31600,
    };
    const size = getPackageSize(dimensions);
    expect(size).toBe("bigOversize");

    const fee = retrieveTransportFee(size, dimensions.weight, "DE");
    console.log("extraOversize fee:", fee);
    expect(fee).toBe(13.17);
  });


  testCases.map((testCase) => {
    test(`{id: ${testCase.id}} should return ${testCase.packagetype} package`, () => {
      const dimensions = {
        width: testCase.dimensions.width,
        height: testCase.dimensions.height,
        length: testCase.dimensions.length,
        weight: testCase.dimensions.weight,
      };
      const size = getPackageSize(dimensions);
      expect(size).toBe(testCase.packagetype);

      const fee = retrieveTransportFee(size, dimensions.weight, "DE");
      expect(fee).toBe(testCase.costs);
    });
  });
});
