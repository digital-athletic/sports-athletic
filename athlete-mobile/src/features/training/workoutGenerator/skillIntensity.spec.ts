import { generateLabelledExercise } from "@test/factories/valueExercise";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import { applyBlockValuesMode, readSkillIntensity } from "./skillIntensity";

describe("skillIntensity: readSkillIntensity", () => {
  it.each([
    ["PLYO_HIGH", "none", "PLYO"],
    ["PLYO_MEDIUM", "none", "PLYO"],
    ["SWR1", "none", "SWR2"],
    ["SWR2KG", "none", "SWR2KG"],
    ["SWR2KG", "weighted", "SWR2"],
    ["SWR1", "bodyweight", "SWR2KG"],
    ["GKS", "none", "GKS"],
    ["GKS", "weighted", "GKS"],
    ["GKS", "bodyweight", "GKSKG"],
    ["PREVKNEE", "bodyweight", "PREV"],
    ["SK", "weighted", "SK"],
    ["MAX_STRENGTH", "weighted", "DEFAULT"],
    ["WU", "bodyweight", "DEFAULTKG"],
    ["constructor", "none", "DEFAULTKG"],
  ] as const)(
    "reads skill %s with a %s exercise from config %s",
    (skill, label, name) => {
      expect(
        readSkillIntensity(
          loadSkillCatalog(),
          skill,
          generateLabelledExercise(label),
        ),
      ).toBe(loadIntensityConfig(name));
    },
  );

  it("reads the intensity name from the given catalog", () => {
    const skillCatalog = loadSkillCatalog();
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
  it("keeps the intensity without a values mode", () => {
    const intensity = loadIntensityConfig("PREV");

    expect(applyBlockValuesMode(intensity, undefined)).toBe(intensity);
  });

  it.each([
    ["skill", true],
    ["exercise", false],
  ] as const)(
    "sets the skill range override for values %s to %p",
    (values, expected) => {
      const intensity = loadIntensityConfig("PREV");
      const result = applyBlockValuesMode(intensity, values);

      expect(result.overridesExerciseRepsAndDuration).toBe(expected);
      expect(result.startValue).toBe(intensity.startValue);
      expect(intensity.overridesExerciseRepsAndDuration).toBe(false);
    },
  );
});
