import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { act, renderHook } from "@testing-library/react-native";
import { useTrainingListCompletion } from "./useTrainingListCompletion";

const mockSaveExerciseAndBranchData = jest.fn();
const mockHandleFeedback = jest.fn();
const mockHandleExerciseSkipped = jest.fn();

jest.mock("@/features/training/hooks/useExerciseCompletion", () => ({
  useExerciseCompletion: () => ({
    saveExerciseAndBranchData: mockSaveExerciseAndBranchData,
    handleFeedback: mockHandleFeedback,
    handleExerciseSkipped: mockHandleExerciseSkipped,
  }),
}));

const row: ListRow = {
  index: 0,
  exerciseId: "1",
  displayName: "Test Exercise",
  isTest: false,
  isLastInSet: true,
  isFeedbackSkill: true,
  completed: false,
};

describe("useTrainingListCompletion: feedback and skipping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [{ exerciseId: "1", skill: "SWR2" }],
    });
  });

  it("sends no feedback when the row is completed without one", async () => {
    const { result } = await renderHook(() => useTrainingListCompletion());

    await act(() => result.current.handleComplete(row));

    expect(mockHandleFeedback).not.toHaveBeenCalled();
    expect(mockSaveExerciseAndBranchData).toHaveBeenCalledWith(0);
  });

  it("sends the chosen feedback before saving", async () => {
    const { result } = await renderHook(() => useTrainingListCompletion());

    await act(() => result.current.handleComplete(row, "SUCCEEDED"));

    expect(mockHandleFeedback).toHaveBeenCalledWith(0, "SUCCEEDED");
  });

  it("runs no progression for a skipped exercise", async () => {
    const { result } = await renderHook(() => useTrainingListCompletion());

    await act(() => result.current.handleSkip(row));

    expect(mockHandleExerciseSkipped).toHaveBeenCalledWith(0);
    expect(mockSaveExerciseAndBranchData).not.toHaveBeenCalled();
    expect(useTrainingStore.getState().exerciseList?.[0]?.completed).toBe(true);
  });
});
