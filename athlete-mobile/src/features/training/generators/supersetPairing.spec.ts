import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { ExerciseType } from "@/schemas/exercise.schema";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import TrainingGenerator from "./TrainingGenerator";

const template = ExercisesData[0] as ExerciseType;

const branch = (
  id: string,
  tags: string[],
  exerciseId = `e${id}`,
): BranchExerciseReference => ({
  branchId: id,
  exerciseId,
  branchTags: ["SIDE_BOTH", ...tags],
});

const catalogFor = (branches: BranchExerciseReference[]): ExerciseType[] =>
  branches.map((entry) => ({
    ...template,
    id: entry.exerciseId,
    tags: entry.branchTags,
    otherSideExerciseId: undefined,
  }));

const partnerOf = (
  branches: BranchExerciseReference[],
  leadBranchId: string,
): string | undefined => {
  const generator = new TrainingGenerator();
  const pairs = generator.getExercisePairs(
    "SWR2",
    [...branches],
    catalogFor(branches),
    [],
    [],
  );
  const pair = pairs.find(
    (p) =>
      p.first.branchId === leadBranchId || p.second?.branchId === leadBranchId,
  );
  if (!pair) return undefined;
  return pair.first.branchId === leadBranchId
    ? pair.second?.branchId
    : pair.first.branchId;
};

describe("getExercisePairs: big muscle groups", () => {
  it("leads with a quadriceps exercise before a small muscle exercise", () => {
    const generator = new TrainingGenerator();
    const branches = [
      branch("q", ["MUSCLE_QUADRICEPS", "REGION_LOWER_BODY"]),
      branch("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY"]),
    ];
    const pairs = generator.getExercisePairs(
      "SWR2",
      [...branches],
      catalogFor(branches),
      [],
      [],
    );
    expect(pairs[0].first.branchId).toBe("q");
  });

  it("leads with a hamstrings exercise before a small muscle exercise", () => {
    const generator = new TrainingGenerator();
    const branches = [
      branch("h", ["MUSCLE_HAMSTRINGS", "REGION_LOWER_BODY"]),
      branch("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY"]),
    ];
    const pairs = generator.getExercisePairs(
      "SWR2",
      [...branches],
      catalogFor(branches),
      [],
      [],
    );
    expect(pairs[0].first.branchId).toBe("h");
  });

  it("leads with an upper back exercise before a small muscle exercise", () => {
    const generator = new TrainingGenerator();
    const branches = [
      branch("u", ["MUSCLE_UPPER_BACK", "REGION_UPPER_BODY"]),
      branch("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY"]),
    ];
    const pairs = generator.getExercisePairs(
      "SWR2",
      [...branches],
      catalogFor(branches),
      [],
      [],
    );
    expect(pairs[0].first.branchId).toBe("u");
  });

  it("treats an inner thigh exercise as a small muscle group", () => {
    const generator = new TrainingGenerator();
    const branches = [
      branch("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY"]),
      branch("c", ["MUSCLE_CHEST", "REGION_UPPER_BODY"]),
      branch("i", ["MUSCLE_INNER_THIGH", "REGION_LOWER_BODY"]),
    ];
    const pairs = generator.getExercisePairs(
      "SWR2",
      [...branches],
      catalogFor(branches),
      [],
      [],
    );
    expect(pairs[0].first.branchId).toBe("c");
  });
});

describe("getExercisePairs: superset partner ranking", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("prefers a big muscle from another region over one from the same region", () => {
    const partner = partnerOf(
      [
        branch("h", ["MUSCLE_HAMSTRINGS", "REGION_LOWER_BODY"]),
        branch("c", ["MUSCLE_CHEST", "REGION_UPPER_BODY"]),
        branch("q", ["MUSCLE_QUADRICEPS", "REGION_LOWER_BODY"]),
      ],
      "q",
    );
    expect(partner).toBe("c");
  });

  it("prefers a small muscle from another region over one from the same region", () => {
    const partner = partnerOf(
      [
        branch("w", ["MUSCLE_WRIST_EXTENSOR", "REGION_UPPER_BODY"]),
        branch("k", ["MUSCLE_CALF", "REGION_LOWER_BODY"]),
        branch("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY"]),
      ],
      "b",
    );
    expect(partner).toBe("k");
  });

  it("never pairs two exercises of the same movement direction", () => {
    const partner = partnerOf(
      [
        branch("t", [
          "MUSCLE_TRICEPS",
          "REGION_UPPER_BODY",
          "EXERCISE_DIRECTION_HORIZONTAL_PUSH",
        ]),
        branch("c", [
          "MUSCLE_CHEST",
          "REGION_UPPER_BODY",
          "EXERCISE_DIRECTION_HORIZONTAL_PUSH",
        ]),
      ],
      "c",
    );
    expect(partner).toBeUndefined();
  });

  it("never pairs two exercises of the same primary muscle group", () => {
    const partner = partnerOf(
      [
        branch("f2", ["MUSCLE_SHOULDER_FRONT", "REGION_UPPER_BODY"]),
        branch("f1", ["MUSCLE_SHOULDER_FRONT", "REGION_UPPER_BODY"]),
      ],
      "f1",
    );
    expect(partner).toBeUndefined();
  });

  it("pairs a front shoulder exercise with a rear shoulder exercise", () => {
    const partner = partnerOf(
      [
        branch("r", ["MUSCLE_SHOULDER_REAR", "REGION_UPPER_BODY"]),
        branch("f", ["MUSCLE_SHOULDER_FRONT", "REGION_UPPER_BODY"]),
      ],
      "f",
    );
    expect(partner).toBe("r");
  });

  it("never pairs an exercise with itself", () => {
    const partner = partnerOf(
      [
        branch("k", ["MUSCLE_CALF", "REGION_LOWER_BODY"], "e1"),
        branch("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY"], "e1"),
      ],
      "b",
    );
    expect(partner).toBeUndefined();
  });
});
