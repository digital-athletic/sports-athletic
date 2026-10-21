import * as v from "valibot";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import {
  isFeedbackEligibleSkill,
  shouldProcessExerciseValues,
} from "@/features/training/utils/exerciseDataUtils";
import { getRegionsForPreventionSkills } from "@/features/training/utils/preventionUtils";
import {
  isPreventionTraining,
  mapSkillCodeToFocusArea,
} from "@/features/training/utils/skillTreeUtils";
import type { Template } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { UserExerciseDataSchema } from "@/schemas/sync.schema";
import type { UserType } from "@/schemas/user.schema";
import TrainingGenerator, { getIntensityBySkill } from "./TrainingGenerator";

// A template the app code has never seen, as a backend sync could deliver it.
jest.mock("@/data/loadTemplates", () => {
  const actual = jest.requireActual<typeof import("@/data/loadTemplates")>(
    "@/data/loadTemplates",
  );
  const extra: Record<string, Template> = {
    PREVHIP: {
      aiwl: 1,
      id: "PREVHIP",
      name: { en: "Hip prevention", de: "Hüftprävention" },
      blocks: [
        {
          kind: "picks",
          skill: "PREVHIP",
          picks: [
            { tags: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"], count: 1 },
          ],
          countBy: "pairs",
          fallbackToWholeTree: false,
          sets: 1,
          rest: { withinSuperset: 30, betweenSets: 60, afterExercise: 60 },
          superset: "drawOrderWithLeftovers",
        },
      ],
    },
    STRETCH: {
      aiwl: 1,
      id: "STRETCH",
      name: { en: "Stretching", de: "Dehnen" },
      blocks: [
        {
          kind: "picks",
          skill: "STRETCH",
          picks: [{ tags: [], count: 4 }],
          countBy: "entries",
          fallbackToWholeTree: false,
          sets: 1,
          setDuration: 60,
          rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
          superset: "none",
        },
      ],
    },
  };
  return {
    ...actual,
    loadTemplates: () => ({ ...actual.loadTemplates(), ...extra }),
    loadTemplate: (id: string) =>
      Object.hasOwn(extra, id) ? extra[id] : actual.loadTemplate(id),
  };
});

// The skill catalog carries the per training facts of the new templates.
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

const user: UserType = {
  userId: "new-focus-training-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const emptyValue = {
  startValue: { default: {}, m: {}, w: {}, k: {} },
  targetValue: { default: {}, m: {}, w: {}, k: {} },
};

const exercise = (id: string): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name: `Exercise ${id}`,
  displayName: `Exercise ${id}`,
  description: "",
  picture: "",
  video: "",
  tags: ["SIDE_BOTH"],
  values: {
    duration: emptyValue,
    repetition: emptyValue,
    height: emptyValue,
    weight: emptyValue,
  },
  isAdvanceByReps: false,
  isAdvanceByDuration: false,
  isJump: false,
});

const hipBranch = (exerciseId: string): SkillTreeType[string] => ({
  tags: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP", "SIDE_BOTH"],
  levels: { 1: { exerciseId } },
});

describe("new short workout: template without code changes", () => {
  it("generates a workout from the merged skill trees", () => {
    const skillTrees = {
      PREV: { hip: hipBranch("101") },
      PREVKG: { hipKg: hipBranch("102") },
    };

    const entries = new TrainingGenerator().generateTraining(
      "PREVHIP",
      user,
      "HOME",
      [exercise("101"), exercise("102")],
      skillTrees,
      1,
      [],
      undefined,
      0,
      { exerciseData: {}, branchData: {} },
    );
    const trained = entries.filter((entry) => entry.branchId !== "-1");

    expect(trained.map((entry) => entry.exerciseId).sort()).toEqual([
      "101",
      "102",
    ]);
    trained.forEach((entry) => expect(entry.skill).toBe("PREVHIP"));
    entries.forEach((entry) =>
      expect(v.safeParse(UserExerciseDataSchema, entry).success).toBe(true),
    );
  });

  it("reads the focus area from the skill catalog", () => {
    expect(mapSkillCodeToFocusArea("PREVHIP")).toBe("MOBILITY");
    expect(mapSkillCodeToFocusArea("STRETCH")).toBe("WARMUP");
  });

  it("reads the intensity from the skill catalog", () => {
    expect(getIntensityBySkill("PREVHIP")).toBe(loadIntensityConfig("BAS"));
    expect(getIntensityBySkill("STRETCH")).toBe(loadIntensityConfig("GKS"));
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
