import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { act, renderHook } from "@testing-library/react-native";
import { generateChecklistRow } from "@test/factories/checklistRow";
import { useTrainingListReps } from "./useTrainingListReps";

const mockSaveExerciseAndBranchData = jest.fn();
const mockSaveRepsInput = jest.fn();

jest.mock("@/features/training/hooks/useExerciseCompletion", () => ({
  useExerciseCompletion: () => ({
    saveExerciseAndBranchData: mockSaveExerciseAndBranchData,
    saveRepsInput: mockSaveRepsInput,
  }),
}));

describe("useTrainingListReps: submitting reps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [{ exerciseId: "1", skill: "SWR2" }],
    });
  });

  it("saves the reps once when Save fires twice before re-render", async () => {
    const row = generateChecklistRow({ isTest: true });
    const { result } = await renderHook(() =>
      useTrainingListReps({ onSetFinished: jest.fn() }),
    );

    await act(() => {
      result.current.handleSubmitReps(row);
      result.current.handleSubmitReps(row);
    });

    expect(mockSaveExerciseAndBranchData).toHaveBeenCalledTimes(1);
  });

  it("reports the saved set as finished", async () => {
    const onSetFinished = jest.fn();
    const row = generateChecklistRow({ isTest: true, index: 0 });
    const { result } = await renderHook(() =>
      useTrainingListReps({ onSetFinished }),
    );

    await act(() => result.current.handleSubmitReps(row));

    expect(onSetFinished).toHaveBeenCalledWith(0);
  });
});
