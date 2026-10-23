import i18n from "@/i18n";
import { type Template } from "@/schemas/aiwl.schema";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { act, fireEvent, render } from "@/utils/testUtils";
import { OwnTrainingsList } from "./OwnTrainingsList";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
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
  it("shows the no workouts message when nothing is imported", () => {
    const { getByText } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
  });

  it("shows an import training button below the empty message", () => {
    const { getByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: IMPORT_LABEL })).toBeTruthy();
  });

  it("calls onImport when the import training button is pressed", () => {
    const onImport = jest.fn();
    const { getByRole } = render(
      <OwnTrainingsList onImport={onImport} importing={false} />,
    );

    fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("marks the import training button as disabled while an import runs", () => {
    const { getByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing />,
    );

    expect(
      getByRole("button", { name: IMPORT_LABEL }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("ignores presses on the import training button while an import runs", () => {
    const onImport = jest.fn();
    const { getByRole } = render(
      <OwnTrainingsList onImport={onImport} importing />,
    );

    fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(onImport).not.toHaveBeenCalled();
  });
});

describe("OwnTrainingsList: entries", () => {
  it("shows one row per imported training in import order", () => {
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

    const { getAllByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    const labels = getAllByRole("button").map(
      (row) => row.props.accessibilityLabel,
    );
    expect(labels).toEqual(["First", "Second"]);
  });

  it("hides the empty message and the import link when entries exist", () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { queryByText, queryByRole, getByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
    expect(queryByText(EMPTY_MESSAGE)).toBeNull();
    expect(queryByRole("button", { name: IMPORT_LABEL })).toBeNull();
  });

  it("shows the english name in english", () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
  });

  it("shows the german name in german", async () => {
    await act(() => i18n.changeLanguage("de"));
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    const { getByRole } = render(
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

    const { getByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(getByRole("button", { name: "Only english" })).toBeTruthy();
  });

  it("does not list team entries", () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(
        generateCustomTemplate({ name: { en: "Team one" } }),
        "team-1",
      );

    const { queryByRole, getByText } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    expect(queryByRole("button", { name: "Team one" })).toBeNull();
    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
  });
});

describe("OwnTrainingsList: store updates", () => {
  it("shows a row for a training saved after the first render", () => {
    const { queryByRole, getByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );
    expect(queryByRole("button", { name: "My core" })).toBeNull();

    act(() => {
      useCustomWorkoutsStore
        .getState()
        .saveCustomWorkout(generateCustomTemplate(), null);
    });

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
  });

  it("replaces the empty message after a save", () => {
    const { queryByText, getByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    act(() => {
      useCustomWorkoutsStore
        .getState()
        .saveCustomWorkout(generateCustomTemplate(), null);
    });

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
    expect(queryByText(EMPTY_MESSAGE)).toBeNull();
  });
});

describe("OwnTrainingsList: navigation", () => {
  it("navigates to the muscle soreness screen with the app id as type when a row is pressed", () => {
    const saved = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
    const { getByRole } = render(
      <OwnTrainingsList onImport={jest.fn()} importing={false} />,
    );

    fireEvent.press(getByRole("button", { name: "My core" }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type: saved.id },
    });
  });
});
