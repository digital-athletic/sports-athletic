import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import {
  createExercise,
  createExerciseData,
} from "@/features/training/utils/testFixtures";
import { render, screen } from "@/utils/testUtils";
import { ExerciseWeightOrHeightDisplay } from "./ExerciseWeightOrHeightDisplay";

describe("ExerciseWeightOrHeightDisplay: weight branch", () => {
  it("renders the 2x prefix for a dumbbell exercise", () => {
    render(
      <ExerciseWeightOrHeightDisplay
        exercise={createExercise({ weight: 20, weightType: "weightAbsolute" })}
        exerciseData={createExerciseData({ tags: ["EQ_DUMBBELL"] })}
        maxValues={DEFAULT_MAX_VALUES}
      />,
    );
    expect(screen.getByText(/each/)).toBeTruthy();
    expect(screen.getByText("Weight in kg")).toBeTruthy();
  });

  it("renders the derived weight without a prefix for a non dumbbell exercise", () => {
    render(
      <ExerciseWeightOrHeightDisplay
        exercise={createExercise({ weight: 20, weightType: "weightAbsolute" })}
        exerciseData={createExerciseData({ tags: [] })}
        maxValues={DEFAULT_MAX_VALUES}
      />,
    );
    expect(screen.queryByText(/each/)).toBeNull();
    expect(screen.getByText("20")).toBeTruthy();
  });

  it("renders the performed load instead of the rounded weight", () => {
    render(
      <ExerciseWeightOrHeightDisplay
        exercise={createExercise({
          weight: 41,
          performedWeight: 42.5,
          weightType: "weightAbsolute",
        })}
        exerciseData={createExerciseData({ tags: ["EQ_BARBELL"] })}
        maxValues={DEFAULT_MAX_VALUES}
      />,
    );
    expect(screen.getByText("42.5")).toBeTruthy();
  });
});

describe("ExerciseWeightOrHeightDisplay: height branch", () => {
  it("renders the height value when no weight is present", () => {
    render(
      <ExerciseWeightOrHeightDisplay
        exercise={createExercise({ height: 30 })}
        exerciseData={createExerciseData()}
        maxValues={DEFAULT_MAX_VALUES}
      />,
    );
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("cm high")).toBeTruthy();
  });
});

describe("ExerciseWeightOrHeightDisplay: fallback branch", () => {
  it("renders the no weights fallback when neither weight nor height is present", () => {
    render(
      <ExerciseWeightOrHeightDisplay
        exercise={createExercise()}
        exerciseData={createExerciseData()}
        maxValues={DEFAULT_MAX_VALUES}
      />,
    );
    expect(screen.getByText("No weights")).toBeTruthy();
  });

  it("renders nothing when exercise or exerciseData is undefined", () => {
    const { toJSON } = render(
      <ExerciseWeightOrHeightDisplay
        exercise={undefined}
        exerciseData={createExerciseData()}
        maxValues={DEFAULT_MAX_VALUES}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});
