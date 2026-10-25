import {
  generateEquipmentExercise,
  generateValueExercise,
} from "@test/factories/valueExercise";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import { readLowestPermittedWeight, stepWeight } from "./weightStep";

describe("weightStep: stepWeight", () => {
  it.each([
    [70, 65, 68.25],
    [66, 65, 65],
    [52, 50, 50.7],
    [51, 50, 50],
    [64, 65, 64],
  ])(
    "lowers %p percent of F-Max without an F-Max and a lowest weight of %p to %p",
    (weight, lowestWeight, expected) => {
      expect(
        stepWeight(
          weight,
          "DECREASE",
          generateEquipmentExercise("KETTLEBELL", { withWeights: true }),
          {
            weightType: "weightFMax",
            lowestWeight,
          },
        ),
      ).toBeCloseTo(expected);
    },
  );

  it("raises a percentage without an F-Max up to the target weight", () => {
    const options = { weightType: "weightFMax", targetWeight: 77.5 } as const;

    expect(
      stepWeight(
        70,
        "INCREASE",
        generateEquipmentExercise("KETTLEBELL", { withWeights: true }),
        options,
      ),
    ).toBeCloseTo(71.75);
    expect(
      stepWeight(
        70,
        "INCREASE",
        generateEquipmentExercise("KETTLEBELL", { withWeights: true }),
        {
          ...options,
          targetWeight: 71,
        },
      ),
    ).toBe(71);
  });

  it("lowers a percentage to the next real barbell load", () => {
    // 73.5 % of 100 kg rounds to 72.5 kg, 72.5 kg x 0.975 rounds to 70 kg.
    expect(
      stepWeight(
        73.5,
        "DECREASE",
        generateEquipmentExercise("BARBELL", { withWeights: true }),
        {
          weightType: "weightFMax",
          lowestWeight: 65,
          maxValue: 100,
        },
      ),
    ).toBeCloseTo(70);
  });

  it("raises a load by 2.5 percent to the rounded load", () => {
    expect(
      stepWeight(
        40,
        "INCREASE",
        generateEquipmentExercise("KETTLEBELL", { withWeights: true }),
        {
          weightType: "weightAbsolute",
        },
      ),
    ).toBe(41);
  });

  it("takes the next available load when rounding keeps the current one", () => {
    expect(
      stepWeight(
        8,
        "INCREASE",
        generateEquipmentExercise("DUMBBELL", { withWeights: true }),
        {
          weightType: "weightAbsolute",
        },
      ),
    ).toBe(9);
  });

  it("keeps the rounded load when the target weight forbids the next one", () => {
    expect(
      stepWeight(
        40,
        "INCREASE",
        generateEquipmentExercise("KETTLEBELL", { withWeights: true }),
        {
          weightType: "weightAbsolute",
          targetWeight: 40.5,
        },
      ),
    ).toBe(40);
  });

  it("stays at the empty bar", () => {
    expect(
      stepWeight(
        20,
        "DECREASE",
        generateEquipmentExercise("BARBELL", { withWeights: true }),
        {
          weightType: "weightAbsolute",
        },
      ),
    ).toBe(20);
  });
});

describe("weightStep: readLowestPermittedWeight", () => {
  const athlete = { gender: "m", level: "advanced" } as const;

  it.each([
    ["SWR2", 65],
    ["SK", 50],
  ])("reads the lowest weight of %s as %p percent", (name, expected) => {
    expect(
      readLowestPermittedWeight(
        loadIntensityConfig(name),
        "weightFMax",
        generateEquipmentExercise("BARBELL", { withWeights: true }),
        athlete,
      ),
    ).toBe(expected);
  });

  it("has no lowest weight for kilograms or an intensity without one", () => {
    expect(
      readLowestPermittedWeight(
        loadIntensityConfig("SWR2"),
        "weightAbsolute",
        generateEquipmentExercise("BARBELL", { withWeights: true }),
        athlete,
      ),
    ).toBeUndefined();
    expect(
      readLowestPermittedWeight(
        loadIntensityConfig("GKS"),
        "weightFMax",
        generateEquipmentExercise("BARBELL", { withWeights: true }),
        athlete,
      ),
    ).toBeUndefined();
  });

  it.each([
    ["weightFMax", 60],
    ["weightAbsolute", 65],
  ] as const)(
    "lowers the lowest weight to an authored start weight in %s only when it is a percentage",
    (type, expected) => {
      const exercise = generateValueExercise("repetition", {
        withWeights: true,
        values: {
          weight: {
            startValue: { default: { default: 60 }, type: { type } },
            targetValue: { default: { default: 80 } },
          },
        },
      });

      expect(
        readLowestPermittedWeight(
          loadIntensityConfig("SWR2"),
          "weightFMax",
          exercise,
          athlete,
        ),
      ).toBe(expected);
    },
  );

  it("reads the lowest weight of the intensity without a training level", () => {
    const exercise = generateValueExercise("repetition", {
      withWeights: true,
      values: {
        weight: {
          startValue: {
            default: { default: 60 },
            type: { type: "weightFMax" },
          },
          targetValue: { default: { default: 80 } },
        },
      },
    });

    expect(
      readLowestPermittedWeight(
        loadIntensityConfig("SWR2"),
        "weightFMax",
        exercise,
        { gender: "m" },
      ),
    ).toBe(65);
  });
});
