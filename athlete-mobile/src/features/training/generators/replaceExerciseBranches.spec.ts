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

const replaceLowerBody = (
  tree: SkillTreeType,
  usedBranchIds: string[],
  branchData: Record<string, UserExerciseBranchDataType | undefined> = {},
): string[] => {
  const generator = new TrainingGenerator();
  return generator
    .replaceExerciseBranches(
      "BAS",
      ["LOWER_BODY"],
      [],
      [],
      user,
      catalog(["e1", "e2", "e3"]),
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
      { "1": { branchId: "1", level: 2 } },
    );
    expect(replacements).toEqual(["3"]);
  });
});
