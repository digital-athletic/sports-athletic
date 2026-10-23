import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import { realExercises } from "../../../../test/factories/planWorkout";
import PlanGenerator from "./PlanGenerator";

const template = realExercises[0];

const user: UserType = {
  userId: "planUser",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: { tags: { LEVEL: ["ADVANCED"] } },
};

type Side = "ONE" | "BOTH";

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
    ...template,
    id: `${prefix}${i}`,
    tags: [`SIDE_${side}`],
  }));

const PREVENTION_TAGS = ["PREVENTION_KNEE_HIP"];

beforeEach(() => {
  // 0.99 always takes the last remaining candidate of the tree
  jest.spyOn(Math, "random").mockReturnValue(0.99);
});

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
        sides.map(() => PREVENTION_TAGS),
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
      user,
      "STUDIO",
      catalog,
      skillTrees,
      [],
      {},
      [],
    );

    expect(branches).toHaveLength(3);
  });

  it("fills a count of four with two one sided prevention exercises", () => {
    // two sided p0 to p3 first, one sided p4 and p5 last, so random 0.99 takes p5 and p4
    const sides: Side[] = ["BOTH", "BOTH", "BOTH", "BOTH", "ONE", "ONE"];
    const catalog = generateCatalogForSides("p", sides);
    const skillTrees = {
      PREVKG: generateSkillTreeForBranchTags(
        "p",
        sides.map(() => PREVENTION_TAGS),
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
      user,
      "STUDIO",
      catalog,
      skillTrees,
      [],
      {},
      [],
    );

    expect(branches.map((branch) => branch.branchId)).toEqual(["p5", "p4"]);
  });
});

describe("getBranchesForWorkout: prevention last slot", () => {
  it("leaves the last prevention slot empty when only one sided exercises remain", () => {
    // p0 and p1 one sided, p2 two sided. Random 0.99 takes p2 first, only p0 and p1 remain
    const sides: Side[] = ["ONE", "ONE", "BOTH"];
    const catalog = generateCatalogForSides("p", sides);
    const skillTrees = {
      PREVKG: generateSkillTreeForBranchTags(
        "p",
        sides.map(() => PREVENTION_TAGS),
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
      user,
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
    // first slot takes the BACK branch p2, the FRONT direction of the last slot only holds one sided p1
    const sides: Side[] = ["BOTH", "ONE", "BOTH"];
    const catalog = generateCatalogForSides("p", sides);
    const skillTrees = {
      PREVKG: generateSkillTreeForBranchTags("p", [
        [
          ...PREVENTION_TAGS,
          "REGION_LOWER_BODY",
          "EXERCISE_DIRECTION_SIDE",
          "SIDE_BOTH",
        ],
        [
          ...PREVENTION_TAGS,
          "REGION_LOWER_BODY",
          "EXERCISE_DIRECTION_FRONT",
          "SIDE_ONE",
        ],
        [
          ...PREVENTION_TAGS,
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
      user,
      "STUDIO",
      catalog,
      skillTrees,
      [],
      {},
      [],
    );

    expect(branches.map((branch) => branch.branchId)).toEqual(["p2", "p0"]);
  });
});

describe("getBranchesForWorkout: non prevention last slot", () => {
  it("still fills the last slot with a one sided branch when only one sided remain", () => {
    // same sides as the prevention last slot test, but for the SWR1 skill
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
      user,
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
