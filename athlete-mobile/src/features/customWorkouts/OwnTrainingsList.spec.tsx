import { type AlertButton } from "@/common/Alert";
import i18n from "@/i18n";
import { type Template } from "@/schemas/aiwl.schema";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { act, fireEvent, render } from "@/utils/testUtils";
import { OwnTrainingsList } from "./OwnTrainingsList";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
}));

const mockAlert = jest.fn();
jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

// e.g. { aiwl: 1, id: "MY_CORE", name: { en: "My core", de: "Mein Rumpf" }, blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }] }
const generateCustomTemplate = (
  overrides: Partial<Template> = {},
): Template => ({
  aiwl: 1,
  id: "MY_CORE",
  name: { en: "My core", de: "Mein Rumpf" },
  blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }],
  ...overrides,
});

const EMPTY_MESSAGE = "Currently no workouts available";
const IMPORT_LABEL = "Import training";

beforeEach(() => {
  jest.clearAllMocks();
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await act(() => i18n.changeLanguage("en"));
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
});

describe("OwnTrainingsList: empty state", () => {
  it("shows the no workouts message when nothing is imported", async () => {
    const { getByText } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
  });

  it("shows an import training button below the empty message", async () => {
    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: IMPORT_LABEL })).toBeTruthy();
  });

  it("calls onImport when the import training button is pressed", async () => {
    const onImport = jest.fn();
    const { getByRole } = await render(
      <OwnTrainingsList onImport={onImport} importing={false} />,
    );

    await fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("marks the import training button as disabled while an import runs", async () => {
    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing />,
    );

    expect(
      getByRole("button", { name: IMPORT_LABEL }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("ignores presses on the import training button while an import runs", async () => {
    const onImport = jest.fn();
    const { getByRole } = await render(
      <OwnTrainingsList onImport={onImport} importing />,
    );

    await fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(onImport).not.toHaveBeenCalled();
  });
});

describe("OwnTrainingsList: entries", () => {
  it("shows one row per imported training in import order", async () => {
    const { saveCustomWorkout } = useCustomWorkoutsStore.getState();
    jest.spyOn(Date, "now").mockReturnValueOnce(1).mockReturnValueOnce(2);
    saveCustomWorkout(
      generateCustomTemplate({ id: "FIRST", name: { en: "First" } }),
      null,
    );
    saveCustomWorkout(
      generateCustomTemplate({ id: "SECOND", name: { en: "Second" } }),
      null,
    );

    const { getAllByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    const labels = getAllByRole("button").map(
      (row) => row.props.accessibilityLabel,
    );
    expect(labels).toEqual(["First", "Second"]);
  });

  it("hides the empty message and the import link when entries exist", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { queryByText, queryByRole, getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
    expect(queryByText(EMPTY_MESSAGE)).toBeNull();
    expect(queryByRole("button", { name: IMPORT_LABEL })).toBeNull();
  });

  it("shows the english name in english", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
  });

  it("shows the german name in german", async () => {
    await act(() => i18n.changeLanguage("de"));
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: "Mein Rumpf" })).toBeTruthy();
  });

  it("falls back to the english name when the template has no german name", async () => {
    await act(() => i18n.changeLanguage("de"));
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(
        generateCustomTemplate({ name: { en: "Only english" } }),
        null,
      );

    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: "Only english" })).toBeTruthy();
  });

  it("does not list team entries", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(
        generateCustomTemplate({ name: { en: "Team one" } }),
        "team-1",
      );

    const { queryByRole, getByText } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(queryByRole("button", { name: "Team one" })).toBeNull();
    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
  });
});

describe("OwnTrainingsList: store updates", () => {
  it("shows a row for a training saved after the first render", async () => {
    const { queryByRole, getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );
    expect(queryByRole("button", { name: "My core" })).toBeNull();

    await act(() => {
      useCustomWorkoutsStore
        .getState()
        .saveCustomWorkout(generateCustomTemplate(), null);
    });

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
  });

  it("replaces the empty message after a save", async () => {
    const { queryByText, getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    await act(() => {
      useCustomWorkoutsStore
        .getState()
        .saveCustomWorkout(generateCustomTemplate(), null);
    });

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
    expect(queryByText(EMPTY_MESSAGE)).toBeNull();
  });
});

describe("OwnTrainingsList: navigation", () => {
  it("navigates to the muscle soreness screen with the app id as type when a row is pressed", async () => {
    const saved = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    await fireEvent.press(getByRole("button", { name: "My core" }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type: saved.id },
    });
  });
});

