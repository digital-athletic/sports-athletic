import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { UserType } from "@/schemas/user.schema";
import { noExerciseData, realExercises } from "@test/factories/planWorkout";
import TrainingGenerator from "./TrainingGenerator";

const child: UserType = {
  userId: "child",
  personalData: {
    gender: "MALE",
    birthday: `${new Date().getFullYear() - 12}-01-01`,
  },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const branchWith = (tags: string[]) => ({
  tags: ["REGION_UPPER_BODY", "SIDE_BOTH", ...tags],
  levels: { 1: { exerciseId: "431" } },
});

describe("replaceExerciseBranches: children", () => {
  it("replaces from the weighted tree when the place has weights", () => {
    const replacement = new TrainingGenerator().replaceExerciseBranches(
      "SWR1",
      ["UPPER_BODY"],
      [],
      ["DUMBBELL"],
      child,
      realExercises,
      {
        SWR1: { "1": branchWith(["EQ_DUMBBELL", "EQ_TYPE_WEIGHTS"]) },
        SWR1KG: { "2": branchWith(["EQ_TYPE_KG"]) },
      },
      [],
      [],
      noExerciseData,
    );

    expect(replacement.map((branch) => branch.branchId)).toEqual(["1"]);
  });
});
