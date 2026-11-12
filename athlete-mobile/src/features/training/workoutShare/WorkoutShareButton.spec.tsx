import { useTrainingStore } from "@/features/training/trainingStore";
import { createExercise } from "@/features/training/utils/testFixtures";
import i18n from "@/i18n";
import { act, fireEvent, render, screen, waitFor } from "@/utils/testUtils";
import { WorkoutShareButton } from "./WorkoutShareButton";

const mockShareWorkoutText = jest.fn();
const mockAlert = jest.fn();

jest.mock("./shareWorkoutText", () => ({
  shareWorkoutText: (...args: unknown[]) => mockShareWorkoutText(...args),
}));

jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ place: "GYM" }),
}));

const SHARE_LABEL = "Share the workout as text";

describe("WorkoutShareButton: share", () => {
  // KH-Frontkniebeuge from the bundled exercise catalog
  const CATALOG_EXERCISE_ID = "118";

  beforeEach(async () => {
    jest.clearAllMocks();
    await act(() => i18n.changeLanguage("en"));
    mockShareWorkoutText.mockResolvedValue("shared");
    useTrainingStore.setState({
      exerciseList: [
        createExercise({
          exerciseId: CATALOG_EXERCISE_ID,
          skill: "SWR1",
          set: [1, 1],
          repetition: 7,
        }),
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shares the workout with its exercises and the date of today", async () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 12, 8, 0) });
    await render(<WorkoutShareButton />);

    await fireEvent.press(screen.getByRole("button", { name: SHARE_LABEL }));

    await waitFor(() => expect(mockShareWorkoutText).toHaveBeenCalledTimes(1));
    const [text] = mockShareWorkoutText.mock.calls[0];
    expect(text).toContain("Workout 11/12/2026");
    expect(text).toContain("KH-Frontkniebeuge: 7 repetitions");
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("confirms the copied text on web", async () => {
    mockShareWorkoutText.mockResolvedValue("copied");
    await render(<WorkoutShareButton />);

    await fireEvent.press(screen.getByRole("button", { name: SHARE_LABEL }));

    await waitFor(() =>
      expect(mockAlert).toHaveBeenCalledWith(
        "The workout is copied. You can paste it into your notes.",
      ),
    );
  });

  it("alerts an error when sharing fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockShareWorkoutText.mockRejectedValue(new Error("denied"));
    await render(<WorkoutShareButton />);

    await fireEvent.press(screen.getByRole("button", { name: SHARE_LABEL }));

    await waitFor(() =>
      expect(mockAlert).toHaveBeenCalledWith(i18n.t("common.error")),
    );
  });
});
