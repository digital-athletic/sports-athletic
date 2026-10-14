import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import TrainingGenerator from "./TrainingGenerator";

const template = ExercisesData[0] as ExerciseType;

const user: UserType = {
  userId: "replacement-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const lowerBodyBranch = (
  levels: Record<number, { exerciseId: string }>,
  extraTags: string[] = [],
): SkillTreeType[string] => ({
  tags: ["SKILL_BAS", "REGION_LOWER_BODY", "SIDE_BOTH", ...extraTags],
  levels,
});

const catalog = (ids: string[]): ExerciseType[] =>
  ids.map((id) => ({ ...template, id, tags: ["REGION_LOWER_BODY"] }));

const kneePainUser: UserType = {
  ...user,
  workoutData: {
    tags: { LEVEL: ["BEGINNER"], PAIN: ["KNEE_LEFT"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
};

interface ReplaceOptions {
  branchData?: Record<string, UserExerciseBranchDataType | undefined>;
  athlete?: UserType;
  exercises?: ExerciseType[];
}

const replaceLowerBody = (
  tree: SkillTreeType,
  usedBranchIds: string[],
  {
    branchData = {},
    athlete = user,
    exercises = catalog(["e1", "e2", "e3"]),
  }: ReplaceOptions = {},
): string[] => {
  const generator = new TrainingGenerator();
  return generator
    .replaceExerciseBranches(
      "BAS",
      ["LOWER_BODY"],
      [],
      [],
      athlete,
      exercises,
      { BAS: tree },
      usedBranchIds,
      [],
      { exerciseData: {}, branchData },
      false,
    )
    .map((replacement) => replacement.branchId);
};

describe("replaceExerciseBranches", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("skips branches tagged for the other gender", () => {
    const replacements = replaceLowerBody(
      { "1": lowerBodyBranch({ 1: { exerciseId: "e1" } }, ["GENDER_FEMALE"]) },
      [],
    );
    expect(replacements).toEqual([]);
  });

  it("skips a branch resolving to an exercise the skill already holds", () => {
    const replacements = replaceLowerBody(
      {
        "1": lowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "2": lowerBodyBranch({ 1: { exerciseId: "e1" } }),
      },
      ["1"],
    );
    expect(replacements).toEqual([]);
  });

  it("reads the stored branch level of kept branches when checking for duplicates", () => {
    const replacements = replaceLowerBody(
      {
        "1": lowerBodyBranch({
          1: { exerciseId: "e1" },
          2: { exerciseId: "e2" },
        }),
        "2": lowerBodyBranch({ 1: { exerciseId: "e2" } }),
        "3": lowerBodyBranch({ 1: { exerciseId: "e3" } }),
      },
      ["1"],
      { branchData: { "1": { branchId: "1", level: 2 } } },
    );
    expect(replacements).toEqual(["3"]);
  });

  it("skips a branch whose branch tags block the athlete's pain region", () => {
    const replacements = replaceLowerBody(
      {
        "1": lowerBodyBranch({ 1: { exerciseId: "e1" } }, ["BLOCK_KNEE"]),
        "2": lowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
      [],
      { athlete: kneePainUser },
    );
    expect(replacements).toEqual(["2"]);
  });

  it("skips a branch whose exercise on any level blocks the athlete's pain region", () => {
    const exercises = [
      ...catalog(["e1", "e3"]),
      { ...template, id: "e2", tags: ["REGION_LOWER_BODY", "BLOCK_KNEE"] },
    ];
    const replacements = replaceLowerBody(
      {
        "1": lowerBodyBranch({
          1: { exerciseId: "e1" },
          2: { exerciseId: "e2" },
        }),
        "2": lowerBodyBranch({ 1: { exerciseId: "e3" } }),
      },
      [],
      { athlete: kneePainUser, exercises },
    );
    expect(replacements).toEqual(["2"]);
  });
});
