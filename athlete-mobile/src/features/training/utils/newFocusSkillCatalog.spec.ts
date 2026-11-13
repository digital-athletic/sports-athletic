import {
  isFeedbackEligibleSkill,
  shouldProcessExerciseValues,
} from "@/features/training/utils/exerciseDataUtils";
import { getRegionsForPreventionSkills } from "@/features/training/utils/preventionUtils";
import {
  isPreventionTraining,
  mapSkillCodeToFocusArea,
} from "@/features/training/utils/skillTreeUtils";

// The skill catalog carries the per training facts of skills the app code has
// never seen, as a backend sync could deliver them.
jest.mock("../../../../assets/data/generator/skills.json", () => {
  const bundled = jest.requireActual(
    "../../../../assets/data/generator/skills.json",
  );
  return {
    ...bundled,
    PREVHIP: {
      skillTree: {
        withWeights: ["PREV", "PREVKG"],
        withoutWeights: ["PREV", "PREVKG"],
      },
      intensity: "BAS",
      focusArea: "MOBILITY",
      progression: false,
      painRegions: ["KNEE"],
    },
    STRETCH: {
      skillTree: { withWeights: ["MOB"], withoutWeights: ["MOB"] },
      intensity: "GKS",
      focusArea: "WARMUP",
      progression: true,
    },
  };
});

describe("newFocusSkillCatalog: skills without code changes", () => {
  it("reads the focus area from the skill catalog", () => {
    expect(mapSkillCodeToFocusArea("PREVHIP")).toBe("MOBILITY");
    expect(mapSkillCodeToFocusArea("STRETCH")).toBe("WARMUP");
  });

  it("reads the pain regions from the skill catalog", () => {
    expect(getRegionsForPreventionSkills(["PREVHIP"])).toEqual(["KNEE"]);
  });

  it("reads the prevention check from the skill catalog focus area", () => {
    expect(isPreventionTraining("PREVHIP")).toBe(false);
  });

  it("reads the progression flag from the skill catalog", () => {
    expect(shouldProcessExerciseValues("PREVHIP", "PREVHIP")).toBe(false);
    expect(shouldProcessExerciseValues("STRETCH", "STRETCH")).toBe(true);
  });

  it("asks no feedback for a skill without progression", () => {
    expect(
      isFeedbackEligibleSkill({ id: "training-1", type: "PREVHIP" }, "PREVHIP"),
    ).toBe(false);
  });

  it("asks feedback for a skill with progression", () => {
    expect(
      isFeedbackEligibleSkill({ id: "training-2", type: "STRETCH" }, "STRETCH"),
    ).toBe(true);
  });
});
