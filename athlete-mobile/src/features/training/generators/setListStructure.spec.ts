import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import {
  transformSkillTree,
  type RawSkillTree,
} from "@/utils/skillTreeTransform";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import PREV from "../../../../assets/data/generator/skillTrees/PREV.json";
import PREVKG from "../../../../assets/data/generator/skillTrees/PREVKG.json";
import WUSPEZIAL from "../../../../assets/data/generator/skillTrees/WUSPEZIAL.json";
import TrainingGenerator from "./TrainingGenerator";

const PAUSE_ID = "999999";
const template = ExercisesData[0] as ExerciseType;

const user: UserType = {
  userId: "set-list-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["ADVANCED"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const ref = (id: string, tags: string[]): BranchExerciseReference => ({
  branchId: id,
  exerciseId: `e${id}`,
  branchTags: ["SIDE_BOTH", ...tags],
});

const BODYWEIGHT = "EQ_TYPE_KG";
const WEIGHTED = "EQ_TYPE_WEIGHTS";

const buildSetList = (
  skill: SkillCode,
  pairs: ExercisePair[],
  options: { isShortTraining?: boolean; isFocusWorkout?: boolean } = {},
) => {
  const generator = new TrainingGenerator();
  jest
    .spyOn(generator, "getExerciseStartValues")
    .mockImplementation((_skill, entry) => ({
      branchId: entry.branchId,
      exerciseId: entry.exerciseId,
      tags: entry.branchTags,
      repetition: 10,
      weight: entry.branchTags.includes(WEIGHTED) ? 40 : undefined,
      weightType: "weightAbsolute",
    }));
  const refs = pairs.flatMap((pair) =>
    pair.second ? [pair.first, pair.second] : [pair.first],
  );
  const exercises = refs.map((entry) => ({
    ...template,
    id: entry.exerciseId,
    tags: entry.branchTags,
  }));
  return generator.getSetListFromExercisePairs(
    pairs,
    { skill, length: 30 },
    {},
    user,
    "STUDIO",
    [],
    exercises,
    2,
    [],
    null,
    options.isShortTraining ?? false,
    options.isFocusWorkout ?? false,
  );
};

const pausesOf = (setList: ReturnType<typeof buildSetList>) =>
  setList
    .filter((entry) => entry.exerciseId === PAUSE_ID)
    .map((entry) => entry.duration);

const chest = ref("c", ["MUSCLE_CHEST", "REGION_UPPER_BODY", BODYWEIGHT]);
const chestAgain = ref("c2", ["MUSCLE_CHEST", "REGION_UPPER_BODY", BODYWEIGHT]);
const biceps = ref("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY", BODYWEIGHT]);
const quads = ref("q", ["MUSCLE_QUADRICEPS", "REGION_LOWER_BODY", BODYWEIGHT]);
const calf = ref("k", ["MUSCLE_CALF", "REGION_LOWER_BODY", BODYWEIGHT]);

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getSetListFromExercisePairs: solo exercise", () => {
  it("rests on the single exercise rest between sets and closes on the after set pause", () => {
    expect(
      pausesOf(buildSetList("SWR2", [{ first: chest }, { first: quads }])),
    ).toEqual([90, 60, 90, 60]);
  });

  it("closes on the single exercise rest when the next block trains the same region and primary muscle", () => {
    expect(
      pausesOf(buildSetList("SWR2", [{ first: chest }, { first: chestAgain }])),
    ).toEqual([90, 90, 90, 60]);
  });

  it("closes on the after set pause when the next block shares only the region", () => {
    expect(
      pausesOf(buildSetList("SWR2", [{ first: chest }, { first: biceps }])),
    ).toEqual([90, 60, 90, 60]);
  });

  it.each([
    ["SWR2", 90],
    ["PREVKNEE", 60],
    ["BAS", 60],
    ["GKS", 90],
    ["SKKG", 180],
    ["SA", 180],
  ] as [SkillCode, number][])(
    "uses the single exercise rest of %s between sets",
    (skill, rest) => {
      expect(pausesOf(buildSetList(skill, [{ first: chest }]))[0]).toBe(rest);
    },
  );
});

