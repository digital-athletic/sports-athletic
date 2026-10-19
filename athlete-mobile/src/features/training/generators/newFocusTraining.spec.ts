import * as v from "valibot";
import { loadFocusTrainingTitle } from "@/data/loadFocusTrainings";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { shouldProcessExerciseValues } from "@/features/training/utils/exerciseDataUtils";
import { getRegionsForPreventionSkills } from "@/features/training/utils/preventionUtils";
import {
  isPreventionTraining,
  mapSkillCodeToFocusArea,
} from "@/features/training/utils/skillTreeUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { UserExerciseDataSchema } from "@/schemas/sync.schema";
import type { UserType } from "@/schemas/user.schema";
import TrainingGenerator, { getIntensityBySkill } from "./TrainingGenerator";

// A template the app code has never seen, as a backend sync could deliver it.
jest.mock("../../../../assets/data/generator/focusTrainings.json", () => {
  const bundled = jest.requireActual(
    "../../../../assets/data/generator/focusTrainings.json",
  );
  return {
    ...bundled,
    PREVHIP: {
      title: { en: "Hip prevention", de: "Hüftprävention" },
      focusArea: "PREVENTION",
      intensity: "PREV",
      progression: true,
      regions: ["HIP"],
      skillTrees: ["PREV", "PREVKG"],
      tags: ["PREVENTION_KNEE_HIP"],
      blocks: [
        {
          draw: "pairs",
          picks: [
            { tags: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"], count: 1 },
          ],
          fallback: false,
          sets: 1,
          pause: { superset: 30, sets: 60, exercise: 60 },
          superset: "drawOrderAll",
        },
      ],
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

describe("new focus training: template without code changes", () => {
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

  it("reads the per training facts from the template", () => {
    expect(mapSkillCodeToFocusArea("PREVHIP")).toBe("PREVENTION");
    expect(getIntensityBySkill("PREVHIP")).toBe(loadIntensityConfig("PREV"));
    expect(getRegionsForPreventionSkills(["PREVHIP"])).toEqual(["HIP"]);
    expect(isPreventionTraining("PREVHIP")).toBe(true);
    expect(shouldProcessExerciseValues("PREVHIP", "PREVHIP")).toBe(true);
    expect(loadFocusTrainingTitle("PREVHIP", "de")).toBe("Hüftprävention");
  });
});
