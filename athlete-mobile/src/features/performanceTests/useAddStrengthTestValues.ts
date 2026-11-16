import { featureFlags } from "@/config/featureFlags";
import { type MaxValuesType } from "@/schemas/user.schema";
import { Logger } from "@/services/Logger";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import {
  ALL_SPORTS_CACHE_KEY,
  useSportTestsStore,
} from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { strengthTestPerformanceValues } from "./strengthTestValues";

/**
 * Adds a stored strength test result to the performance tests: one value per locally cached strength
 * performance test, for the athlete's sport and with the current profile body weight.
 */
export function useAddStrengthTestValues(): (result: MaxValuesType) => void {
  const addValue = usePerformanceTestValuesStore((state) => state.addValue);
  const tests = useSportTestsStore(
    (state) => state.testsBySport[ALL_SPORTS_CACHE_KEY],
  );
  const bodyWeightKg = useUserProfileStore(
    (state) => state.personalData.weight,
  );
  const sport = useUserWorkoutStore((state) => state.workoutData.sport);

  return (result) => {
    if (!featureFlags.performanceTestsEnabled) return;

    // The strength test is already stored, so a failure here must not stop it from finishing.
    try {
      const values = strengthTestPerformanceValues({
        result,
        tests: tests ?? [],
        sport,
        bodyWeightKg,
      });
      values.forEach((value) => addValue(value));
    } catch (error) {
      Logger.logError(error as Error);
    }
  };
}
