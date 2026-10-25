import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";

const EMPTY_BAR_WEIGHT = 20;
// Tolerates floating point noise so that computed exact ties still round down.
const ROUNDING_TOLERANCE = 1e-9;

type TaggedExercise = Pick<ExerciseType, "tags"> | undefined;

const roundToStepTiesDown = (value: number, step: number) => {
  const lower = Math.floor(value / step + ROUNDING_TOLERANCE) * step;
  return value - lower > step / 2 + ROUNDING_TOLERANCE ? lower + step : lower;
};

const readEquipment = (exercise: TaggedExercise) =>
  getTagValues(exercise?.tags ?? [], TagGroups.EQUIPMENT);

const isBarbell = (exercise: TaggedExercise) =>
  readEquipment(exercise).includes(WorkoutConstants.EQUIPMENT.BARBELL);

const readRoundingStep = (value: number, exercise: TaggedExercise) => {
  if (readEquipment(exercise).includes(WorkoutConstants.EQUIPMENT.DUMBBELL)) {
    return value > 10 ? 2 : 1;
  }
  return isBarbell(exercise) ? 2.5 : 1;
};

/**
 * Rounds a load to a loadable weight of the exercise's equipment: dumbbells
 * per hand to 1 kg (2 kg above 10 kg), a barbell total load to 2.5 kg and at
 * least the empty bar, other weights to 1 kg. Exact ties round down.
 *
 * roundWeight(56.25, barbellExercise)
 * → 55
 */
export const roundWeight = (
  value: number,
  exercise: TaggedExercise,
  { emptyBarMinimum = true }: { emptyBarMinimum?: boolean } = {},
): number => {
  // A corrupt stored weight gives no load to round.
  if (!isFinite(value)) return 0;
  const rounded = roundToStepTiesDown(value, readRoundingStep(value, exercise));
  return emptyBarMinimum && isBarbell(exercise)
    ? Math.max(rounded, EMPTY_BAR_WEIGHT)
    : rounded;
};