describe("getSetListFromExercisePairs: superset pair", () => {
  it("rests on the in set pause inside the pair and closes on the after set pause", () => {
    expect(
      pausesOf(
        buildSetList("SWR2", [
          { first: chest, second: quads },
          { first: biceps, second: calf },
        ]),
      ).slice(0, 4),
    ).toEqual([30, 30, 30, 60]);
  });

  it("closes on the single exercise rest when the next pair trains the same region and primary muscle", () => {
    expect(
      pausesOf(
        buildSetList("SWR2", [
          { first: chest, second: quads },
          { first: chestAgain, second: calf },
        ]),
      ).slice(0, 4),
    ).toEqual([30, 30, 30, 90]);
  });

  it.each([
    ["SWR2", 60],
    ["BAS", 60],
    ["GKS", 60],
    ["SKKG", 60],
    ["SK", 60],
    ["SA", 75],
  ] as [SkillCode, number][])(
    "closes a %s block on its after set pause",
    (skill, pause) => {
      const pauses = pausesOf(
        buildSetList(skill, [
          { first: chest, second: quads },
          { first: biceps, second: calf },
        ]),
      );
      expect(pauses[3]).toBe(pause);
    },
  );
});

describe("getSetListFromExercisePairs: focus workouts", () => {
  it.each([
    ["BAS", 30],
    ["GKS", 45],
    ["MOB", 10],
  ] as [SkillCode, number][])(
    "closes a %s focus block on its fixed rest",
    (skill, pause) => {
      const pauses = pausesOf(
        buildSetList(skill, [{ first: chest }, { first: quads }], {
          isShortTraining: skill === "MOB",
          isFocusWorkout: true,
        }),
      );
      expect(pauses[1]).toBe(pause);
    },
  );
});

describe("getSetListFromExercisePairs: warm-up sets", () => {
  const weightedChest = ref("w", [
    "MUSCLE_CHEST",
    "REGION_UPPER_BODY",
    WEIGHTED,
  ]);

  it("gives an explosive power warm-up set 8 repetitions", () => {
    const [warmUp] = buildSetList("SK", [{ first: weightedChest }]);
    expect(warmUp.repetition).toBe(8);
  });

  it("rests 180 s after a solo explosive power warm-up set", () => {
    expect(pausesOf(buildSetList("SK", [{ first: weightedChest }]))[0]).toBe(
      180,
    );
  });

  it("rests 60 s after a paired explosive power warm-up set", () => {
    const pauses = pausesOf(
      buildSetList("SK", [{ first: weightedChest, second: quads }]),
    );
    expect(pauses.slice(0, 2)).toEqual([60, 60]);
  });

  it("keeps the working repetitions in a hypertrophy warm-up set", () => {
    const [warmUp] = buildSetList("SWR2", [{ first: weightedChest }]);
    expect(warmUp.repetition).toBe(10);
  });

  it("rests 60 s after a solo hypertrophy warm-up set", () => {
    expect(pausesOf(buildSetList("SWR2", [{ first: weightedChest }]))[0]).toBe(
      60,
    );
  });

  it("puts no repetitions on a warm-up pause", () => {
    const pauses = buildSetList("SK", [{ first: weightedChest }]).filter(
      (entry) => entry.exerciseId === PAUSE_ID,
    );
    expect(pauses[0].repetition).toBeUndefined();
  });
});

describe("generateShortWorkout: special warm-up in prevention", () => {
  it("closes the special warm-up on its 10 s rest", () => {
    const generator = new TrainingGenerator();
    const skillTrees = {
      PREV: transformSkillTree(PREV as RawSkillTree),
      PREVKG: transformSkillTree(PREVKG as RawSkillTree),
      WUSPEZIAL: transformSkillTree(WUSPEZIAL as RawSkillTree),
    } as { [skillName: string]: SkillTreeType };
    const result = generator.generateShortWorkout(
      "PREVKNEE",
      user,
      "STUDIO",
      ExercisesData as ExerciseType[],
      skillTrees,
      [],
      { exerciseData: {}, branchData: {} },
    );
    const lastWarmUpIndex = result.findLastIndex(
      (entry) => entry.skill === "WUSPEZIAL",
    );
    expect(result[lastWarmUpIndex]).toMatchObject({
      exerciseId: PAUSE_ID,
      duration: 10,
    });
  });
});
