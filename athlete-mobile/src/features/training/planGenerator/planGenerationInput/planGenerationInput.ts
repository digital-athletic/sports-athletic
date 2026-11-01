import type { PlanAuthoredData } from "@/data/loadPlanAuthoredData";
import type { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { UserWorkoutDataType } from "@/features/training/models/UserWorkoutData";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import type { PlacesData } from "@/store/placesStore";
import type { UserPersonalDataType } from "@/store/userProfileStore";
import type { ISODateString } from "@/utils/date";

/**
 * The athlete profile from the anamnesis. It carries no muscle soreness,
 * because plan creation reads none.
 */
export interface PlanAthlete {
  readonly personalData: UserPersonalDataType;
  readonly workoutData: UserWorkoutDataType;
}

/**
 * Everything plan creation reads, built once per plan by the input builder.
 * No stage loads data, reads a store or reads the clock, and no stage
 * changes this object.
 */
export interface PlanGenerationInput {
  readonly athlete: PlanAthlete;
  /**
   * The season phase with its end date; its type is null before the anamnesis
   * sets it. Stages read this field, not the copy in the athlete's workout data.
   */
  readonly seasonPhase: SeasonPhaseType;
  /** One training day per weekday, Monday first, active or not. */
  readonly weeklySchedule: readonly TrainingDayType[];
  /** The training places with their equipment. */
  readonly trainingPlaces: PlacesData;
  readonly authoredData: PlanAuthoredData;
  /** The athlete's stored branch levels, keyed by branch ID. */
  readonly exerciseData: BranchDataMapType;
  readonly planStartDate: ISODateString;
  /** The day the athlete's age counts to. */
  readonly referenceDate: ISODateString;
  /** Every draw of plan creation goes through this source. */
  readonly random: () => number;
}
