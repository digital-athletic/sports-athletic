import type { TrainingType } from "@/features/training/models/Training";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import * as exercisePairing from "@/features/training/workoutGenerator/setListBuilders/exercisePairing";
import { generateAthleteWithMaxValues } from "@test/factories/athlete";
import { spyOnDrawnBranches } from "@test/factories/drawnBranches";
import { nextWeek, today } from "@test/factories/planWorkout";
import { generateTreeBranch } from "@test/factories/skillTree";
import {
  generateEmptyAuthoredValues,
  generateEmptyValueExercise,
} from "@test/factories/valueExercise";
import TrainingGenerator from "./TrainingGenerator";

const beginner = generateAthleteWithMaxValues();

const selectedBranches = (
  type: TrainingType,
  skillTrees: { [skillName: string]: SkillTreeType },
  options: {
    user?: UserType;
    equipment?: string[];
    exercises?: ExerciseType[];
  } = {},
) => {
  const generator = new TrainingGenerator();
  const readDrawnBranches = spyOnDrawnBranches();
  generator.generateShortWorkout(
    type,
    options.user ?? beginner,
    "HOME",
    options.exercises ?? [],
    skillTrees,
    options.equipment ?? [],
    { exerciseData: {}, branchData: {} },
  );
  // a prevention training also draws a special warm up block
  return readDrawnBranches(type);
};

const slotCount = (branches: { branchTags: string[] }[]): number =>
  branches.reduce(
    (entries, { branchTags }) =>
      entries + (branchTags.includes("SIDE_ONE") ? 2 : 1),
    0,
  );

describe("generateShortWorkout: selection", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("never draws the same exercise twice", () => {
    const tags = ["SKILL_MOB", "REGION_CORE", "SIDE_BOTH"];
    const branches = selectedBranches("MOB", {
      MOB: {
        "500": generateTreeBranch(["501"], tags),
        "600": generateTreeBranch(["501"], tags),
      },
    });
    expect(branches.map((b) => b.exerciseId)).toEqual(["501"]);
  });

  it("fills at most 10 entries in a warm up when a one sided branch comes last", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const bothSided = ["SKILL_WU", "REGION_CORE", "SIDE_BOTH"];
    const tree: SkillTreeType = {};
    for (let id = 10; id < 19; id++) {
      tree[`${id}`] = generateTreeBranch([`${id}0`], bothSided);
    }
    tree["99"] = generateTreeBranch(
      ["990"],
      ["SKILL_WU", "REGION_CORE", "SIDE_ONE"],
    );

    const branches = selectedBranches("WU", { WU: tree });
    expect(slotCount(branches)).toBeLessThanOrEqual(10);
  });

  it("draws 4 exercises from any region for full body stability with weights", () => {
    const tree: SkillTreeType = {};
    for (let id = 10; id < 16; id++) {
      tree[`${id}`] = generateTreeBranch(
        [`${id}0`],
        ["SKILL_GKS", "REGION_UPPER_BODY", "SIDE_BOTH"],
      );
      tree[`${id + 10}`] = generateTreeBranch(
        [`${id + 10}0`],
        ["SKILL_GKS", "REGION_LOWER_BODY", "SIDE_BOTH"],
      );
    }

    const branches = selectedBranches(
      "GKS",
      { GKS: tree },
      { equipment: ["DUMBBELL"] },
    );
    expect(branches).toHaveLength(4);
  });

  it("ignores muscle soreness", () => {
    const sore: UserType = {
      ...beginner,
      temporalData: [
        { date: today, expiration: nextWeek, tag: "QUADRICEPS" },
        { date: today, expiration: nextWeek, tag: "CHEST" },
      ],
    };
    const branches = selectedBranches(
      "MOB",
      {
        MOB: {
          "500": generateTreeBranch(
            ["501"],
            ["SKILL_MOB", "REGION_LOWER_BODY", "SIDE_BOTH"],
          ),
        },
      },
      { user: sore },
    );
    expect(branches.map((b) => b.exerciseId)).toEqual(["501"]);
  });

  it("keeps a both sided prevention exercise without a partner instead of swapping it for a one sided one", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const prevention = ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"];
    const branches = selectedBranches(
      "PREVKNEE",
      {
        PREVKG: {
          "10": generateTreeBranch(
            ["11"],
            [...prevention, "REGION_LOWER_BODY", "SIDE_BOTH"],
          ),
          "20": generateTreeBranch(
            ["21"],
            [...prevention, "REGION_LOWER_BODY", "SIDE_ONE"],
          ),
        },
        WUSPEZIAL: {
          "90": generateTreeBranch(
            ["91"],
            ["SKILL_WARM_UP_SPECIAL", "PREVENTION_KNEE_HIP", "SIDE_BOTH"],
          ),
        },
      },
      {
        exercises: [
          generateEmptyValueExercise("11", ["SIDE_BOTH"]),
          generateEmptyValueExercise("21", ["SIDE_ONE"]),
        ],
      },
    );
    expect(branches.map((b) => b.branchId)).toContain("10");
  });
});

