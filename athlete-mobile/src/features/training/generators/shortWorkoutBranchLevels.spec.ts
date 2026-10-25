import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import { spyOnDrawnBranches } from "@test/factories/drawnBranches";
import TrainingGenerator from "./TrainingGenerator";

const userWithLevel = (
  level: string,
  gender: "MALE" | "FEMALE" = "MALE",
): UserType => ({
  userId: "short-workout-user",
  personalData: { gender, birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: [level] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
});

const mobilityTree = (branch: SkillTreeType[string]) => ({
  MOB: { "500": branch },
});

const THREE_LEVEL_BRANCH: SkillTreeType[string] = {
  tags: ["SKILL_MOB", "REGION_LOWER_BODY", "SIDE_BOTH"],
  levels: {
    1: { exerciseId: "501" },
    2: { exerciseId: "502" },
    3: { exerciseId: "503" },
  },
};

const selectedExerciseIds = (
  generator: TrainingGenerator,
  user: UserType,
  skillTrees: { [skillName: string]: SkillTreeType },
  branchData: Record<string, UserExerciseBranchDataType | undefined> = {},
): string[] => {
  const readDrawnBranches = spyOnDrawnBranches();
  generator.generateShortWorkout("MOB", user, "HOME", [], skillTrees, [], {
    exerciseData: {},
    branchData,
  });
  return readDrawnBranches().map((branch) => branch.exerciseId);
};

const thrownError = (
  generator: TrainingGenerator,
  user: UserType,
  skillTrees: { [skillName: string]: SkillTreeType },
): unknown => {
  try {
    generator.generateShortWorkout("MOB", user, "HOME", [], skillTrees, [], {
      exerciseData: {},
      branchData: {},
    });
  } catch (e) {
    return e;
  }
  return undefined;
};

afterEach(jest.restoreAllMocks);

describe("generateShortWorkout: branch level resolution", () => {
  let generator: TrainingGenerator;

  beforeEach(() => {
    generator = new TrainingGenerator();
  });

  it("uses the stored branch level", () => {
    const ids = selectedExerciseIds(
      generator,
      userWithLevel("BEGINNER"),
      mobilityTree(THREE_LEVEL_BRANCH),
      { "500": { branchId: "500", level: 3 } },
    );
    expect(ids).toEqual(["503"]);
  });

  it("maps an advanced athlete without progress to level 2", () => {
    const ids = selectedExerciseIds(
      generator,
      userWithLevel("ADVANCED"),
      mobilityTree(THREE_LEVEL_BRANCH),
    );
    expect(ids).toEqual(["502"]);
  });

  it("maps a professional athlete without progress to level 3", () => {
    const ids = selectedExerciseIds(
      generator,
      userWithLevel("PROFESSIONAL"),
      mobilityTree(THREE_LEVEL_BRANCH),
    );
    expect(ids).toEqual(["503"]);
  });

  it("falls back to the highest authored level below the entry level", () => {
    const ids = selectedExerciseIds(
      generator,
      userWithLevel("PROFESSIONAL"),
      mobilityTree({
        tags: THREE_LEVEL_BRANCH.tags,
        levels: { 1: { exerciseId: "501" }, 2: { exerciseId: "502" } },
      }),
    );
    expect(ids).toEqual(["502"]);
  });

  it("skips a branch whose levels all lie above the entry level", () => {
    const ids = selectedExerciseIds(generator, userWithLevel("BEGINNER"), {
      MOB: {
        "500": THREE_LEVEL_BRANCH,
        "600": {
          tags: THREE_LEVEL_BRANCH.tags,
          levels: { 3: { exerciseId: "603" } },
        },
      },
    });
    expect(ids).toEqual(["501"]);
  });
});

describe("generateShortWorkout: region quota fallback", () => {
  const branchAt = (
    region: string,
    levels: SkillTreeType[string]["levels"],
  ): SkillTreeType[string] => ({
    tags: ["SKILL_GKS", region, "SIDE_BOTH"],
    levels,
  });

  it("falls back to any region when the region's branches resolve no exercise", () => {
    const generator = new TrainingGenerator();
    const readDrawnBranches = spyOnDrawnBranches();
    generator.generateShortWorkout(
      "GKS",
      userWithLevel("BEGINNER"),
      "HOME",
      [],
      {
        GKSKG: {
          "1": branchAt("REGION_UPPER_BODY", { 1: { exerciseId: "11" } }),
          "2": branchAt("REGION_UPPER_BODY", { 1: { exerciseId: "12" } }),
          "3": branchAt("REGION_UPPER_BODY", { 1: { exerciseId: "13" } }),
          "4": branchAt("REGION_UPPER_BODY", { 1: { exerciseId: "14" } }),
          "5": branchAt("REGION_FULL_BODY", { 3: { exerciseId: "53" } }),
        },
      },
      [],
      { exerciseData: {}, branchData: {} },
    );
    expect(readDrawnBranches()).toHaveLength(4);
  });
});

describe("generateShortWorkout: cause of an empty pool", () => {
  let generator: TrainingGenerator;

  beforeEach(() => {
    generator = new TrainingGenerator();
  });

  it("names the age filter when only child branches exist for an adult", () => {
    const error = thrownError(
      generator,
      userWithLevel("BEGINNER"),
      mobilityTree({
        ...THREE_LEVEL_BRANCH,
        tags: [...THREE_LEVEL_BRANCH.tags, "AGE_CHILD"],
      }),
    );
    expect(error).toEqual({
      type: "NO_EXERCISES",
      subtype: "AGE",
      params: [],
    });
  });

  it("names the gender filter when only female branches exist for a male athlete", () => {
    const error = thrownError(
      generator,
      userWithLevel("BEGINNER", "MALE"),
      mobilityTree({
        ...THREE_LEVEL_BRANCH,
        tags: [...THREE_LEVEL_BRANCH.tags, "GENDER_FEMALE"],
      }),
    );
    expect(error).toEqual({
      type: "NO_EXERCISES",
      subtype: "GENDER",
      params: [],
    });
  });

  it("names the equipment filter when the place lacks the equipment", () => {
    const error = thrownError(
      generator,
      userWithLevel("BEGINNER"),
      mobilityTree({
        ...THREE_LEVEL_BRANCH,
        tags: [...THREE_LEVEL_BRANCH.tags, "EQ_BARBELL"],
      }),
    );
    expect(error).toMatchObject({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
    });
  });
});
