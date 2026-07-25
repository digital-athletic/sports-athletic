import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import {
  createExercise,
  createExerciseData,
} from "@/features/training/utils/testFixtures";
import { render, screen } from "@/utils/testUtils";
import { ExerciseInfoPanel } from "./ExerciseInfoPanel";

const defaultProps = {
  exerciseData: createExerciseData(),
  isPauseExercise: false,
  isCardioExercise: false,
  maxValues: DEFAULT_MAX_VALUES,
  birthday: "1990-01-01",
};

describe("ExerciseInfoPanel: rendering", () => {
  it("renders nothing when exercise is undefined", () => {
    const { toJSON } = render(
      <ExerciseInfoPanel {...defaultProps} exercise={undefined} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders the sets block when the exercise has a set tuple", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise({ set: [2, 4] })}
      />,
    );
    expect(screen.getByText("2 of 4")).toBeTruthy();
    expect(screen.getByText("Sets")).toBeTruthy();
  });

  it("does not render the sets block when the exercise has no set tuple", () => {
    render(<ExerciseInfoPanel {...defaultProps} exercise={createExercise()} />);
    expect(screen.queryByText(/of/)).toBeNull();
  });

  it("renders the formatted duration when duration is a number", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise({ duration: 95 })}
      />,
    );
    expect(screen.getByText("1 min")).toBeTruthy();
    expect(screen.getByText("35 sec")).toBeTruthy();
  });

  it("renders seconds only when the duration is under a minute", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise({ duration: 45 })}
      />,
    );
    expect(screen.getByText("45")).toBeTruthy();
    expect(screen.getByText("sec")).toBeTruthy();
  });

  it("renders minutes only when the duration is an exact number of minutes", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise({ duration: 120 })}
      />,
    );
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("min")).toBeTruthy();
  });

  it("renders max reps label when repetition is -1", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise({ repetition: -1 })}
      />,
    );
    expect(screen.getByText("Max")).toBeTruthy();
  });

  it("renders the repetition count when repetition is a positive number", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise({ repetition: 12 })}
      />,
    );
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Repetitions")).toBeTruthy();
  });

  it("suppresses the reps display for a pause exercise", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise({ repetition: 12 })}
        isPauseExercise={true}
      />,
    );
    expect(screen.queryByText("12")).toBeNull();
    expect(screen.queryByText("Repetitions")).toBeNull();
  });

  it("renders the heart rate display for a cardio exercise", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise()}
        exerciseData={createExerciseData({ tags: ["SKILL_CARDIO_2"] })}
        isCardioExercise={true}
      />,
    );
    expect(screen.getByText("Heart rate interval")).toBeTruthy();
  });

  it("renders the weight or height display for a non cardio exercise", () => {
    render(
      <ExerciseInfoPanel
        {...defaultProps}
        exercise={createExercise({ height: 40 })}
        isCardioExercise={false}
      />,
    );
    expect(screen.getByText("40")).toBeTruthy();
    expect(screen.getByText("cm high")).toBeTruthy();
  });
});
