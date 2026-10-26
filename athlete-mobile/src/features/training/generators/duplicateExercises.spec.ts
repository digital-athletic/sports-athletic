import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserType } from "@/schemas/user.schema";
import {
  buildPlanUser,
  importTree,
  importTrees,
  noExerciseData,
  PAUSE_ID,
  realExercises,
} from "../../../../test/factories/planWorkout";
import PlanGenerator from "./PlanGenerator";
import TrainingGenerator from "./TrainingGenerator";

const planBranch = (skillTree: string, branchId: string) => {
  const branch = importTree(skillTree)[branchId];
  return {
    branchId,
    tags: branch.tags,
    exercises: Object.fromEntries(
      Object.entries(branch.levels).map(([level, data]) => [
        level,
        { exerciseId: data.exerciseId },
      ]),
    ),
  };
};

const generate = (
  user: UserType,
  trees: string[],
  place = "HALL",
  equipment: string[] = [],
) =>
  new TrainingGenerator().generatePlanWorkout(
    "PLAN",
    user,
    place,
    realExercises,
    importTrees("WU", "CARDIO_4", "CARDIO_5", ...trees),
    1,
    equipment,
    undefined,
    0,
    noExerciseData,
  );

const exerciseBranchPairs = (entries: GeneratedSetListEntry[], skill: string) =>
  entries
    .filter((entry) => entry.skill === skill && entry.exerciseId !== PAUSE_ID)
    .map((entry) => [entry.exerciseId, entry.branchId]);

beforeEach(() => {
  jest.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("generatePlanWorkout: kept branches with the same exercise", () => {
  it("replaces the second branch of SWR1KG 79 and 80, which both hold exercise 269", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        SWR1KG: [planBranch("SWR1KG", "79"), planBranch("SWR1KG", "80")],
      },
      lengths: { SWR1KG: 10 },
    });
    const pairs = exerciseBranchPairs(
      generate(user, ["SWR1KG"], "HALL", ["CHAIR"]),
      "SWR1KG",
    );
    const branchesPerExercise = new Map<string, Set<string>>();
    for (const [exerciseId, branchId] of pairs) {
      branchesPerExercise.set(
        exerciseId,
        (branchesPerExercise.get(exerciseId) ?? new Set()).add(branchId),
      );
    }
    expect(branchesPerExercise.size).toBeGreaterThan(1);
    expect(
      [...branchesPerExercise.values()].every(
        (branches) => branches.size === 1,
      ),
    ).toBe(true);
  });

  it("drops the duplicate slot when the skill tree offers no other exercise", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        SWR1KG: [planBranch("SWR1KG", "79"), planBranch("SWR1KG", "80")],
      },
      lengths: { SWR1KG: 10 },
    });
    const only = {
      "79": importTree("SWR1KG")["79"],
      "80": importTree("SWR1KG")["80"],
    };
    const result = new TrainingGenerator().generatePlanWorkout(
      "PLAN",
      user,
      "HALL",
      realExercises,
      { ...importTrees("WU", "CARDIO_4", "CARDIO_5"), SWR1KG: only },
      1,
      ["CHAIR"],
      undefined,
      0,
      noExerciseData,
    );
    const branchIds = new Set(
      exerciseBranchPairs(result, "SWR1KG").map(([, branchId]) => branchId),
    );
    expect(branchIds.size).toBe(1);
  });
});

describe("generatePlanWorkout: prevention with a duplicate slot", () => {
  it("drops only the duplicate slot and keeps the skill", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        PREVSPINE: [planBranch("PREVKG", "103"), planBranch("PREVKG", "634")],
      },
      lengths: { PREVSPINE: 10 },
    });
    user.workoutData!.tags = { ...user.workoutData!.tags, PAIN: ["SPINE"] };
    const tree = importTree("PREVKG");
    const result = new TrainingGenerator().generatePlanWorkout(
      "PLAN",
      user,
      "HALL",
      realExercises,
      {
        ...importTrees("WU", "CARDIO_4", "CARDIO_5"),
        PREV: {},
        PREVKG: { "103": tree["103"], "634": tree["634"] },
      },
      1,
      [],
      undefined,
      0,
      noExerciseData,
    );
    const branchIds = new Set(
      exerciseBranchPairs(result, "PREVSPINE").map(([, branchId]) => branchId),
    );
    expect([...branchIds]).toEqual(["103"]);
  });
});

