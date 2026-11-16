import { TagGroups } from "@/constants/tagGroups";
import { getExerciseById } from "@/data/exerciseRegistry";
import { EXERCISE_DIRECTIONS_VALUES_MAP } from "@/features/training/models/MaxValues";
import { type Sport } from "@/features/training/models/UserWorkoutData";
import { type MaxValuesType, type MaxValueType } from "@/schemas/user.schema";
import { formatDateToISO } from "@/utils/date";
import { getTagValues } from "@/utils/tagUtils";
import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type SportTest } from "./models/SportTest";
import {
  entryBodyWeight,
  relativeOneRepMax,
  strengthTestExerciseId,
} from "./strengthTest";

export type MaxValueDirection = Exclude<keyof MaxValuesType, "testAt">;

/** The movement direction whose barbell maximum the test measures, null when it is no strength test. */
export function strengthTestDirection(
  test: SportTest,
): MaxValueDirection | null {
  const exerciseId = strengthTestExerciseId(test);
  if (exerciseId === null) return null;

  const exercise = getExerciseById(exerciseId);
  if (exercise === undefined) return null;

  const [direction] = getTagValues(exercise.tags, TagGroups.EXERCISE_DIRECTION);
  return direction === undefined
    ? null
    : (EXERCISE_DIRECTIONS_VALUES_MAP[direction] ?? null);
}

/**
 * One performance test value per strength test in the tests, relative to the body weight and dated on the
 * day of the strength test. Empty without a body weight; a test without a positive maximum gets no value.
 */
export function strengthTestPerformanceValues({
  result,
  tests,
  sport,
  bodyWeightKg,
}: {
  result: MaxValuesType;
  tests: SportTest[];
  sport: Sport;
  bodyWeightKg: number | undefined;
}): Omit<PerformanceTestValue, "id">[] {
  if (!Number.isFinite(result.testAt)) return [];
  const date = formatDateToISO(new Date(result.testAt));

  return tests.flatMap((test) => {
    const bodyWeight = entryBodyWeight(test, bodyWeightKg);
    const direction = strengthTestDirection(test);
    if (bodyWeight === null || direction === null) return [];

    // A result stored by an older app version can lack a direction.
    const maximumKg = (result[direction] as MaxValueType | undefined)?.barbell;
    if (maximumKg === undefined || !Number.isFinite(maximumKg)) return [];
    if (maximumKg <= 0) return [];

    return [
      {
        sport,
        testCode: test.code,
        date,
        value: relativeOneRepMax(maximumKg, bodyWeight),
      },
    ];
  });
}