const DELETE_LABEL = "Delete";
const DELETE_TITLE = "Delete training?";

describe("OwnTrainingsList: delete", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("shows a delete button after a swipe to the left on a row", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByTestId, getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );
    const row = getByTestId("swipe-to-delete-row");

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });

    expect(getByRole("button", { name: DELETE_LABEL })).toBeTruthy();
  });

  it("asks for confirmation with the training name when the delete button is pressed", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByTestId, getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );
    const row = getByTestId("swipe-to-delete-row");

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent.press(getByRole("button", { name: DELETE_LABEL }));

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(
      DELETE_TITLE,
      "My core will be removed from your trainings. You can import it again from its file.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: DELETE_LABEL,
          style: "destructive",
          onPress: expect.any(Function),
        },
      ],
    );
  });

  it("offers a delete accessibility action on each row", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(
      getByRole("button", { name: "My core" }).props.accessibilityActions,
    ).toEqual([{ name: "delete", label: DELETE_LABEL }]);
  });

  it("asks for confirmation when the delete accessibility action runs", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    await fireEvent(
      getByRole("button", { name: "My core" }),
      "accessibilityAction",
      {
        nativeEvent: { actionName: "delete" },
      },
    );

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert.mock.calls[0][0]).toBe(DELETE_TITLE);
  });

  it("removes the row and the stored training after the deletion is confirmed", async () => {
    const saved = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole, queryByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    await fireEvent(
      getByRole("button", { name: "My core" }),
      "accessibilityAction",
      {
        nativeEvent: { actionName: "delete" },
      },
    );
    const buttons: AlertButton[] = mockAlert.mock.calls[0][2];
    await act(() => {
      buttons.find((button) => button.text === DELETE_LABEL)?.onPress?.();
    });

    expect(queryByRole("button", { name: "My core" })).toBeNull();
    expect(
      Object.hasOwn(useCustomWorkoutsStore.getState().workoutsById, saved.id),
    ).toBe(false);
  });

  it("shows the empty message after the last training is deleted", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole, getByText } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    await fireEvent(
      getByRole("button", { name: "My core" }),
      "accessibilityAction",
      {
        nativeEvent: { actionName: "delete" },
      },
    );
    const buttons: AlertButton[] = mockAlert.mock.calls[0][2];
    await act(() => {
      buttons.find((button) => button.text === DELETE_LABEL)?.onPress?.();
    });

    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
  });

  it("keeps the other trainings after one is deleted", async () => {
    const { saveCustomWorkout } = useCustomWorkoutsStore.getState();
    jest.spyOn(Date, "now").mockReturnValueOnce(1).mockReturnValueOnce(2);
    saveCustomWorkout(
      generateCustomTemplate({ id: "FIRST", name: { en: "First" } }),
      null,
    );
    saveCustomWorkout(
      generateCustomTemplate({ id: "SECOND", name: { en: "Second" } }),
      null,
    );
    const { getByRole, getAllByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    await fireEvent(
      getByRole("button", { name: "First" }),
      "accessibilityAction",
      {
        nativeEvent: { actionName: "delete" },
      },
    );
    const buttons: AlertButton[] = mockAlert.mock.calls[0][2];
    await act(() => {
      buttons.find((button) => button.text === DELETE_LABEL)?.onPress?.();
    });

    const labels = getAllByRole("button").map(
      (row) => row.props.accessibilityLabel,
    );
    expect(labels).toEqual(["Second"]);
  });

  it("keeps the row and the stored training after the deletion is cancelled", async () => {
    const saved = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    await fireEvent(
      getByRole("button", { name: "My core" }),
      "accessibilityAction",
      {
        nativeEvent: { actionName: "delete" },
      },
    );
    const buttons: AlertButton[] = mockAlert.mock.calls[0][2];
    await act(() => {
      buttons.find((button) => button.text === "Cancel")?.onPress?.();
    });

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
    expect(
      Object.hasOwn(useCustomWorkoutsStore.getState().workoutsById, saved.id),
    ).toBe(true);
  });

  it("uses the german texts in german", async () => {
    await act(() => i18n.changeLanguage("de"));
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    await fireEvent(
      getByRole("button", { name: "Mein Rumpf" }),
      "accessibilityAction",
      { nativeEvent: { actionName: "delete" } },
    );

    expect(mockAlert).toHaveBeenCalledWith(
      "Training löschen?",
      "Mein Rumpf wird aus deinen Trainings entfernt. Du kannst es über die Datei erneut importieren.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: expect.any(Function),
        },
      ],
    );
  });
});
