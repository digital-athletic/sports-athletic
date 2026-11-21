import { Alert } from "@/common/Alert";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { FinishedWorkout } from "@/features/training/workoutGenerator/stages/workoutFinish";
import {
  generateCustomWorkout,
  generateWorkout,
} from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { useSetListVersionsStore } from "@/store/setListVersionsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { generateFilledBlockResult } from "@test/factories/blockResult";
import {
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { act, renderHook } from "@testing-library/react-native";
import { useTrainingGeneration } from "./useTrainingGeneration";

const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: mockNavigate, replace: mockReplace }),
  // The screen never regains focus in these tests.
  useFocusEffect: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/features/training/workoutGeneratorRouter", () => ({
  generateWorkout: jest.fn(),
  generateCustomWorkout: jest.fn(),
}));

const mockGenerateWorkout = jest.mocked(generateWorkout);
const mockGenerateCustomWorkout = jest.mocked(generateCustomWorkout);
const alertSpy = jest.spyOn(Alert, "alert");

/** Plan training params, e.g. { type: "PLAN" }. */
const generatePlanParams = () => ({ type: "PLAN" as const });

/** Strength test params, which show the pain alert for declared pains. */
const generateTestWorkoutParams = () => ({ type: "TEST_WORKOUT" as const });

/**
 * Builds what the generator returns for the template when its block drew the
 * branch.
 *
 * generateFinishedWorkout(template, "510")
 * → { blocks: [{ status: "filled", block: template.blocks[0], exercises: [{ branchId: "510", ... }], ... }],
 *     setList: [{ branchId: "510", exerciseId: "exercise510", set: [1, 1], skill: "GKS" }] }
 */
const generateFinishedWorkout = (
  template: Template,
  branchId: string,
): FinishedWorkout<GeneratedSetListEntry> => ({
  blocks: [generateFilledBlockResult(template.blocks[0], [branchId])],
  setList: [
    {
      branchId,
      exerciseId: `exercise${branchId}`,
      set: [1, 1],
      skill: "GKS",
    },
  ],
});

const pressAlertOk = async (callIndex: number) => {
  const [, , buttons] = alertSpy.mock.calls[callIndex];
  await act(() => {
    buttons?.[0].onPress?.();
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy.mockImplementation(() => {});
  mockGenerateWorkout.mockReturnValue([]);
  useUserProfileStore.setState({ warnings: { painAlertSeen: false } });
  useCustomWorkoutsStore.setState({ workoutsById: {} });
  useSetListVersionsStore.setState({
    versionsByWorkout: {},
    _hasHydrated: true,
  });
});

describe("useTrainingGeneration: double taps", () => {
  it("generates one workout for two synchronous calls", async () => {
    const { result } = await renderHook(() =>
      useTrainingGeneration(generatePlanParams()),
    );

    await act(() => {
      result.current.generateTraining("STUDIO");
      result.current.generateTraining("STUDIO");
    });

    expect(mockGenerateWorkout).toHaveBeenCalledTimes(1);
  });

  it("navigates once to the training overview for two synchronous calls", async () => {
    const { result } = await renderHook(() =>
      useTrainingGeneration(generatePlanParams()),
    );

    await act(() => {
      result.current.generateTraining("STUDIO");
      result.current.generateTraining("STUDIO");
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/training/training-overview" }),
    );
  });
});

describe("useTrainingGeneration: generator error", () => {
  it("replaces to home after the error alert is confirmed", async () => {
    mockGenerateWorkout.mockImplementationOnce(() => {
      throw new Error("no exercises");
    });
    const { result } = await renderHook(() =>
      useTrainingGeneration(generatePlanParams()),
    );

    await act(() => {
      result.current.generateTraining("STUDIO");
    });
    await pressAlertOk(0);

    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
    expect(result.current.generating).toBe(false);
  });

  it("generates again on a new call after the error alert is confirmed", async () => {
    mockGenerateWorkout.mockImplementationOnce(() => {
      throw new Error("no exercises");
    });
    const { result } = await renderHook(() =>
      useTrainingGeneration(generatePlanParams()),
    );

    await act(() => {
      result.current.generateTraining("STUDIO");
    });
    await pressAlertOk(0);
    await act(() => {
      result.current.generateTraining("STUDIO");
    });

    expect(mockGenerateWorkout).toHaveBeenCalledTimes(2);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});

describe("useTrainingGeneration: pain alert", () => {
  beforeEach(() => {
    useUserWorkoutStore.setState({
      workoutData: {
        ...useUserWorkoutStore.getState().workoutData,
        tags: { PAIN: ["KNEE_LEFT"] },
      },
    });
  });

  it("shows one pain alert for two synchronous calls", async () => {
    const { result } = await renderHook(() =>
      useTrainingGeneration(generateTestWorkoutParams()),
    );

    await act(() => {
      result.current.generateTraining("STUDIO");
      result.current.generateTraining("STUDIO");
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it("navigates once after the pain alert is confirmed", async () => {
    const { result } = await renderHook(() =>
      useTrainingGeneration(generateTestWorkoutParams()),
    );

    await act(() => {
      result.current.generateTraining("STUDIO");
    });
    await pressAlertOk(0);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(result.current.generating).toBe(false);
  });
});

describe("useTrainingGeneration: saved versions of custom workouts", () => {
  it("saves the first set list of an own training at the place", async () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    useCustomWorkoutsStore.setState({
      workoutsById: {
        "custom-a": { id: "custom-a", teamId: null, template, importedAt: 0 },
      },
    });
    mockGenerateCustomWorkout.mockReturnValue(
      generateFinishedWorkout(template, "510"),
    );
    const { result } = await renderHook(() =>
      useTrainingGeneration({ type: "custom-a" }),
    );

    await act(() => {
      result.current.generateTraining("STUDIO");
    });

    const saved =
      useSetListVersionsStore.getState().versionsByWorkout["custom-a"]?.STUDIO;
    expect(saved?.blocks.map(({ block }) => block.branches)).toEqual([["510"]]);
  });
});
