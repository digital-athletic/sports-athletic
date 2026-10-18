import * as v from "valibot";
import RegionsData from "../../assets/data/generator/regions.json";
import { loadExercises } from "./loadExercises";
import { loadRegionConfig, parseRegionConfig } from "./loadRegionConfig";
import PlanGenerator from "@/features/training/generators/PlanGenerator";
import { getBranchIdByNameAndSkill } from "@/features/training/utils/skillTreeUtils";
import { RegionConfigSchema } from "@/schemas/generator.schema";

const entry = { tags: ["REGION_UPPER_BODY"], count: 2 };

const configNames = Object.keys(RegionsData);

const allTags = (config: ReturnType<typeof loadRegionConfig>): string[] =>
  [config.default, config.child, config.professional].flatMap((variant) =>
    Object.values(variant ?? {}).flatMap((entries) =>
      entries.flatMap((item) => item.tags),
    ),
  );

describe("loadRegionConfig: real file", () => {
  it("returns a known entry", () => {
    const config = loadRegionConfig("WU");

    expect(config.default["5"]).toEqual([
      { tags: ["REGION_UPPER_BODY"], count: 1 },
      { tags: ["REGION_LOWER_BODY"], count: 3 },
    ]);
  });

  it("reads max strength with professional variant and support flags", () => {
    const config = loadRegionConfig("MAX");

    expect(config.default["20"][0]).toEqual({
      tags: ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
      count: 1,
      support: true,
    });
    expect(Object.keys(config.professional ?? {})).toEqual([
      "15",
      "30",
      "40",
      "55",
    ]);
    expect(config.professional?.["15"]).toHaveLength(1);
  });

  it("reads the child variant of a bodyweight strength config", () => {
    const config = loadRegionConfig("SWR1KG");

    expect(config.child?.["10"]).toEqual([
      { tags: ["REGION_UPPER_BODY"], count: 1 },
      { tags: ["REGION_LOWER_BODY"], count: 2 },
      { tags: ["REGION_CORE"], count: 1 },
    ]);
  });

  it("holds every strength section config in the real file", () => {
    expect(Object.keys(RegionsData)).toEqual(
      expect.arrayContaining([
        "MAX",
        "SA",
        "SAKG",
        "SK",
        "SKKG",
        "SWR1",
        "SWR1KG",
        "SWR2KG",
      ]),
    );
  });

  it.each([
    "CARDIO_1_SHORT",
    "CARDIO_1_LAKTAT",
    "CARDIO_2",
    "CARDIO_3",
    "CARDIO_4",
    "CARDIO_5",
    "MAX",
    "MAX_STRENGTH",
    "BAS",
    "BR",
    "CD",
    "GKS",
    "MOB",
    "PREVANKLE",
    "PREVKNEE",
    "PREVSHOULDER",
    "PREVSPINE",
    "PREVWRIST",
    "SA",
    "SAKG",
    "SK",
    "SKKG",
    "SWR1",
    "SWR1KG",
    "SWR2KG",
    "WU",
    "WUSKSA",
    "WUSPEZIAL",
  ])("resolves the config for skill %s", (skill) => {
    const tags = PlanGenerator.getTagsForSkill(skill);

    expect(Object.keys(tags).length).toBeGreaterThan(0);
  });

  it("parses the SWR2 config with named exercises", () => {
    const config = loadRegionConfig("SWR2");

    expect(Object.keys(config.default)).toEqual([
      "20",
      "25",
      "30",
      "35",
      "40",
      "45",
    ]);
    expect(config.default["20"][0]).toEqual({
      tags: ["EXERCISE_NAME_SQUAT"],
      count: 1,
    });
    expect(config.default["45"].at(-1)).toEqual({
      tags: ["REGION_CORE"],
      count: 4,
    });
  });

  it("falls back to the first hypertrophy config for an unmapped skill", () => {
    expect(PlanGenerator.getTagsForSkill("UNMAPPED_SKILL")).toEqual(
      PlanGenerator.getTagsForSkill("SWR1"),
    );
  });

  it("throws for an unknown name", () => {
    expect(() => loadRegionConfig("UNKNOWN")).toThrow(
      "Unknown region configuration: UNKNOWN",
    );
  });

  it("returns a fresh deep copy on every call", () => {
    const first = loadRegionConfig("BR");
    first.default["5"][0].tags.push("REGION_CORE");
    first.default["5"][0].count = 99;

    const second = loadRegionConfig("BR");
    expect(second.default["5"][0].tags).not.toContain("REGION_CORE");
    expect(second.default["5"][0].count).toBe(2);
  });

  it("returns a fresh deep copy of a strength config", () => {
    const first = loadRegionConfig("MAX");
    first.default["20"][0].tags.push("EXERCISE_NAME_ROWING");

    expect(loadRegionConfig("MAX").default["20"][0].tags).not.toContain(
      "EXERCISE_NAME_ROWING",
    );
  });

  it.each(configNames)("loads %s", (name) => {
    expect(Object.keys(loadRegionConfig(name).default).length).toBeGreaterThan(
      0,
    );
  });
});

describe("loadRegionConfig: tags against the exercise catalog", () => {
  const catalogTags = new Set(loadExercises().flatMap((item) => item.tags));
  const configTags = configNames.flatMap((name) =>
    allTags(loadRegionConfig(name)),
  );

  it("every REGION tag in the configurations exists on an exercise", () => {
    const missing = [
      ...new Set(configTags.filter((tag) => tag.startsWith("REGION_"))),
    ].filter((tag) => !catalogTags.has(tag));

    expect(missing).toEqual([]);
  });

  it("every EXERCISE_NAME tag resolves to a branch id", () => {
    const names = new Set(
      configTags
        .filter((tag) => tag.startsWith("EXERCISE_NAME_"))
        .map((tag) => tag.replace("EXERCISE_NAME_", "")),
    );

    names.forEach((name) => {
      const ids = ["SWR1", "MAX", "SK", "SA"].map((skill) =>
        getBranchIdByNameAndSkill(name, skill),
      );
      expect(ids.some((id) => id !== "-1")).toBe(true);
    });
  });
});

describe("parseRegionConfig: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseRegionConfig({}, "BAD")).toThrow(
      "Region configuration BAD",
    );
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("returns a clone of the source with the source key order", () => {
    const source = RegionsData.WU;
    const parsed = parseRegionConfig(source, "WU");

    expect(parsed).toEqual(source);
    expect(parsed).not.toBe(source);
    expect(Object.keys(parsed.default)).toEqual(Object.keys(source.default));
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

  it("rejects a tag outside the tag vocabulary", () => {
    const invalid = {
      default: { "10": [{ tags: ["UPPER_BODY"], count: 2 }] },
    };

    expect(v.safeParse(RegionConfigSchema, invalid).success).toBe(false);
  });

  it("rejects a misspelled region tag", () => {
    const invalid = {
      default: { "10": [{ tags: ["REGION_UPER_BODY"], count: 2 }] },
    };

    expect(v.safeParse(RegionConfigSchema, invalid).success).toBe(false);
  });

  it("rejects a config without the default variant", () => {
    const invalid = { child: { "10": [entry] } };

    expect(v.safeParse(RegionConfigSchema, invalid).success).toBe(false);
  });
});
