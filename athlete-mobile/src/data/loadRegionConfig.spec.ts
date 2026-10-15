import * as v from "valibot";
import { loadRegionConfig } from "./loadRegionConfig";
import { RegionConfigSchema } from "@/schemas/generator.schema";

const entry = { tags: ["REGION_UPPER_BODY"], count: 2 };

describe("loadRegionConfig", () => {
  it("returns a known entry from the real file", () => {
    const config = loadRegionConfig("WU");

    expect(config.default["5"]).toEqual([
      { tags: ["REGION_UPPER_BODY"], count: 1 },
      { tags: ["REGION_LOWER_BODY"], count: 3 },
    ]);
  });

  it("serves a config that is still defined in code", () => {
    const config = loadRegionConfig("MAX");

    expect(config.default["20"][0]).toEqual({
      tags: ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
      count: 1,
      support: true,
    });
    expect(config.professional?.["15"]).toHaveLength(1);
  });

  it("returns a fresh copy on every call", () => {
    const first = loadRegionConfig("BR");
    first.default["5"][0].count = 99;

    expect(loadRegionConfig("BR").default["5"][0].count).toBe(2);
  });
});

describe("RegionConfigSchema", () => {
  it("accepts default, child and professional variants with the support flag", () => {
    const valid = {
      default: { "10": [entry] },
      child: { "5": [{ ...entry, support: true }] },
      professional: { "15": [entry] },
    };

    expect(v.safeParse(RegionConfigSchema, valid).success).toBe(true);
  });

  it("rejects a non digit minute key", () => {
    const invalid = { default: { ten: [entry] } };

    expect(v.safeParse(RegionConfigSchema, invalid).success).toBe(false);
  });

  it("rejects an entry without tags", () => {
    const invalid = { default: { "10": [{ count: 2 }] } };

    expect(v.safeParse(RegionConfigSchema, invalid).success).toBe(false);
  });

  it("rejects a config without the default variant", () => {
    const invalid = { child: { "10": [entry] } };

    expect(v.safeParse(RegionConfigSchema, invalid).success).toBe(false);
  });
});
