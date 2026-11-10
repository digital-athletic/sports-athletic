import i18n from "@/i18n";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import { act, render } from "@/utils/testUtils";
import { Workouts } from "./Workouts";

jest.mock("@/charts/RadarChart", () => ({ RadarChart: () => null }));

/**
 * Builds a completed workout of 30 min, 2 exercises, 50 XP and 450 kg,
 * e.g. { id: "w1", timestamp: 10 November 2026 15:15, duration: 1800 }.
 */
const generateCompletedWorkout = (
  overrides: Partial<CompleteWorkoutType> = {},
): CompleteWorkoutType => ({
  id: "w1",
  timestamp: new Date(2026, 10, 10, 15, 15).getTime(),
  exercises: [],
  duration: 1800,
  exerciseCount: 2,
  xpEarned: 50,
  movedWeight: 450,
  ...overrides,
});

describe("Workouts: recent workout cards", () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage("en"));
  });

  it("shows the date as title and all values in one line", async () => {
    const { getByTestId, getByText } = await render(
      <Workouts scale="total" workouts={[generateCompletedWorkout()]} />,
    );

    expect(getByText("Recent workouts")).toBeTruthy();
    expect(getByTestId("workout-row-w1-title")).toHaveTextContent(
      "10.11.2026 · 15:15",
    );
    expect(getByTestId("workout-row-w1-summary")).toHaveTextContent(
      "30 min · 2 exercises · 50 pts · 450 kg",
    );
  });

  it("exposes each value of the line by its own testID", async () => {
    const { getByTestId } = await render(
      <Workouts scale="total" workouts={[generateCompletedWorkout()]} />,
    );

    expect(getByTestId("workout-row-w1-summary-duration")).toHaveTextContent(
      "30 min",
    );
    expect(getByTestId("workout-row-w1-summary-count")).toHaveTextContent(
      "2 exercises",
    );
    expect(getByTestId("workout-row-w1-summary-xp")).toHaveTextContent(
      "50 pts",
    );
    expect(getByTestId("workout-row-w1-summary-weight")).toHaveTextContent(
      "450 kg",
    );
  });

  it("uses the singular for a single exercise", async () => {
    const { getByTestId } = await render(
      <Workouts
        scale="total"
        workouts={[generateCompletedWorkout({ exerciseCount: 1 })]}
      />,
    );

    expect(getByTestId("workout-row-w1-summary-count")).toHaveTextContent(
      "1 exercise",
    );
  });

  it("shows the line in german", async () => {
    await act(() => i18n.changeLanguage("de"));
    const { getByTestId, getByText } = await render(
      <Workouts scale="total" workouts={[generateCompletedWorkout()]} />,
    );

    expect(getByText("Letzte Trainings")).toBeTruthy();
    expect(getByTestId("workout-row-w1-summary")).toHaveTextContent(
      "30 min · 2 Übungen · 50 Pkt. · 450 kg",
    );
  });

  it("keeps the summary totals of all workouts", async () => {
    const { getByTestId } = await render(
      <Workouts
        scale="total"
        workouts={[
          generateCompletedWorkout(),
          generateCompletedWorkout({ id: "w2" }),
        ]}
      />,
    );

    expect(getByTestId("overall-summary-duration")).toHaveTextContent(
      "1 h 0 min",
    );
    expect(getByTestId("overall-summary-count")).toHaveTextContent("4");
    expect(getByTestId("overall-summary-xp")).toHaveTextContent("100");
    expect(getByTestId("overall-summary-weight")).toHaveTextContent("900 kg");
  });
});

describe("Workouts: empty state", () => {
  it("shows the empty message and no workout cards", async () => {
    const { getByTestId, queryByTestId, queryByText } = await render(
      <Workouts scale="total" workouts={[]} />,
    );

    expect(getByTestId("no-workouts-message")).toHaveTextContent(
      "No trainings yet",
    );
    expect(queryByTestId("workouts-list-container")).toBeNull();
    expect(queryByText("Recent workouts")).toBeNull();
    expect(getByTestId("overall-summary-duration")).toHaveTextContent("0 s");
  });
});
