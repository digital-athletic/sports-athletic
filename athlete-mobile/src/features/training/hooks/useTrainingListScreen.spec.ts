import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE,
  createExercise,
} from "@/features/training/utils/testFixtures";
import { act, renderHook } from "@testing-library/react-native";
import { useTrainingListScreen } from "./useTrainingListScreen";

const mockFinishTraining = jest.fn();

jest.mock("@/features/training/hooks/useFinishTraining", () => ({
  useFinishTraining: () => ({ finishTraining: mockFinishTraining }),
}));

jest.mock("@/features/training/hooks/useTrainingScreenLifecycle", () => ({
  useTrainingScreenLifecycle: () => ({ isScreenFocused: true }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("useTrainingListScreen: finishing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true }),
        createExercise({ exerciseId: PAUSE_EXERCISE_ID, duration: 60 }),
        createExercise({ exerciseId: "2", completed: true }),
      ],
    });
  });

  it("marks every rest row completed without skipping before the finish runs", async () => {
    let restRowsAtFinish: unknown;
    mockFinishTraining.mockImplementation(() => {
      restRowsAtFinish = useTrainingStore
        .getState()
        .exerciseList?.filter((e) => e.exerciseId === PAUSE_EXERCISE_ID)
        .map((e) => ({ skipped: e.skipped, completed: e.completed }));
    });
    const { result } = await renderHook(() => useTrainingListScreen());

    await act(() => {
      result.current.handleFinish();
    });

    expect(restRowsAtFinish).toEqual([{ skipped: undefined, completed: true }]);
  });
});
