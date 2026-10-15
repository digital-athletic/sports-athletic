import * as v from "valibot";
import { loadStrengthTest } from "./loadStrengthTest";
import { StrengthTestSchema } from "@/schemas/generator.schema";

const loads = { beginner: 30, advanced: 45, professional: 60 };

const validStrengthTest = {
  lifts: {
    BEGINNER: { default: ["25", "50"] },
    ADVANCED: { default: ["25", "50"], m: ["50", "25"] },
    PROFESSIONAL: { default: ["25", "50"] },
  },
  testSetLoads: {
    "25": { w: loads, m: loads },
    "50": { w: loads, m: loads },
  },
  warmUpRegionQuotas: [
    { tags: ["LOWER_BODY"], count: 1 },
    { tags: [], count: 2 },
  ],
};

describe("loadStrengthTest", () => {
  it("parses the real file", () => {
    const strengthTest = loadStrengthTest();

    expect(Object.keys(strengthTest.lifts).sort()).toEqual([
      "ADVANCED",
      "BEGINNER",
      "PROFESSIONAL",
    ]);
    expect(strengthTest.lifts.BEGINNER.default).toEqual([
      "25",
      "50",
      "342",
      "297",
      "54",
    ]);
    expect(strengthTest.testSetLoads["342"].m).toEqual({
      beginner: 35,
      advanced: 50,
      professional: 60,
    });
    expect(strengthTest.warmUpRegionQuotas).toEqual([
      { tags: ["LOWER_BODY"], count: 1 },
      { tags: ["FULL_BODY"], count: 1 },
      { tags: ["UPPER_BODY"], count: 1 },
      { tags: [], count: 2 },
    ]);
  });

  it("has test set loads for every lift and gender", () => {
    const strengthTest = loadStrengthTest();
    const liftIds = Object.values(strengthTest.lifts).flatMap((level) => [
      ...level.default,
      ...(level.m ?? []),
      ...(level.w ?? []),
    ]);

    liftIds.forEach((id) => {
      expect(strengthTest.testSetLoads[id]?.m).toBeDefined();
      expect(strengthTest.testSetLoads[id]?.w).toBeDefined();
    });
  });
});

describe("StrengthTestSchema", () => {
  it("accepts a lift list with an optional gender override", () => {
    expect(v.safeParse(StrengthTestSchema, validStrengthTest).success).toBe(
      true,
    );
  });

  it("rejects a missing fitness level", () => {
    const invalid = {
      ...validStrengthTest,
      lifts: { BEGINNER: { default: ["25"] } },
    };

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a gender key other than m and w", () => {
    const invalid = {
      ...validStrengthTest,
      lifts: {
        ...validStrengthTest.lifts,
        BEGINNER: { default: ["25"], x: ["25"] },
      },
      testSetLoads: { "25": { x: loads } },
    };

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a missing fitness level in the test set loads", () => {
    const invalid = {
      ...validStrengthTest,
      testSetLoads: { "25": { w: { beginner: 30, advanced: 45 } } },
    };

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a non numeric load", () => {
    const invalid = {
      ...validStrengthTest,
      testSetLoads: { "25": { w: { ...loads, beginner: "30" } } },
    };

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a warm-up region quota without a count", () => {
    const invalid = {
      ...validStrengthTest,
      warmUpRegionQuotas: [{ tags: ["LOWER_BODY"] }],
    };

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });
});
