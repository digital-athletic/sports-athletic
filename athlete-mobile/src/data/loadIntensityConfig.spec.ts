import * as v from "valibot";
import {
  loadIntensityConfig,
  parseIntensityConfig,
} from "./loadIntensityConfig";
import IntensityData from "../../assets/data/generator/intensity.json";
import { IntensityConfigSchema } from "@/schemas/intensity.schema";

const validConfig = {
  adjustment: {
    repetition: {
      default: { default: { TOO_EASY: 1, SUCCEEDED: 1, TOO_HARD: -1 } },
    },
  },
  startValue: { repetition: { default: { default: 2, advanced: 3 } } },
  targetValue: { repetition: { default: { default: 4, advanced: 5 } } },
};

type ValueType = "duration" | "height" | "repetition" | "weight";

describe("loadIntensityConfig: real file", () => {
  it("returns a known entry from the real file", () => {
    const config = loadIntensityConfig("CARDIO_1_LAKTAT");

    expect(config.startValue.repetition?.default).toEqual({
      default: 2,
      advanced: 3,
      professional: 3,
    });
    expect(config.adjustment.repetition?.default?.default).toEqual({
      TOO_EASY: 1,
      SUCCEEDED: 1,
      TOO_HARD: -1,
    });
  });

  it("keeps the weight type of the weighted default config", () => {
    const config = loadIntensityConfig("DEFAULT");

    expect(config.startValue.weight?.type).toEqual({ type: "weightFMax" });
    expect(loadIntensityConfig("DEFAULTKG").startValue.weight?.type).toBe(
      undefined,
    );
  });

  it.each(Object.keys(IntensityData))(
    "serves %s with a default start, target and adjustment per value type",
    (name) => {
      const config = loadIntensityConfig(name);

      for (const valueType of Object.keys(config.startValue) as ValueType[]) {
        // The weight value type adjusts through weightFMax and weightAbsolute.
        const adjustmentKeys =
          valueType === "weight"
            ? (["weightFMax", "weightAbsolute"] as const)
            : ([valueType] as const);

        expect({
          name,
          valueType,
          start: typeof config.startValue[valueType]?.default?.default,
          target: typeof config.targetValue[valueType]?.default?.default,
          adjustments: adjustmentKeys.map(
            (key) => typeof config.adjustment[key]?.default?.default?.TOO_EASY,
          ),
        }).toEqual({
          name,
          valueType,
          start: "number",
          target: "number",
          adjustments: adjustmentKeys.map(() => "number"),
        });
      }
    },
  );

  // Every name getIntensityBySkill and getHypertrophyIntensity can produce.
  it.each([
    "CARDIO_3",
    "CARDIO_2",
    "CARDIO_1_LAKTAT",
    "CARDIO_1_SHORT",
    "BAS",
    "GKS",
    "GKSKG",
    "PREV",
    "SA",
    "SAKG",
    "SK",
    "SKKG",
    "DEFAULT",
    "DEFAULTKG",
    "SWR2",
    "SWR2KG",
  ])("serves %s from the real file", (name) => {
    const config = loadIntensityConfig(name);

    expect(Object.keys(IntensityData)).toContain(name);
    expect(Object.keys(config.startValue).length).toBeGreaterThan(0);
  });

  it("keeps the hypertrophy weight limit and weight types", () => {
    const weighted = loadIntensityConfig("SWR2");

    expect(weighted.lowestPermittedWeight).toBe(65);
    expect(weighted.startValue.weight?.type).toEqual({ type: "weightFMax" });
    expect(loadIntensityConfig("SWR2KG").startValue.weight?.type).toBe(
      undefined,
    );
  });

  it("differs between the full body stability configs only in the target duration", () => {
    const weighted = loadIntensityConfig("GKS");
    const bodyweight = loadIntensityConfig("GKSKG");

    expect(weighted.targetValue.duration?.default?.default).toBe(50);
    expect(bodyweight.targetValue.duration?.default?.default).toBe(60);
    expect({
      ...bodyweight,
      targetValue: { ...bodyweight.targetValue, duration: undefined },
    }).toEqual({
      ...weighted,
      targetValue: { ...weighted.targetValue, duration: undefined },
    });
  });

  it("returns the same frozen config on every call", () => {
    const config = loadIntensityConfig("DEFAULT");

    expect(loadIntensityConfig("DEFAULT")).toBe(config);
    expect(Object.isFrozen(config.startValue.repetition?.default)).toBe(true);
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.adjustment.repetition?.default)).toBe(true);
  });

  it("throws for an unknown config name", () => {
    expect(() => loadIntensityConfig("NOPE")).toThrow(
      "Unknown intensity configuration: NOPE",
    );
  });
});

describe("parseIntensityConfig: invalid data", () => {
  it("logs and throws for a config that breaks the schema", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      parseIntensityConfig("BROKEN", { ...validConfig, startValue: 1 }),
    ).toThrow("Invalid data structure for intensity configuration BROKEN");
    expect(errorSpy).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it("returns a copy that keeps the source key order", () => {
    const parsed = parseIntensityConfig("ORDER", validConfig);

    expect(parsed).not.toBe(validConfig);
    expect(Object.keys(parsed)).toEqual(Object.keys(validConfig));
  });
});

describe("IntensityConfigSchema: validation", () => {
  it("accepts a config with partial fitness levels", () => {
    expect(v.safeParse(IntensityConfigSchema, validConfig).success).toBe(true);
  });

  it("rejects an unknown fitness level", () => {
    const invalid = {
      ...validConfig,
      startValue: { repetition: { default: { expert: 3 } } },
    };

    expect(v.safeParse(IntensityConfigSchema, invalid).success).toBe(false);
  });

  it("rejects a feedback step that misses a feedback", () => {
    const invalid = {
      ...validConfig,
      adjustment: {
        repetition: { default: { default: { TOO_EASY: 1, TOO_HARD: -1 } } },
      },
    };

    expect(v.safeParse(IntensityConfigSchema, invalid).success).toBe(false);
  });

  it("rejects an unknown feedback key", () => {
    const invalid = {
      ...validConfig,
      adjustment: {
        repetition: {
          default: {
            default: { TOO_EASY: 1, SUCCEEDED: 1, TOO_HARD: -1, PERFECT: 0 },
          },
        },
      },
    };

    expect(v.safeParse(IntensityConfigSchema, invalid).success).toBe(false);
  });

  it("rejects a config without start values", () => {
    const invalid = {
      adjustment: validConfig.adjustment,
      targetValue: validConfig.targetValue,
    };

    expect(v.safeParse(IntensityConfigSchema, invalid).success).toBe(false);
  });
});
