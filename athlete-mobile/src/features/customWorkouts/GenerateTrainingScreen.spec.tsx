import i18n from "@/i18n";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { act, fireEvent, render } from "@/utils/testUtils";
import GenerateTrainingScreen from "./GenerateTrainingScreen";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  router: { back: () => mockBack() },
  useRouter: () => ({ back: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const GENERATE_LABEL = "Generate training";

const listOwnTrainings = () =>
  listWorkoutsForTeam(useCustomWorkoutsStore.getState().workoutsById, null);

beforeEach(() => {
  jest.clearAllMocks();
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
});

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
});

describe("GenerateTrainingScreen: inputs", () => {
  it("offers the four training times", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);

    for (const label of ["15 min", "30 min", "45 min", "60 min"]) {
      expect(getByRole("radio", { name: label })).toBeTruthy();
    }
  });

  it("offers the four focuses", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);

    for (const label of [
      "Hypertrophy",
      "Explosive power",
      "Mobility",
      "Cardio",
    ]) {
      expect(getByRole("radio", { name: label })).toBeTruthy();
    }
  });

  it("offers the four regions for hypertrophy", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);

    await fireEvent.press(getByRole("radio", { name: "Hypertrophy" }));

    for (const label of ["Upper body", "Lower body", "Core", "Full body"]) {
      expect(getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("hides the regions for cardio", async () => {
    const { getByRole, queryByRole } = await render(<GenerateTrainingScreen />);

    await fireEvent.press(getByRole("radio", { name: "Cardio" }));

    expect(queryByRole("button", { name: "Upper body" })).toBeNull();
  });

  it("hides the core for explosive power", async () => {
    const { getByRole, queryByRole } = await render(<GenerateTrainingScreen />);

    await fireEvent.press(getByRole("radio", { name: "Explosive power" }));

    expect(getByRole("button", { name: "Upper body" })).toBeTruthy();
    expect(queryByRole("button", { name: "Core" })).toBeNull();
  });

  it("reads in German", async () => {
    await act(() => i18n.changeLanguage("de"));

    const { getByRole } = await render(<GenerateTrainingScreen />);

    expect(getByRole("radio", { name: "Muskelaufbau" })).toBeTruthy();
    expect(getByRole("button", { name: "Training generieren" })).toBeTruthy();
  });
});

describe("GenerateTrainingScreen: generate", () => {
  it("saves nothing while an input is missing", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);
    await fireEvent.press(getByRole("radio", { name: "30 min" }));
    await fireEvent.press(getByRole("radio", { name: "Hypertrophy" }));

    await fireEvent.press(getByRole("button", { name: GENERATE_LABEL }));

    expect(listOwnTrainings()).toEqual([]);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("saves one own training", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);
    await fireEvent.press(getByRole("radio", { name: "30 min" }));
    await fireEvent.press(getByRole("radio", { name: "Hypertrophy" }));
    await fireEvent.press(getByRole("button", { name: "Upper body" }));

    await fireEvent.press(getByRole("button", { name: GENERATE_LABEL }));

    expect(listOwnTrainings()).toHaveLength(1);
  });

  it("returns to the list after generating", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);
    await fireEvent.press(getByRole("radio", { name: "30 min" }));
    await fireEvent.press(getByRole("radio", { name: "Hypertrophy" }));
    await fireEvent.press(getByRole("button", { name: "Upper body" }));

    await fireEvent.press(getByRole("button", { name: GENERATE_LABEL }));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("keeps two trainings generated with the same inputs", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);
    await fireEvent.press(getByRole("radio", { name: "15 min" }));
    await fireEvent.press(getByRole("radio", { name: "Cardio" }));

    await fireEvent.press(getByRole("button", { name: GENERATE_LABEL }));
    await fireEvent.press(getByRole("button", { name: GENERATE_LABEL }));

    expect(listOwnTrainings()).toHaveLength(2);
  });

  it("trains the regions chosen with several chips", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);
    await fireEvent.press(getByRole("radio", { name: "60 min" }));
    await fireEvent.press(getByRole("radio", { name: "Hypertrophy" }));
    await fireEvent.press(getByRole("button", { name: "Upper body" }));
    await fireEvent.press(getByRole("button", { name: "Core" }));

    await fireEvent.press(getByRole("button", { name: GENERATE_LABEL }));

    expect(listOwnTrainings()[0].template.blocks[1]).toMatchObject({
      picks: [{ tags: ["REGION_UPPER_BODY"] }, { tags: ["REGION_CORE"] }],
    });
  });

  it("deselects the other regions when the full body is chosen", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);
    await fireEvent.press(getByRole("radio", { name: "Hypertrophy" }));
    await fireEvent.press(getByRole("button", { name: "Upper body" }));

    await fireEvent.press(getByRole("button", { name: "Full body" }));

    expect(getByRole("button", { name: "Upper body" })).not.toBeSelected();
    expect(getByRole("button", { name: "Full body" })).toBeSelected();
  });

  it("drops the core when the focus changes to explosive power", async () => {
    const { getByRole } = await render(<GenerateTrainingScreen />);
    await fireEvent.press(getByRole("radio", { name: "30 min" }));
    await fireEvent.press(getByRole("radio", { name: "Hypertrophy" }));
    await fireEvent.press(getByRole("button", { name: "Core" }));
    await fireEvent.press(getByRole("radio", { name: "Explosive power" }));

    await fireEvent.press(getByRole("button", { name: GENERATE_LABEL }));

    expect(listOwnTrainings()).toEqual([]);
  });
});
