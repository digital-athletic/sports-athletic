import type { SkillTypes } from "@/constants/workoutConstants";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { getResetRepetition } from "@/features/training/utils/weightAdjustmentUtils";
import { getExerciseTargetValue } from "@/features/training/utils/workoutUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserType } from "@/schemas/user.schema";
import { setUpAiwlGeneratorFlag } from "../../../../test/factories/aiwlGeneratorFlag";
import {
  buildPlanUser,
  generateKneePreventionBranches,
  generatePlanWorkoutForWeekday,
  importTree,
  importTrees,
  PAUSE_ID,
  realExercises,
} from "../../../../test/factories/planWorkout";
import TrainingGenerator, { getIntensityBySkill } from "./TrainingGenerator";

const LANDING_ID = "1107";
const LANDING_START_REPETITION = 4;
const LANDING_TARGET_REPETITION = 6;
const WUSPEZIAL_CLOSING_PAUSE = 30;

const landing = realExercises.find(
  (exercise) => exercise.id === LANDING_ID,
) as ExerciseType;

const user: UserType = {
  userId: "plan-prevention-timing-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"], PAIN: ["KNEE_LEFT"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const treeBranches = (tree: string, count: number): BranchExerciseReference[] =>
  Object.entries(importTree(tree))
    .flatMap(([branchId, branch]) =>
      Object.values(branch.levels)
        .slice(0, 1)
        .map(({ exerciseId }) => ({
          branchId,
          branchTags: branch.tags,
          exerciseId,
        })),
    )
    .slice(0, count);

const landingBranch: BranchExerciseReference = {
  branchId: "landing",
  exerciseId: LANDING_ID,
  branchTags: ["SIDE_BOTH"],
};

const setList = (skills: SkillTypes[]): GeneratedSetListEntry[] =>
  new TrainingGenerator().createSetList(
    skills.map((skill) => ({
      skill,
      length: 10,
      branches: skill === "PREVKNEE" ? [landingBranch] : treeBranches(skill, 2),
    })),
    realExercises,
    {},
    user,
    "HOME",
    [],
    null,
  );

const pausesOf = (entries: GeneratedSetListEntry[], skill: string) =>
  entries
    .filter((entry) => entry.skill === skill && entry.exerciseId === PAUSE_ID)
    .map((entry) => entry.duration);

beforeEach(() => {
  jest.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createSetList: plan prevention values", () => {
  it("starts a PREVKNEE exercise without history at its exercise start value", () => {
    const repetitions = setList(["PREVKNEE"])
      .filter((entry) => entry.exerciseId === LANDING_ID)
      .map((entry) => entry.repetition);

    expect(repetitions).toEqual([
      LANDING_START_REPETITION,
      LANDING_START_REPETITION,
    ]);
  });
});

describe("PREV intensity: exercise values", () => {
  const intensity = getIntensityBySkill("PREVKNEE", landing);

  it("resets to the exercise start value after a weight step", () => {
    expect(getResetRepetition(landing, intensity, "m", "beginner")).toBe(
      LANDING_START_REPETITION,
    );
  });

  it("progresses toward the exercise target", () => {
    expect(
      getExerciseTargetValue(intensity, landing, "repetition", "beginner", "m"),
    ).toBe(LANDING_TARGET_REPETITION);
  });
});

describe("createSetList: special warm up closing pause", () => {
  it.each<[SkillTypes[]]>([
    [["WUSPEZIAL", "WU", "SWR1", "PREVKNEE"]],
    [["WUSPEZIAL", "WU", "SWR1"]],
  ])("closes the special warm up with 30 seconds in %j", (skills) => {
    const pauses = pausesOf(setList(skills), "WUSPEZIAL");

    expect(pauses.length).toBeGreaterThan(1);
    expect(pauses[pauses.length - 1]).toBe(WUSPEZIAL_CLOSING_PAUSE);
    expect(pauses.slice(0, -1).every((pause) => pause === 10)).toBe(true);
  });
});

describe.each([false, true])("AIWL generator flag %s", (flagEnabled) => {
  setUpAiwlGeneratorFlag(flagEnabled);

  describe("generatePlanWorkout: special warm up before prevention", () => {
    it("closes the special warm up with 30 seconds before the prevention block", () => {
      const planUser = buildPlanUser({
        weekday: 1,
        skills: {
          PREVKNEE: generateKneePreventionBranches("PREV", 2),
          WUSPEZIAL: generateKneePreventionBranches("WUSPEZIAL", 3),
        },
        lengths: { PREVKNEE: 10, WUSPEZIAL: 5 },
      });
      const user: UserType = {
        ...planUser,
        workoutData: {
          tags: { LEVEL: ["ADVANCED"], PAIN: ["KNEE_LEFT"] },
        },
      };

      const result = generatePlanWorkoutForWeekday(user, {
        skillTrees: importTrees("WU", "WUSPEZIAL", "PREV", "PREVKG"),
      });
      const skills = result.map((entry) => entry.skill);
      const pauses = pausesOf(result, "WUSPEZIAL");

      expect(skills.lastIndexOf("WUSPEZIAL")).toBeLessThan(
        skills.indexOf("PREVKNEE"),
      );
      expect(pauses[pauses.length - 1]).toBe(WUSPEZIAL_CLOSING_PAUSE);
    });
  });
});