describe("generateShortWorkout: authored exercise values", () => {
  it.each(["WU", "MOB", "BR", "CD"] as const)(
    "trains each %s exercise for its authored duration",
    (type) => {
      const stretch: ExerciseType = {
        ...generateEmptyValueExercise("501", ["SIDE_BOTH"]),
        isAdvanceByDuration: true,
        values: {
          duration: {
            startValue: { default: { default: 45 } },
            targetValue: { default: { default: 45 } },
          },
          repetition: generateEmptyAuthoredValues(),
          height: generateEmptyAuthoredValues(),
          weight: generateEmptyAuthoredValues(),
        },
      };

      const setList = new TrainingGenerator().generateShortWorkout(
        type,
        beginner,
        "HOME",
        [stretch],
        {
          [type]: {
            "500": generateTreeBranch(["501"], ["REGION_CORE", "SIDE_BOTH"]),
          },
        },
        [],
        { exerciseData: {}, branchData: {} },
      );

      const exerciseSets = setList.filter(
        (entry) => entry.exerciseId === "501",
      );
      expect(exerciseSets.map((entry) => entry.duration)).toEqual([45]);
    },
  );
});

const mainPairs = (
  type: TrainingType,
  skillTrees: { [skillName: string]: SkillTreeType },
  exercises: ExerciseType[],
  equipment: string[] = [],
): string[][] => {
  const pairBranches = jest.spyOn(exercisePairing, "pairBranchExercises");
  new TrainingGenerator().generateShortWorkout(
    type,
    beginner,
    "HOME",
    exercises,
    skillTrees,
    equipment,
    { exerciseData: {}, branchData: {} },
  );
  // a prevention training also pairs its special warm up block; skip it
  const warmUpBranchIds = Object.keys(skillTrees.WUSPEZIAL ?? {});
  const mainResult = pairBranches.mock.results.find(
    (result) =>
      result.type === "return" &&
      result.value.length > 0 &&
      !warmUpBranchIds.includes(result.value[0].first.branchId),
  );
  const pairs: ExercisePair[] = mainResult?.value ?? [];
  return pairs.map(({ first, second }) =>
    second ? [first.branchId, second.branchId] : [first.branchId],
  );
};

describe("generateShortWorkout: authored supersets", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("pairs a leg axis stability training in draw order instead of by superset rank", () => {
    const bas = (muscle: string) => [
      "SKILL_BAS",
      "REGION_LOWER_BODY",
      "SIDE_BOTH",
      muscle,
    ];
    const pairs = mainPairs(
      "BAS",
      {
        BAS: {
          "10": generateTreeBranch(["11"], bas("MUSCLE_QUADRICEPS")),
          "20": generateTreeBranch(["21"], bas("MUSCLE_CALF")),
          "30": generateTreeBranch(["31"], bas("MUSCLE_HAMSTRINGS")),
          "40": generateTreeBranch(["41"], bas("MUSCLE_GLUTES")),
        },
      },
      ["11", "21", "31", "41"].map((id) =>
        generateEmptyValueExercise(id, ["SIDE_BOTH"]),
      ),
    );
    expect(pairs).toEqual([
      ["10", "20"],
      ["30", "40"],
    ]);
  });

  it("orders the weighted pairs of a prevention training last", () => {
    const prevention = [
      "SKILL_PREVENTION",
      "PREVENTION_KNEE_HIP",
      "REGION_LOWER_BODY",
      "SIDE_BOTH",
    ];
    const weighted = [...prevention, "EQ_DUMBBELL", "EQ_TYPE_WEIGHTS"];
    const pairs = mainPairs(
      "PREVKNEE",
      {
        PREV: {
          "10": generateTreeBranch(["11"], [...weighted, "MUSCLE_GLUTES"]),
          "40": generateTreeBranch(["41"], [...weighted, "MUSCLE_CALF"]),
        },
        PREVKG: {
          "20": generateTreeBranch(["21"], [...prevention, "MUSCLE_CALF"]),
          "30": generateTreeBranch(
            ["31"],
            [...prevention, "MUSCLE_INNER_THIGH"],
          ),
        },
        WUSPEZIAL: {
          "90": generateTreeBranch(
            ["91"],
            ["SKILL_WARM_UP_SPECIAL", "PREVENTION_KNEE_HIP", "SIDE_BOTH"],
          ),
        },
      },
      ["11", "21", "31", "41", "91"].map((id) =>
        generateEmptyValueExercise(id, ["SIDE_BOTH"]),
      ),
      ["DUMBBELL"],
    );
    expect(pairs).toEqual([
      ["20", "30"],
      ["10", "40"],
    ]);
  });
});
