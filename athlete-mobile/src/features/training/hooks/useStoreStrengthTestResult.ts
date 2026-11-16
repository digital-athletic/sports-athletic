import { useAddStrengthTestValues } from "@/features/performanceTests/useAddStrengthTestValues";
import { type MaxValuesType } from "@/schemas/user.schema";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";

/**
 * Stores a strength test result as the current maximums and in the test history, then adds its
 * performance test values. `measured` holds only the maximums measured in this test and defaults to the result.
 */
export function useStoreStrengthTestResult(): (
  result: MaxValuesType,
  measured?: MaxValuesType,
) => void {
  const saveMaxValues = useUserWorkoutStore((state) => state.saveMaxValues);
  const addTestResult = useExerciseProgressStore(
    (state) => state.addTestResult,
  );
  const addStrengthTestValues = useAddStrengthTestValues();

  return (result, measured = result) => {
    saveMaxValues(result);
    addTestResult(result);
    addStrengthTestValues(measured);
  };
}
