import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type {
  BranchExerciseReference,
  ExercisePair,
  SkillBranchList,
} from "@/features/training/models/ExerciseBranch";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserType } from "@/schemas/user.schema";
import { getTagValue } from "@/utils/tagUtils";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import TrainingGenerator from "./TrainingGenerator";

const template = ExercisesData[0] as ExerciseType;

const user: UserType = {
  userId: "order-user",
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

const orderedPairs = (
  skill: SkillBranchList["skill"],
  branches: BranchExerciseReference[],
): ExercisePair[] => {
  const generator = new TrainingGenerator();
  const spy = jest
    .spyOn(generator, "getSetListFromExercisePairs")
    .mockReturnValue([]);
  const exercises = branches.map((entry) => ({
    ...template,
    id: entry.exerciseId,
    tags: entry.branchTags,
    otherSideExerciseId: undefined,
  }));
  generator.createSetList(
    [{ skill, branches, length: 30 }],
    exercises,
    {},
    user,
    "STUDIO",
    [],
    null,
  );
  return spy.mock.calls[0][0];
};

const leadIds = (pairs: ExercisePair[]) =>
  pairs.map((pair) => pair.first.branchId);

const leadRegions = (pairs: ExercisePair[]) =>
  pairs.map((pair) => getTagValue(pair.first.branchTags, "REGION"));

const squat = ref("squat", ["REGION_LOWER_BODY", "MUSCLE_QUADRICEPS"]);
const deadlift = ref("deadlift", ["REGION_LOWER_BODY", "MUSCLE_HAMSTRINGS"]);
const bench = ref("bench", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]);
const row = ref("row", ["REGION_UPPER_BODY", "MUSCLE_LATISSIMUS"]);

beforeEach(() => {
  jest.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createSetList: max strength order", () => {
  it("puts the lower body main lifts before the upper body main lifts", () => {
    const pairs = orderedPairs("MAX_STRENGTH", [squat, deadlift, bench, row]);
    expect(leadIds(pairs).slice(0, 2).sort()).toEqual(["deadlift", "squat"]);
  });
});

describe("createSetList: body region rotation", () => {
  it("rotates full body, lower body and upper body", () => {
    const pairs = orderedPairs("GKS", [
      ref("full", ["REGION_FULL_BODY", "MUSCLE_GLUTES"]),
      ref("lower", ["REGION_LOWER_BODY", "MUSCLE_QUADRICEPS"]),
      ref("upper1", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
      ref("upper2", ["REGION_UPPER_BODY", "MUSCLE_LATISSIMUS"]),
    ]);
    expect(leadRegions(pairs)).toEqual([
      "FULL_BODY",
      "LOWER_BODY",
      "UPPER_BODY",
      "UPPER_BODY",
    ]);
  });

  it("changes the body region after each unit when another region is left", () => {
    const pairs = orderedPairs("GKS", [
      ref("upper", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
      ref("lower1", ["REGION_LOWER_BODY", "MUSCLE_GLUTES"]),
      ref("lower2", ["REGION_LOWER_BODY", "MUSCLE_QUADRICEPS"]),
    ]);
    expect(leadRegions(pairs)).toEqual([
      "LOWER_BODY",
      "UPPER_BODY",
      "LOWER_BODY",
    ]);
  });

  it("avoids the same primary muscle in the directly following unit", () => {
    const pairs = orderedPairs("GKS", [
      ref("lowerChest", ["REGION_LOWER_BODY", "MUSCLE_CHEST"]),
      ref("upperChest", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
      ref("upperLat", ["REGION_UPPER_BODY", "MUSCLE_LATISSIMUS"]),
    ]);
    expect(leadIds(pairs)).toEqual(["lowerChest", "upperLat", "upperChest"]);
  });

  it("keeps big muscle groups before small ones", () => {
    const pairs = orderedPairs("GKS", [
      ref("core", ["REGION_CORE", "MUSCLE_RECTUS_ABDOMINIS"]),
      ref("upper", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
    ]);
    expect(leadIds(pairs)).toEqual(["upper", "core"]);
  });
});
