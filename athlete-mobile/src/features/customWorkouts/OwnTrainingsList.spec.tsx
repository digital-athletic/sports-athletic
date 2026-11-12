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

/** Labels of the training tiles, without their delete buttons. */
const listTileLabels = (
  buttons: { props: { accessibilityLabel?: string } }[],
): (string | undefined)[] =>
  buttons
    .map((button) => button.props.accessibilityLabel)
    .filter((label) => !label?.startsWith("Delete "));
const IMPORT_LABEL = "Import training";
const GENERATE_LABEL = "Generate training";

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
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
  });

  it("shows an import training button below the empty message", async () => {
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(getByRole("button", { name: IMPORT_LABEL })).toBeTruthy();
  });

  it("calls onImport when the import training button is pressed", async () => {
    const onImport = jest.fn();
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={onImport}
        importing={false}
      />,
    );

    await fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("marks the import training button as disabled while an import runs", async () => {
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing
      />,
    );

    expect(
      getByRole("button", { name: IMPORT_LABEL }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("ignores presses on the import training button while an import runs", async () => {
    const onImport = jest.fn();
    const { getByRole } = await render(
      <OwnTrainingsList onGenerate={jest.fn()} onImport={onImport} importing />,
    );

    await fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(onImport).not.toHaveBeenCalled();
  });
});

describe("OwnTrainingsList: entries", () => {
  it("insets the list below the translucent iOS header", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getByTestId } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(
      getByTestId("own-trainings-list").props.contentInsetAdjustmentBehavior,
    ).toBe("automatic");
  });

  it("places the trainings on a tile grid", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getAllByTestId } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(getAllByTestId("own-trainings-grid-cell")).toHaveLength(2);
  });

  it("shows one tile per imported training in import order", async () => {
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
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(listTileLabels(getAllByRole("button"))).toEqual([
      "First",
      "Second",
      GENERATE_LABEL,
    ]);
  });

  it("hides the empty message and the import link when entries exist", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { queryByText, queryByRole, getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
    expect(queryByText(EMPTY_MESSAGE)).toBeNull();
    expect(queryByRole("button", { name: IMPORT_LABEL })).toBeNull();
  });

  it("shows the icon of the training's focus on the tile", async () => {
    const { saveCustomWorkout } = useCustomWorkoutsStore.getState();
    saveCustomWorkout(generateCustomTemplate(), null);
    saveCustomWorkout(
      generateCustomTemplate({
        id: "MY_RUN",
        name: { en: "My run" },
        blocks: [{ kind: "duration", skill: "CARDIO_2", duration: 1200 }],
      }),
      null,
    );

    const { getAllByTestId } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    // The icons are decorative, so they are hidden from screen readers.
    const hidden = { includeHiddenElements: true };
    expect(
      getAllByTestId("custom-workout-icon-stability", hidden),
    ).toHaveLength(1);
    expect(getAllByTestId("custom-workout-icon-cardio", hidden)).toHaveLength(
      1,
    );
  });

  it("shows the english name in english", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
  });

  it("shows the german name in german", async () => {
    await act(() => i18n.changeLanguage("de"));
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
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
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
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
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(queryByRole("button", { name: "Team one" })).toBeNull();
    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
  });
});

describe("OwnTrainingsList: add tile", () => {
  it("shows the add tile next to the empty message when nothing is imported", async () => {
    const { getByTestId, getByText } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(getByTestId("generate-training-tile")).toBeTruthy();
    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
  });

  it("announces the add tile as a generate training button", async () => {
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(getByRole("button", { name: GENERATE_LABEL })).toBeTruthy();
  });

  it("calls onGenerate when the add tile is pressed", async () => {
    const onGenerate = jest.fn();
    const { getByTestId } = await render(
      <OwnTrainingsList
        onGenerate={onGenerate}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    await fireEvent.press(getByTestId("generate-training-tile"));

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it("keeps the add tile after the trainings", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getAllByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(listTileLabels(getAllByRole("button"))).toEqual([
      "My core",
      GENERATE_LABEL,
    ]);
  });
});

describe("OwnTrainingsList: store updates", () => {
  it("shows a tile for a training saved after the first render", async () => {
    const { queryByRole, getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
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
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
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
  it("navigates to the muscle soreness screen with the app id as type when a tile is pressed", async () => {
    const saved = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
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
const DELETE_MY_CORE = "Delete My core";

/** Confirms or cancels the open delete confirmation, e.g. with "Delete". */
const answerDeleteConfirmation = (answer: string) => {
  const buttons: AlertButton[] = mockAlert.mock.calls[0][2];
  return act(() => {
    buttons.find((button) => button.text === answer)?.onPress?.();
  });
};

describe("OwnTrainingsList: delete", () => {
  it("shows a delete button on each tile", async () => {
    const { saveCustomWorkout } = useCustomWorkoutsStore.getState();
    saveCustomWorkout(
      generateCustomTemplate({ id: "FIRST", name: { en: "First" } }),
      null,
    );
    saveCustomWorkout(
      generateCustomTemplate({ id: "SECOND", name: { en: "Second" } }),
      null,
    );
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    expect(getByRole("button", { name: "Delete First" })).toBeTruthy();
    expect(getByRole("button", { name: "Delete Second" })).toBeTruthy();
  });

  it("asks for confirmation with the training name when the delete button is pressed", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    await fireEvent.press(getByRole("button", { name: DELETE_MY_CORE }));

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

  it("keeps the training closed when the delete button is pressed", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    await fireEvent.press(getByRole("button", { name: DELETE_MY_CORE }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("removes the tile and the stored training after the deletion is confirmed", async () => {
    const saved = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole, queryByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    await fireEvent.press(getByRole("button", { name: DELETE_MY_CORE }));
    await answerDeleteConfirmation(DELETE_LABEL);

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
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    await fireEvent.press(getByRole("button", { name: DELETE_MY_CORE }));
    await answerDeleteConfirmation(DELETE_LABEL);

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
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    await fireEvent.press(getByRole("button", { name: "Delete First" }));
    await answerDeleteConfirmation(DELETE_LABEL);

    expect(listTileLabels(getAllByRole("button"))).toEqual([
      "Second",
      GENERATE_LABEL,
    ]);
  });

  it("keeps the tile and the stored training after the deletion is cancelled", async () => {
    const saved = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = await render(
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    await fireEvent.press(getByRole("button", { name: DELETE_MY_CORE }));
    await answerDeleteConfirmation("Cancel");

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
      <OwnTrainingsList
        onGenerate={jest.fn()}
        onImport={jest.fn()}
        importing={false}
      />,
    );

    await fireEvent.press(getByRole("button", { name: "Mein Rumpf löschen" }));

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
