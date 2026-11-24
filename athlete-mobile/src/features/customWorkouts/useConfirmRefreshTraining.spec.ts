import { type AlertButton } from "@/common/Alert";
import i18n from "@/i18n";
import { useDrawnWorkoutsStore } from "@/store/drawnWorkoutsStore";
import { act, renderHook } from "@testing-library/react-native";
import { useConfirmRefreshTraining } from "./useConfirmRefreshTraining";
import { generateDrawnWorkout } from "@test/factories/drawnWorkout";

const mockAlert = jest.fn();
jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

/** Presses the button of the open confirmation, e.g. "Create". */
const answerConfirmation = (answer: string) => {
  const buttons: AlertButton[] = mockAlert.mock.calls[0][2];
  return act(() => {
    buttons.find((button) => button.text === answer)?.onPress?.();
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  useDrawnWorkoutsStore.setState({
    drawnWorkouts: {
      "custom-a": {
        HOME: generateDrawnWorkout("510"),
        STUDIO: generateDrawnWorkout("523"),
      },
      "custom-b": { HOME: generateDrawnWorkout("520") },
    },
  });
});

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

describe("useConfirmRefreshTraining: confirmation", () => {
  it("asks to create a new version of the training", async () => {
    const { result } = await renderHook(() => useConfirmRefreshTraining());

    result.current("custom-a", "My core");

    expect(mockAlert).toHaveBeenCalledWith(
      "New version",
      "Create a new version of My core?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Create", onPress: expect.any(Function) },
      ],
    );
  });

  it("asks in German", async () => {
    await act(() => i18n.changeLanguage("de"));
    const { result } = await renderHook(() => useConfirmRefreshTraining());

    result.current("custom-a", "Mein Rumpf");

    expect(mockAlert).toHaveBeenCalledWith(
      "Neue Version",
      "Neue Version von Mein Rumpf erstellen?",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Erstellen", onPress: expect.any(Function) },
      ],
    );
  });

  it("discards every drawn workout of that training only after the confirmation", async () => {
    const { result } = await renderHook(() => useConfirmRefreshTraining());

    result.current("custom-a", "My core");
    expect(
      useDrawnWorkoutsStore.getState().drawnWorkouts["custom-a"],
    ).toBeDefined();
    await answerConfirmation("Create");

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({
      "custom-b": { HOME: generateDrawnWorkout("520") },
    });
  });

  it("leaves every drawn workout unchanged after a cancel", async () => {
    const before = structuredClone(
      useDrawnWorkoutsStore.getState().drawnWorkouts,
    );
    const { result } = await renderHook(() => useConfirmRefreshTraining());

    result.current("custom-a", "My core");
    await answerConfirmation("Cancel");

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual(before);
  });
});
