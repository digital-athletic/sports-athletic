import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import { realExercises } from "@test/factories/planWorkout";
import PlanGenerator from "./PlanGenerator";

type Side = "ONE" | "BOTH";

// Advanced adult without pains. Gives { userId: "planUser", workoutData: { tags: { LEVEL: ["ADVANCED"] } } }.
const generateAdvancedUser = (): UserType => ({
  userId: "planUser",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: { tags: { LEVEL: ["ADVANCED"] } },
});

// One branch per tag list, in order. [["PREVENTION_KNEE_HIP"]] gives { p0: { tags: ["PREVENTION_KNEE_HIP"] } }.
const generateSkillTreeForBranchTags = (
  prefix: string,
  branchTags: string[][],
): SkillTreeType =>
  Object.fromEntries(
    branchTags.map((tags, i) => [
      `${prefix}${i}`,
      { tags, levels: { 1: { exerciseId: `${prefix}${i}` } } },
    ]),
  );

// Catalog exercise per branch with the matching side tag. ["ONE"] gives { id: "p0", tags: ["SIDE_ONE"] }.
const generateCatalogForSides = (
  prefix: string,
  sides: Side[],
): ExerciseType[] =>
  sides.map((side, i) => ({
    ...realExercises[0],
    id: `${prefix}${i}`,
    tags: [`SIDE_${side}`],
  }));

// Counts exercises as the training generator builds them. One sided p0 and two sided p1 give 3.
const countExercisesWithSides = (
  branches: { exercises: Record<number, { exerciseId: string }> }[],
  catalog: ExerciseType[],
): number =>
  branches.reduce((sum, branch) => {
    const exercise = catalog.find(
      (entry) => entry.id === branch.exercises[1].exerciseId,
    );
    return sum + (exercise?.tags.includes("SIDE_ONE") ? 2 : 1);
  }, 0);

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getBranchesForWorkout: prevention exercise count", () => {
  it("uses two slots for each one sided prevention pick", () => {
    const sides: Side[] = ["ONE", "ONE", "ONE", "ONE", "ONE", "ONE"];
    const catalog = generateCatalogForSides("p", sides);
    const skillTrees = {
      PREVKG: generateSkillTreeForBranchTags(
        "p",
        sides.map(() => ["PREVENTION_KNEE_HIP"]),
      ),
    };

    const branches = PlanGenerator.getBranchesForWorkout(
      "PREVKNEE",
      { tags: [], count: 6 },
      {},
      {},
      {},
      {},
      [],
      [],
      generateAdvancedUser(),
      "STUDIO",
      catalog,
      skillTrees,
      [],
      {},
      [],
    );

    expect(branches).toHaveLength(3);
  });

  it("fills a count of four with exactly four exercises with sides counted", () => {
    const sides: Side[] = ["BOTH", "BOTH", "BOTH", "BOTH", "ONE", "ONE"];
    const catalog = generateCatalogForSides("p", sides);
    const skillTrees = {
      PREVKG: generateSkillTreeForBranchTags(
        "p",
        sides.map(() => ["PREVENTION_KNEE_HIP"]),
      ),
    };

    const branches = PlanGenerator.getBranchesForWorkout(
      "PREVKNEE",
      { tags: [], count: 4 },
      {},
      {},
      {},
      {},
      [],
      [],
      generateAdvancedUser(),
      "STUDIO",
      catalog,
      skillTrees,
      [],
      {},
      [],
    );

    expect(countExercisesWithSides(branches, catalog)).toBe(4);
  });
});

describe("getBranchesForWorkout: prevention last slot", () => {
  it("leaves the last prevention slot empty when only one sided exercises remain", () => {
    // 0.99 takes the last candidate, so the first slot takes two sided p2 and only one sided p0 and p1 remain
    jest.spyOn(Math, "random").mockReturnValue(0.99);
    const sides: Side[] = ["ONE", "ONE", "BOTH"];
    const catalog = generateCatalogForSides("p", sides);
    const skillTrees = {
      PREVKG: generateSkillTreeForBranchTags(
        "p",
        sides.map(() => ["PREVENTION_KNEE_HIP"]),
      ),
    };

    const branches = PlanGenerator.getBranchesForWorkout(
      "PREVKNEE",
      { tags: [], count: 2 },
      {},
      {},
      {},
      {},
      [],
      [],
      generateAdvancedUser(),
      "STUDIO",
      catalog,
      skillTrees,
      [],
      {},
      [],
    );

    expect(branches).toHaveLength(1);
  });

  it("takes a two sided prevention exercise of another direction for the last slot", () => {
    // the first slot takes the BACK branch p2, the FRONT direction of the last slot only holds one sided p1
    const sides: Side[] = ["BOTH", "ONE", "BOTH"];
    const catalog = generateCatalogForSides("p", sides);
    const skillTrees = {
      PREVKG: generateSkillTreeForBranchTags("p", [
        [
          "PREVENTION_KNEE_HIP",
          "REGION_LOWER_BODY",
          "EXERCISE_DIRECTION_SIDE",
          "SIDE_BOTH",
        ],
        [
          "PREVENTION_KNEE_HIP",
          "REGION_LOWER_BODY",
          "EXERCISE_DIRECTION_FRONT",
          "SIDE_ONE",
        ],
        [
          "PREVENTION_KNEE_HIP",
          "REGION_LOWER_BODY",
          "EXERCISE_DIRECTION_BACK",
          "SIDE_BOTH",
        ],
      ]),
    };

    const branches = PlanGenerator.getBranchesForWorkout(
      "PREVKNEE",
      { tags: ["REGION_LOWER_BODY"], count: 2 },
      {},
      {
        2: [
          { direction: "BACK", side: "BOTH" },
          { direction: "FRONT", side: "ONE" },
        ],
      },
      {},
      {},
      [],
      [],
      generateAdvancedUser(),
      "STUDIO",
      catalog,
      skillTrees,
      [],
      {},
      [],
    );

    expect(branches.map((branch) => branch.branchId)).toContain("p0");
  });
});

describe("getBranchesForWorkout: non prevention last slot", () => {
  it("still fills the last slot with a one sided branch when only one sided remain", () => {
    // 0.99 takes the last candidate, so the first slot takes two sided s2 and only one sided s0 and s1 remain
    jest.spyOn(Math, "random").mockReturnValue(0.99);
    const sides: Side[] = ["ONE", "ONE", "BOTH"];
    const catalog = generateCatalogForSides("s", sides);
    const skillTrees = {
      SWR1KG: generateSkillTreeForBranchTags(
        "s",
        sides.map(() => ["MUSCLE_GLUTES"]),
      ),
    };

    const branches = PlanGenerator.getBranchesForWorkout(
      "SWR1",
      { tags: [], count: 2 },
      {},
      {},
      {},
      {},
      [],
      [],
      generateAdvancedUser(),
      "STUDIO",
      catalog,
      skillTrees,
      [],
      {},
      [],
    );

    expect(branches).toHaveLength(2);
  });
});
