import { generateValueExercise } from "../../../../test/factories/valueExercise";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import {
  applyBlockValuesMode,
  readSkillCatalogEntry,
  readSkillIntensity,
} from "./skillIntensity";

const skillCatalog = loadSkillCatalog();
const weighted = generateValueExercise("repetition", { withWeights: true });
const bodyweight = generateValueExercise("repetition");

describe("skillIntensity: readSkillCatalogEntry", () => {
  it("reads an entry of the given catalog", () => {
    expect(readSkillCatalogEntry(skillCatalog, "GKS")?.intensity).toBe("GKS");
  });

  it.each(["UNKNOWN", "constructor", "toString"])(
    "reads no entry for %s",
    (skill) => {
      expect(readSkillCatalogEntry(skillCatalog, skill)).toBeUndefined();
    },
  );
});

describe("skillIntensity: readSkillIntensity", () => {
  it.each([
    ["PLYO_HIGH", undefined, "PLYO"],
    ["PLYO_MEDIUM", undefined, "PLYO"],
    ["SWR1", undefined, "SWR2"],
    ["SWR2KG", undefined, "SWR2KG"],
    ["SWR2KG", weighted, "SWR2"],
    ["SWR1", bodyweight, "SWR2KG"],
    ["GKS", undefined, "GKS"],
    ["GKS", weighted, "GKS"],
    ["GKS", bodyweight, "GKSKG"],
    ["PREVKNEE", bodyweight, "PREV"],
    ["SK", weighted, "SK"],
    ["MAX_STRENGTH", weighted, "DEFAULT"],
    ["WU", bodyweight, "DEFAULTKG"],
    ["constructor", undefined, "DEFAULTKG"],
  ] as const)(
    "reads skill %s with exercise %p from config %s",
    (skill, exercise, name) => {
      expect(readSkillIntensity(skillCatalog, skill, exercise)).toBe(
        loadIntensityConfig(name),
      );
    },
  );

  it("reads the intensity name from the given catalog", () => {
    const customCatalog: SkillCatalog = {
      ...skillCatalog,
      BAS: { ...skillCatalog.BAS, intensity: "SK" },
    };

    expect(readSkillIntensity(customCatalog, "BAS")).toBe(
      loadIntensityConfig("SK"),
    );
  });
});

describe("skillIntensity: applyBlockValuesMode", () => {
  const intensity = loadIntensityConfig("PREV");

  it("keeps the intensity without a values mode", () => {
    expect(applyBlockValuesMode(intensity, undefined)).toBe(intensity);
  });

  it.each([
    ["skill", true],
    ["exercise", false],
  ] as const)(
    "sets the skill range override for values %s to %p",
    (values, expected) => {
      const result = applyBlockValuesMode(intensity, values);

      expect(result.overridesExerciseRepsAndDuration).toBe(expected);
      expect(result.startValue).toBe(intensity.startValue);
      expect(intensity.overridesExerciseRepsAndDuration).toBe(false);
    },
  );
});
