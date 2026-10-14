import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import TrainingGenerator from "./TrainingGenerator";

const adultMale: UserType = {
  userId: "strength-test-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const emptyValue = {
  startValue: { default: {}, m: {}, w: {}, k: {} },
  targetValue: { default: {}, m: {}, w: {}, k: {} },
};

const exercise = (id: string): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name: `Exercise ${id}`,
  displayName: `Exercise ${id}`,
  description: "",
  picture: "",
  video: "",
  tags: ["SIDE_BOTH"],
  values: {
    duration: emptyValue,
    repetition: emptyValue,
    height: emptyValue,
    weight: emptyValue,
  },
  isAdvanceByReps: false,
  isAdvanceByDuration: false,
  isJump: false,
});

const branch = (tags: string[], exerciseId: string): SkillTreeType[string] => ({
  tags: ["SKILL_WU", "SIDE_BOTH", ...tags],
  levels: { 1: { exerciseId } },
});

const warmUpEntries = (tree: SkillTreeType, exerciseIds: string[]) =>
  new TrainingGenerator()
    .getTestSetList(
      adultMale,
      exerciseIds.map(exercise),
      { WU: tree },
      {
        exerciseData: {},
        branchData: {},
      },
    )
    .filter((entry) => entry.branchId in tree);

describe("getTestSetList: warm-up", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("never repeats a resolved exercise", () => {
    const entries = warmUpEntries(
      {
        "1": branch(["REGION_LOWER_BODY"], "a"),
        "2": branch(["REGION_FULL_BODY"], "b"),
        "3": branch(["REGION_UPPER_BODY"], "c"),
        "4": branch(["REGION_UPPER_BODY"], "c"),
        "5": branch(["REGION_CORE"], "d"),
      },
      ["a", "b", "c", "d"],
    );
    expect(entries.map((entry) => entry.exerciseId)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("skips branches authored for another age group or gender", () => {
    const entries = warmUpEntries(
      {
        "1": branch(["REGION_LOWER_BODY", "AGE_CHILD"], "a"),
        "2": branch(["REGION_LOWER_BODY", "GENDER_FEMALE"], "b"),
        "3": branch(["REGION_LOWER_BODY"], "c"),
      },
      ["a", "b", "c"],
    );
    expect(entries.map((entry) => entry.branchId)).toEqual(["3"]);
  });
});
