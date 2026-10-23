import { type Template } from "@/schemas/aiwl.schema";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { act, fireEvent, render } from "@/utils/testUtils";
import { type ReactNode } from "react";
import AdditionalTrainingWorkoutsScreen from "./AdditionalTrainingWorkoutsScreen";

const mockUseLocalSearchParams = jest.fn();
const mockStackScreen = jest.fn();
const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  Stack: {
    Screen: (props: {
      options: { title?: string; headerRight?: () => ReactNode };
    }) => {
      mockStackScreen(props);
      return props.options.headerRight?.() ?? null;
    },
  },
}));

const mockImportCustomWorkout = jest.fn();
let mockImporting = false;
jest.mock("@/features/customWorkouts/useImportCustomWorkout", () => ({
  useImportCustomWorkout: () => ({
    importCustomWorkout: mockImportCustomWorkout,
    importing: mockImporting,
  }),
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

const IMPORT_LABEL = "Import training";

beforeEach(() => {
  jest.clearAllMocks();
  mockImporting = false;
  mockUseLocalSearchParams.mockReturnValue({ title: "Team Alpha" });
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
});

afterEach(() => {
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
});

describe("AdditionalTrainingWorkoutsScreen: header", () => {
  it("sets the title search param as the header title", () => {
    render(<AdditionalTrainingWorkoutsScreen />);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ title: "Team Alpha" }),
      }),
    );
  });

  it("falls back to the additional trainings title when the title param is missing", () => {
    mockUseLocalSearchParams.mockReturnValue({});

    render(<AdditionalTrainingWorkoutsScreen />);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ title: "Additional trainings" }),
      }),
    );
  });
});

describe("AdditionalTrainingWorkoutsScreen: empty state", () => {
  it("shows the no workouts message", () => {
    const { getByText } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(getByText("Currently no workouts available")).toBeTruthy();
  });

  it("marks the no workouts message as text for screen readers", () => {
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(
      getByRole("text", { name: "Currently no workouts available" }),
    ).toBeTruthy();
  });
});

describe("AdditionalTrainingWorkoutsScreen: own source without entries", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({
      title: "Your trainings",
      source: "own",
    });
  });

  it("shows the no workouts message", () => {
    const { getByText } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(getByText("Currently no workouts available")).toBeTruthy();
  });

  it("calls the import hook when the import training link is pressed", () => {
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(mockImportCustomWorkout).toHaveBeenCalledTimes(1);
  });

  it("sets no header right button", () => {
    render(<AdditionalTrainingWorkoutsScreen />);

    const options = mockStackScreen.mock.calls[0][0].options;
    expect(options.headerRight).toBeUndefined();
  });

  it("marks the import training link as disabled while an import runs", () => {
    mockImporting = true;
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(
      getByRole("button", { name: IMPORT_LABEL }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("ignores presses on the import training link while an import runs", () => {
    mockImporting = true;
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(mockImportCustomWorkout).not.toHaveBeenCalled();
  });
});

describe("AdditionalTrainingWorkoutsScreen: own source with entries", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({
      title: "Your trainings",
      source: "own",
    });
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
  });

  it("lists the imported training by its localized name", () => {
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
  });

  it("hides the empty message", () => {
    const { queryByText } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(queryByText("Currently no workouts available")).toBeNull();
  });

  it("shows the import training button in the header instead of the empty state link", () => {
    const { getAllByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    const importButtons = getAllByRole("button", { name: IMPORT_LABEL });
    expect(importButtons).toHaveLength(1);
  });

  it("calls the import hook when the header import button is pressed", () => {
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(mockImportCustomWorkout).toHaveBeenCalledTimes(1);
  });

  it("marks the header import button as disabled while an import runs", () => {
    mockImporting = true;
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(
      getByRole("button", { name: IMPORT_LABEL }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("ignores presses on the header import button while an import runs", () => {
    mockImporting = true;
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    fireEvent.press(getByRole("button", { name: IMPORT_LABEL }));

    expect(mockImportCustomWorkout).not.toHaveBeenCalled();
  });

  it("renders the add circle icon in the header button", () => {
    const { UNSAFE_getByProps } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(UNSAFE_getByProps({ name: "add-circle" })).toBeTruthy();
  });

  it("shows the header button after a save on an empty list", () => {
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
    const { queryByRole, getByRole } = render(
      <AdditionalTrainingWorkoutsScreen />,
    );
    expect(queryByRole("button", { name: "My core" })).toBeNull();

    act(() => {
      useCustomWorkoutsStore
        .getState()
        .saveCustomWorkout(generateCustomTemplate(), null);
    });

    expect(getByRole("button", { name: "My core" })).toBeTruthy();
    expect(getByRole("button", { name: IMPORT_LABEL })).toBeTruthy();
  });

  it("navigates to the muscle soreness screen when a row is pressed", () => {
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    fireEvent.press(getByRole("button", { name: "My core" }));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type: expect.stringMatching(/^custom-/) },
    });
  });
});

describe("AdditionalTrainingWorkoutsScreen: missing source", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({ title: "Team Alpha" });
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
  });

  it("shows no import action even when own entries exist", () => {
    const { queryByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(queryByRole("button", { name: IMPORT_LABEL })).toBeNull();
  });

  it("sets no header right button even when own entries exist", () => {
    render(<AdditionalTrainingWorkoutsScreen />);

    const options = mockStackScreen.mock.calls[0][0].options;
    expect(options.headerRight).toBeUndefined();
  });
});

describe("AdditionalTrainingWorkoutsScreen: team source", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({
      title: "Team Alpha",
      source: "team",
    });
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);
  });

  it("shows only the empty message even when own entries exist", () => {
    const { getByText, queryByRole } = render(
      <AdditionalTrainingWorkoutsScreen />,
    );

    expect(getByText("Currently no workouts available")).toBeTruthy();
    expect(queryByRole("button", { name: "My core" })).toBeNull();
  });

  it("shows no import action", () => {
    const { queryByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(queryByRole("button", { name: IMPORT_LABEL })).toBeNull();
  });

  it("sets no header right button", () => {
    render(<AdditionalTrainingWorkoutsScreen />);

    const options = mockStackScreen.mock.calls[0][0].options;
    expect(options.headerRight).toBeUndefined();
  });
});
