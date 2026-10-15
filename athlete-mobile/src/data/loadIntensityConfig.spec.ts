import * as v from "valibot";
import { loadIntensityConfig } from "./loadIntensityConfig";
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

describe("loadIntensityConfig", () => {
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

  it("validates every entry of the real file", () => {
    for (const [name, data] of Object.entries(IntensityData)) {
      expect({
        name,
        success: v.safeParse(IntensityConfigSchema, data).success,
      }).toEqual({
        name,
        success: true,
      });
    }
  });

  it.each([
    "BAS",
    "GKS",
    "GKSKG",
    "PREV",
    "SA",
    "SAKG",
    "SK",
    "SKKG",
    "SWR2",
    "SWR2KG",
  ])("serves the code config %s", (name) => {
    const config = loadIntensityConfig(name);

    expect(Object.keys(config.startValue).length).toBeGreaterThan(0);
  });

  it("keeps the full body stability weight free spread", () => {
    const weighted = loadIntensityConfig("GKS");
    const bodyweight = loadIntensityConfig("GKSKG");

    expect(weighted.targetValue.duration?.default?.default).toBe(50);
    expect(bodyweight.targetValue.duration?.default?.default).toBe(60);
    expect(bodyweight.startValue).toEqual(weighted.startValue);
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

describe("IntensityConfigSchema", () => {
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