describe("getBranchesForWorkout: branches with the same exercise", () => {
  it("skips GKSKG branches 939 to 942, which all hold exercise 357", () => {
    const tree = importTree("GKSKG");
    const branches = PlanGenerator.getBranchesForWorkout(
      "GKSKG",
      { tags: [], count: 4 },
      {},
      {},
      {},
      {},
      [],
      [],
      buildPlanUser({ weekday: 1, skills: {}, lengths: {} }),
      "HOME",
      realExercises,
      {
        GKSKG: {
          "939": tree["939"],
          "940": tree["940"],
          "941": tree["941"],
          "942": tree["942"],
        },
      },
      [],
      {},
      [],
    );
    expect(branches).toHaveLength(1);
  });
});

describe("getExercisePairs: prevention branches of one exercise", () => {
  const reference = (branchId: string): BranchExerciseReference => ({
    branchId,
    branchTags: importTree("PREVKG")[branchId].tags,
    exerciseId: "170",
  });

  it("does not pair PREVKG branches 103 and 634 with each other", () => {
    const pairs = new TrainingGenerator().getExercisePairs(
      "PREVSPINE",
      [reference("103"), reference("634")],
      realExercises,
    );
    expect(pairs.map((pair) => pair.second)).toEqual([undefined, undefined]);
  });
});

describe("createSetList: skill transition", () => {
  const user: UserType = {
    userId: "transition-user",
    personalData: { gender: "MALE", birthday: "1990-01-01" },
    workoutData: {
      tags: { LEVEL: ["ADVANCED"] },
      maxValues: DEFAULT_MAX_VALUES,
    },
    temporalData: [],
  };
  const ref = (
    branchId: string,
    exerciseId: string,
    region: string,
  ): BranchExerciseReference => ({
    branchId,
    exerciseId,
    branchTags: ["SIDE_BOTH", `REGION_${region}`, "MUSCLE_CHEST"],
  });

  const unitsOfSecondSkill = (
    second: BranchExerciseReference[],
  ): ExercisePair[] => {
    const generator = new TrainingGenerator();
    const spy = jest
      .spyOn(generator, "getSetListFromExercisePairs")
      .mockReturnValue([]);
    generator.createSetList(
      [
        {
          skill: "MAX_STRENGTH",
          length: 10,
          branches: [ref("a", "shared", "UPPER_BODY")],
        },
        { skill: "GKS", length: 10, branches: second },
      ],
      ["shared", "other"].map((id) => ({
        ...realExercises[0],
        id,
        otherSideExerciseId: undefined,
      })),
      {},
      user,
      "HOME",
      [],
      null,
    );
    return spy.mock.calls[1][0];
  };

  it("starts the next skill with another exercise than the one that ended the previous skill", () => {
    const units = unitsOfSecondSkill([
      ref("b", "shared", "LOWER_BODY"),
      ref("c", "other", "UPPER_BODY"),
    ]);
    expect(units[0].first.exerciseId).toBe("other");
  });

  it("keeps the repeat when no other order exists", () => {
    const units = unitsOfSecondSkill([ref("b", "shared", "LOWER_BODY")]);
    expect(units.map((unit) => unit.first.exerciseId)).toEqual(["shared"]);
  });
});

describe("generatePlanWorkout: home place with foam roller and chair", () => {
  it("never repeats an exercise right after itself", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        SWR1KG: [planBranch("SWR1KG", "79"), planBranch("SWR1KG", "80")],
        GKSKG: ["939", "940", "941", "942"].map((id) =>
          planBranch("GKSKG", id),
        ),
      },
      lengths: { SWR1KG: 10, GKSKG: 10 },
    });
    const result = generate(user, ["SWR1KG", "GKSKG"], "HOME", [
      "FOAM_ROLLER",
      "CHAIR",
    ]).filter((entry) => entry.exerciseId !== PAUSE_ID);

    const repeats = result.filter((entry, index) => {
      const previous = result[index - 1];
      return (
        previous !== undefined &&
        previous.exerciseId === entry.exerciseId &&
        entry.set[0] <= previous.set[0]
      );
    });
    expect(result.length).toBeGreaterThan(0);
    expect(repeats).toEqual([]);
  });
});
