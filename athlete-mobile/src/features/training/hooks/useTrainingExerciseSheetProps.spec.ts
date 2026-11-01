import { createExercise } from "@/features/training/utils/testFixtures";
import { act, renderHook } from "@testing-library/react-native";
import { generateChecklistRow } from "@test/factories/checklistRow";
import { useTrainingExerciseSheetProps } from "./useTrainingExerciseSheetProps";

const startRowWithSkill = async (skill: string) => {
  const rows = [generateChecklistRow()];
  const exerciseList = [createExercise({ skill, duration: 30 })];

  const { result } = await renderHook(() =>
    useTrainingExerciseSheetProps({
      rows,
      exerciseList,
      repsDraft: {},
      timing: { startExercise: jest.fn(), endExercise: jest.fn() },
      onChangeReps: jest.fn(),
      onSubmitReps: jest.fn(),
      onComplete: jest.fn(),
    }),
  );
  await act(() => {
    result.current.handleStart(rows[0]);
  });
  return result.current.sheetProps;
};

describe("useTrainingExerciseSheetProps: countdown duration", () => {
  it("keeps the duration for a timed row", async () => {
    const sheetProps = await startRowWithSkill("SWR1");

    expect(sheetProps.duration).toBe(30);
  });

  it.each(["CARDIO_4", "CARDIO_5"])(
    "gives the endurance skill %s no countdown duration",
    async (skill) => {
      const sheetProps = await startRowWithSkill(skill);

      expect(sheetProps.duration).toBeUndefined();
    },
  );
});
