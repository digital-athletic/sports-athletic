import * as v from "valibot";
import StrengthTestData from "../../assets/data/generator/strengthTest.json";
import { getExerciseById } from "./exerciseRegistry";
import { loadStrengthTest, parseStrengthTest } from "./loadStrengthTest";
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

const realLiftIds = () =>
  Object.values(loadStrengthTest().lifts).flatMap((level) => [
    ...level.default,
    ...(level.m ?? []),
    ...(level.w ?? []),
  ]);

const realLoads = Object.entries(StrengthTestData.testSetLoads).flatMap(
  ([id, byGender]) =>
    Object.entries(byGender).map(([gender, byLevel]) => ({
      id,
      gender,
      byLevel,
    })),
);

describe("loadStrengthTest: real file", () => {
  it("returns a known value", () => {
    expect(loadStrengthTest().testSetLoads["342"].m).toEqual({
      beginner: 35,
      advanced: 50,
      professional: 60,
    });
  });

  it("returns a fresh deep copy on every call", () => {
    const first = loadStrengthTest();
    first.lifts.BEGINNER.default.push("999");

    expect(loadStrengthTest().lifts.BEGINNER.default).not.toContain("999");
  });

  it("has test set loads for every lift and gender", () => {
    const strengthTest = loadStrengthTest();

    realLiftIds().forEach((id) => {
      expect(strengthTest.testSetLoads[id]?.m).toBeDefined();
      expect(strengthTest.testSetLoads[id]?.w).toBeDefined();
    });
  });

  it("uses lift ids that exist in the exercise catalog", () => {
    realLiftIds().forEach((id) => {
      expect(getExerciseById(id)).toBeDefined();
    });
  });

  it.each(realLoads)(
    "test set load $id $gender: non negative and rising with the fitness level",
    ({ byLevel }) => {
      expect(byLevel.beginner).toBeGreaterThanOrEqual(0);
      expect(byLevel.beginner).toBeLessThanOrEqual(byLevel.advanced);
      expect(byLevel.advanced).toBeLessThanOrEqual(byLevel.professional);
    },
  );
});

describe("parseStrengthTest: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseStrengthTest({})).toThrow("StrengthTest");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("returns a clone of the source with the source key order", () => {
    const parsed = parseStrengthTest(StrengthTestData);

    expect(parsed).toEqual(StrengthTestData);
    expect(parsed).not.toBe(StrengthTestData);
    expect(Object.keys(parsed.testSetLoads)).toEqual(
      Object.keys(StrengthTestData.testSetLoads),
    );
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

  it("rejects a gender key other than m and w in a lift list", () => {
    const invalid = {
      ...validStrengthTest,
      lifts: {
        ...validStrengthTest.lifts,
        BEGINNER: { default: ["25"], x: ["25"] },
      },
    };

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a gender key other than m and w in the test set loads", () => {
    const invalid = structuredClone(validStrengthTest);
    Object.assign(invalid.testSetLoads, {
      "25": { w: loads, m: loads, x: loads },
    });

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a lift without test set loads", () => {
    const invalid = structuredClone(validStrengthTest);
    invalid.lifts.BEGINNER.default.push("77");

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a lift missing the load of one gender", () => {
    const invalid = structuredClone(validStrengthTest);
    Object.assign(invalid.testSetLoads, { "50": { w: loads } });

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a missing fitness level in the test set loads", () => {
    const invalid = structuredClone(validStrengthTest);
    Object.assign(invalid.testSetLoads, {
      "25": { w: { beginner: 30, advanced: 45 }, m: loads },
    });

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a non numeric load", () => {
    const invalid = structuredClone(validStrengthTest);
    Object.assign(invalid.testSetLoads, {
      "25": { w: { ...loads, beginner: "30" }, m: loads },
    });

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });

  it("rejects a warm up region quota without a count", () => {
    const invalid = {
      ...validStrengthTest,
      warmUpRegionQuotas: [{ tags: ["LOWER_BODY"] }],
    };

    expect(v.safeParse(StrengthTestSchema, invalid).success).toBe(false);
  });
});
