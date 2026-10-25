import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import { getTagValues } from "@/utils/tagUtils";
import { importTrees, realExercises } from "@test/factories/planWorkout";
import PlanGenerator from "./PlanGenerator";

const template = realExercises[0];

const user: UserType = {
  userId: "plan-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: { tags: { LEVEL: ["ADVANCED"] } },
};

const WEIGHTED_TAGS = ["EQ_DUMBBELL", "MUSCLE_BICEPS", "SIDE_BOTH"];
const BODYWEIGHT_TAGS = ["MUSCLE_BICEPS", "SIDE_BOTH"];

const tree = (prefix: string, count: number, tags: string[]): SkillTreeType =>
  Object.fromEntries(
    Array.from({ length: count }, (_, i) => [
      `${prefix}${i}`,
      { tags, levels: { 1: { exerciseId: `${prefix}${i}` } } },
    ]),
  );

const catalogFor = (trees: SkillTreeType[]): ExerciseType[] =>
  trees.flatMap((skillTree) =>
    Object.entries(skillTree).map(([id, branch]) => ({
      ...template,
      id,
      tags: branch.tags,
    })),
  );

const select = (
  skill: string,
  count: number,
  skillTrees: Record<string, SkillTreeType>,
  options: {
    equipment?: string[];
    tags?: string[];
    exercises?: ExerciseType[];
  } = {},
) =>
  PlanGenerator.getBranchesForWorkout(
    skill,
    { tags: options.tags ?? [], count },
    {},
    {},
    {},
    {},
    options.equipment ?? ["DUMBBELL"],
    [],
    user,
    "STUDIO",
    options.exercises ?? catalogFor(Object.values(skillTrees)),
    skillTrees,
    [],
    {},
    [],
  );

const weightedCount = (branches: { tags?: string[] }[]) =>
  branches.filter((branch) => (branch.tags ?? []).includes("EQ_DUMBBELL"))
    .length;

beforeEach(() => {
  jest.spyOn(Math, "random").mockReturnValue(0.99);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getBranchesForWorkout: weighted and bodyweight mix", () => {
  it("picks a weighted branch when the quota asks for one", () => {
    const branches = select("SWR1", 1, {
      SWR1: tree("w", 1, WEIGHTED_TAGS),
      SWR1KG: tree("k", 2, BODYWEIGHT_TAGS),
    });
    expect(weightedCount(branches)).toBe(1);
  });

  it("uses the 80% studio share for explosive power", () => {
    const branches = select("SK", 4, {
      SK: tree("w", 4, WEIGHTED_TAGS),
      SKKG: tree("k", 4, BODYWEIGHT_TAGS),
    });
    expect(weightedCount(branches)).toBe(4);
  });

  it("uses the 60% studio share for full-body stability", () => {
    const branches = select("GKS", 4, {
      GKS: tree("w", 4, WEIGHTED_TAGS),
      GKSKG: tree("k", 4, BODYWEIGHT_TAGS),
    });
    expect(weightedCount(branches)).toBe(3);
  });
});

describe("getBranchesForWorkout: max strength and plyometric slots", () => {
  it("skips a max strength lift whose equipment the place lacks", () => {
    const branches = select("MAX_STRENGTH", 1, importTrees("MAX"), {
      equipment: ["DUMBBELL"],
      tags: ["EXERCISE_NAME_SQUAT"],
      exercises: realExercises,
    });
    expect(branches.map((branch) => branch.branchId)).not.toContain("143");
  });

  it("fills a plyometric slot from the plyometric tree", () => {
    const branches = select("SK", 2, importTrees("PLYO", "SK", "SKKG"), {
      equipment: Object.values(WorkoutConstants.EQUIPMENT),
      tags: ["SKILL_PLYO_HIGH"],
      exercises: realExercises,
    });
    // a one-sided branch fills both slots
    expect(branches.length).toBeGreaterThan(0);
    expect(
      branches.every((branch) =>
        getTagValues(branch.tags ?? [], "SKILL").includes("PLYO_HIGH"),
      ),
    ).toBe(true);
  });
});
