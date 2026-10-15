import * as v from "valibot";
import SkillPrioritiesData from "../../assets/data/generator/skillPriorities.json";
import {
  loadSkillPriorities,
  parseSkillPriorities,
} from "./loadSkillPriorities";
import { SkillPrioritiesSchema } from "@/schemas/generator.schema";

const validPriorities = {
  CHILD: {
    pain: { phase: { "0": ["PHASE", "PREV1"] } },
    noPain: { phase: { "0": ["PHASE", "WU"] } },
  },
  ADULT: {
    pain: { combined: { "0": ["PHASE", "HBCARDIO"] } },
    noPain: { stability: { "0": ["GKS", "BAS", "MOB"] } },
  },
};

// Focus maps the plan generator reads per age group
const readFocuses = [
  ["CHILD", ["phase"]],
  ["ADULT", ["phase", "combined", "cardio", "stability"]],
] as const;

const realMaps = readFocuses.flatMap(([ageGroup, focuses]) =>
  (["pain", "noPain"] as const).flatMap((painStatus) =>
    focuses.map((focus) => ({ ageGroup, painStatus, focus })),
  ),
);

describe("loadSkillPriorities: real file", () => {
  it("returns a known list", () => {
    expect(loadSkillPriorities().CHILD.noPain.phase?.["20"]).toEqual(["BAS"]);
  });

  it("returns a fresh deep copy on every call", () => {
    const first = loadSkillPriorities();
    first.CHILD.noPain.phase?.["0"]?.push("WU");

    expect(loadSkillPriorities().CHILD.noPain.phase?.["0"]).toEqual([
      "PHASE",
      "WU",
    ]);
  });

  it.each(realMaps)(
    "$ageGroup $painStatus $focus: has a minute 0 list, no empty lists, no duplicates",
    ({ ageGroup, painStatus, focus }) => {
      const map = loadSkillPriorities()[ageGroup][painStatus][focus];

      expect(map).toBeDefined();
      expect(Object.keys(map ?? {})).toContain("0");
      for (const list of Object.values(map ?? {})) {
        expect(list.length).toBeGreaterThan(0);
        expect(new Set(list).size).toBe(list.length);
      }
    },
  );
});

describe("parseSkillPriorities: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseSkillPriorities({})).toThrow("SkillPriorities");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("returns a clone of the source with the source key order", () => {
    const parsed = parseSkillPriorities(SkillPrioritiesData);

    expect(parsed).toEqual(SkillPrioritiesData);
    expect(parsed).not.toBe(SkillPrioritiesData);
    expect(Object.keys(parsed.ADULT.pain)).toEqual(
      Object.keys(SkillPrioritiesData.ADULT.pain),
    );
  });
});

describe("SkillPrioritiesSchema", () => {
  it("accepts known skill codes and placeholders", () => {
    expect(v.safeParse(SkillPrioritiesSchema, validPriorities).success).toBe(
      true,
    );
  });

  it("rejects an unknown skill code", () => {
    const invalid = structuredClone(validPriorities);
    invalid.CHILD.noPain.phase["0"] = ["PHASE", "WUU"];

    expect(v.safeParse(SkillPrioritiesSchema, invalid).success).toBe(false);
  });

  it("rejects a non numeric minute key", () => {
    const invalid = structuredClone(validPriorities);
    Object.assign(invalid.CHILD.noPain.phase, { abc: ["WU"] });

    expect(v.safeParse(SkillPrioritiesSchema, invalid).success).toBe(false);
  });

  it("rejects an unknown focus key", () => {
    const invalid = structuredClone(validPriorities);
    Object.assign(invalid.CHILD.noPain, { phases: { "0": ["WU"] } });

    expect(v.safeParse(SkillPrioritiesSchema, invalid).success).toBe(false);
  });
});
