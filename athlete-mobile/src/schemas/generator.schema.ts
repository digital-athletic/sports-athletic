import * as v from "valibot";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import { CardioTypesSchema, SectionTypesSchema } from "./common.schema";

// Direction schemas - use string for direction values to accommodate all variants
export const SideTypeSchema = v.picklist(["BOTH", "ONE"]);

// Some files use `direction`, others use `exercise_direction`
export const DirectionEntrySchema = v.looseObject({
  direction: v.optional(v.union([v.string(), v.null()])),
  exercise_direction: v.optional(v.union([v.string(), v.null()])),
  side: SideTypeSchema,
});
export type DirectionEntry = v.InferOutput<typeof DirectionEntrySchema>;

// Keys can be numeric (1, 2, 3...) which become strings in JSON
export const DirectionsMapSchema = v.record(
  v.string(),
  v.array(DirectionEntrySchema),
);
export type DirectionsMap = v.InferOutput<typeof DirectionsMapSchema>;

// Training Section schemas
export const SectionEntrySchema = v.object({
  type: SectionTypesSchema,
  numOfWeeks: v.number(),
  cardioType: CardioTypesSchema,
});
export type SectionEntry = v.InferOutput<typeof SectionEntrySchema>;

// Uses objectWithRest to type both the explicit 'repeat' property and
// numeric week keys (1-20) which map to SectionEntry arrays
export const TrainingSectionsMapSchema = v.objectWithRest(
  { repeat: v.optional(v.array(SectionEntrySchema)) },
  v.array(SectionEntrySchema),
);
export type TrainingSectionsMap = v.InferOutput<
  typeof TrainingSectionsMapSchema
>;

// SkillPriorities schemas
export const PhaseMapSchema = v.record(v.string(), v.array(v.string()));

export const PainConfigSchema = v.looseObject({
  phase: v.optional(PhaseMapSchema),
  combined: v.optional(PhaseMapSchema),
  cardio: v.optional(PhaseMapSchema),
  stability: v.optional(PhaseMapSchema),
});

export const AgeGroupConfigSchema = v.object({
  pain: PainConfigSchema,
  noPain: PainConfigSchema,
});

export const SkillPrioritiesSchema = v.object({
  CHILD: AgeGroupConfigSchema,
  ADULT: AgeGroupConfigSchema,
});

// Exercise branch exercise reference - used in exercises and levels records
// Note: id must be string - raw JSON data must be transformed via transformSkillTree first
export const BranchExerciseRefSchema = v.looseObject({
  id: v.optional(v.string()),
  exerciseId: v.optional(v.string()),
});

// Exercise branch schemas - matches Branch interface for filter compatibility
// Note: tags is optional to handle data variations; filter functions use ?? [] fallback
export const ExerciseBranchEntrySchema = v.looseObject({
  exerciseBranchId: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  exercises: v.optional(v.record(v.string(), BranchExerciseRefSchema)),
  levels: v.optional(v.record(v.string(), BranchExerciseRefSchema)),
  regionTag: v.optional(v.string()),
  direction: v.optional(v.union([v.string(), v.null()])),
  count: v.optional(v.number()),
});
export type ExerciseBranchEntry = v.InferOutput<
  typeof ExerciseBranchEntrySchema
>;

export const SkillBranchesSchema = v.record(
  v.string(),
  v.array(ExerciseBranchEntrySchema),
);

// Skills map schema (for skill training plan)
export const SkillsMapSchema = v.record(v.string(), v.array(v.string()));

// Plan structure schema
export const PlanStructureSchema = v.looseObject({});
export type PlanStructure = v.InferOutput<typeof PlanStructureSchema>;

// Studio preference plans return type
export type StudioPreferencePlans = {
  studio: PlanStructure[];
  nonStudio: PlanStructure[];
};

// Region tag entry (used in skill tag configurations)
export type RegionTagEntry = {
  readonly tags: readonly string[];
  readonly count: number;
  readonly support?: boolean;
};

// Duration-to-tags mapping (e.g., { 20: [...], 25: [...] })
export type DurationTagMap = {
  readonly [key: number]: readonly RegionTagEntry[];
};

// Region configuration with optional child/professional variants
export type RegionConfig = {
  readonly default: DurationTagMap;
  readonly child?: DurationTagMap;
  readonly professional?: DurationTagMap;
};

// Fallback section schema (used in mapFallbackSections)
export const FallbackSectionSchema = v.looseObject({
  length: v.optional(v.number()),
  type: v.optional(v.string()),
});
export type FallbackSection = v.InferOutput<typeof FallbackSectionSchema>;

// Exercise levels schema (from skillTree)
export const ExerciseLevelsSchema = v.record(
  v.string(),
  v.looseObject({
    id: v.optional(v.string()),
    exerciseId: v.optional(v.string()),
  }),
);

// SkillBranch with ID schema (for possibleBranches validation in plan generator)
export const SkillBranchWithIdSchema = v.object({
  exerciseBranchId: v.string(),
  tags: v.array(v.string()),
  levels: v.record(v.string(), v.object({ id: v.string() })),
});
export type SkillBranchWithId = v.InferOutput<typeof SkillBranchWithIdSchema>;

// Set list entry schema (for warmup sets)
export const SetListEntrySchema = v.looseObject({
  branchId: v.optional(v.string()),
  exerciseId: v.optional(v.string()),
  weight: v.optional(v.number()),
  repetition: v.optional(v.number()),
  duration: v.optional(v.number()),
});

// Workout/Exercise array schema (loose, for generic validation)
export const WorkoutArraySchema = v.array(v.looseObject({}));

// ExerciseBranch schema (strict, matches ExerciseBranchType)
export const ExerciseBranchSchema = v.object({
  exerciseBranchId: v.string(),
  tags: v.array(v.string()),
  exercises: v.record(v.string(), v.object({ exerciseId: v.string() })),
});
export const ExerciseBranchArraySchema = v.array(ExerciseBranchSchema);
export type ExerciseBranchArray = v.InferOutput<
  typeof ExerciseBranchArraySchema
>;

// Transform schema (for CSS transforms in bodyParts)
export const TransformSchema = v.array(
  v.looseObject({
    rotate: v.optional(v.string()),
    scale: v.optional(v.number()),
    translateX: v.optional(v.number()),
    translateY: v.optional(v.number()),
  }),
);

// User exercise data map type (used across multiple generator methods)

/**
 * Parameter type for user exercise progress data passed to generator methods.
 * Contains both exercise-level data and branch-level progression data.
 */
export type UserExerciseDataMapType = {
  exerciseData: Record<string, UserExerciseDataType | undefined>;
  branchData: Record<string, UserExerciseBranchDataType | undefined>;
};

// ============================================================================
// Base Exercise Entry Schema
// ============================================================================

/**
 * All valid skill types used in user-facing exercise data.
 * Matches SkillType from Training.ts.
 */
export const SkillTypeSchema = v.picklist([
  "PREVENTION",
  "MOBILITY",
  "SWR",
  "WARMUP",
  "STABILITY",
  "CARDIO",
  "SUPPORT",
  "FOAM_ROLLER",
  "SCHNELLIGKEITSAUSDAUER_SPECIAL",
]);
export type SkillTypeFromSchema = v.InferOutput<typeof SkillTypeSchema>;

/**
 * Complete set of all valid skill values used during training generation.
 * These are internal generator values that get mapped to user-facing SkillType
 * via mapToSkillType() before being stored/displayed.
 *
 * Includes:
 * - Generator aliases (MOB, WU, BR, etc.)
 * - Section types (SA, SK, SWR1, SWR2, etc.)
 * - Prevention variants (PREV, PREVKNEE, etc.)
 * - Warmup variants (WUPREV, WUSPEZIAL, etc.)
 * - Cardio variants (CARDIO_1, CARDIO_1_SHORT, etc.)
 * - Internal placeholders (main, PHASE, TEST)
 */
export const GeneratorSkillTypeSchema = v.picklist([
  // Generator aliases (map to user-facing types)
  "MOB", // -> MOBILITY
  "WU", // -> WARMUP
  "BR", // -> FOAM_ROLLER
  "PREV", // -> PREVENTION
  "CD", // -> CARDIO

  // SWR section variants (all -> SWR)
  "SWR1",
  "SWR1KG",
  "SWR2",
  "SWR2KG",

  // Schnellkraft section types (all -> SWR)
  "SA",
  "SAKG",
  "SAS",
  "SASKG",
  "SK",
  "SKKG",

  // MAX section types (-> SWR)
  "MAX",
  "MAX_KRAFT",

  // Stability types (-> STABILITY)
  "BAS",
  "GKS",

  // Prevention variants (all -> PREVENTION)
  "PREVKNEE",
  "PREVSHOULDER",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",

  // Warmup variants (all -> WARMUP)
  "WUPREV",
  "WUSPEZIAL",
  "WUSKSA",

  // Cardio variants (all -> CARDIO)
  "CARDIO_1",
  "CARDIO_1_SHORT",
  "CARDIO_1_LAKTAT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
  "HBCARDIO",

  // Internal placeholders
  "main", // -> SWR
  "PHASE", // -> SWR (replaced during plan building)
  "TEST", // -> SWR (force test workout)
]);
export type GeneratorSkillTypeFromSchema = v.InferOutput<
  typeof GeneratorSkillTypeSchema
>;

/**
 * Tuple representing [currentSet, totalSets] for exercise sets.
 */
export const SetTupleSchema = v.tuple([v.number(), v.number()]);

/**
 * Generated set list entry with required branchId (used during training generation).
 * Uses GeneratorSkillTypeSchema for type-safe skill values.
 */
export const GeneratedSetListEntrySchema = v.object({
  branchId: v.string(),
  exerciseId: v.string(),
  set: SetTupleSchema,
  skill: GeneratorSkillTypeSchema,
  duration: v.optional(v.number()),
  repetition: v.optional(v.number()),
  weight: v.optional(v.number()),
  height: v.optional(v.number()),
  weightType: v.optional(v.string()),
});
export type GeneratedSetListEntryFromSchema = v.InferOutput<
  typeof GeneratedSetListEntrySchema
>;

// ============================================================================
// Conversion Utilities
// ============================================================================

/** User-facing exercise entry format (after skill mapping) */
export type UserExerciseEntry = {
  exerciseId: string;
  set: [number, number];
  skill: SkillTypeFromSchema;
  duration?: number;
  repetition?: number;
  weight?: number;
  height?: number;
  weightType?: string;
  branchId?: string;
};

/** Maps generator skill values to user-facing SkillType */
const SKILL_TYPE_MAP: Record<
  GeneratorSkillTypeFromSchema,
  SkillTypeFromSchema
> = {
  MOB: "MOBILITY",
  WU: "WARMUP",
  BR: "FOAM_ROLLER",
  PREV: "PREVENTION",
  CD: "CARDIO",
  SWR1: "SWR",
  SWR1KG: "SWR",
  SWR2: "SWR",
  SWR2KG: "SWR",
  SA: "SWR",
  SAKG: "SWR",
  SAS: "SWR",
  SASKG: "SWR",
  SK: "SWR",
  SKKG: "SWR",
  MAX: "SWR",
  MAX_KRAFT: "SWR",
  BAS: "STABILITY",
  GKS: "STABILITY",
  PREVKNEE: "PREVENTION",
  PREVSHOULDER: "PREVENTION",
  PREVWRIST: "PREVENTION",
  PREVANKLE: "PREVENTION",
  PREVSPINE: "PREVENTION",
  WUPREV: "WARMUP",
  WUSPEZIAL: "WARMUP",
  WUSKSA: "WARMUP",
  CARDIO_1: "CARDIO",
  CARDIO_1_SHORT: "CARDIO",
  CARDIO_1_LAKTAT: "CARDIO",
  CARDIO_2: "CARDIO",
  CARDIO_3: "CARDIO",
  CARDIO_4: "CARDIO",
  CARDIO_5: "CARDIO",
  HBCARDIO: "CARDIO",
  main: "SWR",
  PHASE: "SWR",
  TEST: "SWR",
};

/** Maps a generator skill value to a user-facing SkillType */
export function mapToSkillType(
  skill: GeneratorSkillTypeFromSchema,
): SkillTypeFromSchema {
  return SKILL_TYPE_MAP[skill];
}

/** Converts a GeneratedSetListEntry to user-facing format */
export function toUserExerciseData(
  entry: GeneratedSetListEntryFromSchema,
): UserExerciseEntry {
  return {
    exerciseId: entry.exerciseId,
    set: entry.set,
    skill: mapToSkillType(entry.skill),
    duration: entry.duration,
    repetition: entry.repetition,
    weight: entry.weight,
    height: entry.height,
    weightType: entry.weightType,
    branchId: entry.branchId,
  };
}

/** Converts an array of GeneratedSetListEntry to user-facing format */
export function toUserExerciseDataList(
  entries: GeneratedSetListEntryFromSchema[],
): UserExerciseEntry[] {
  return entries.map(toUserExerciseData);
}

// ============================================================================
// Cardio Exercise Types (for getCardioExercisePairs)
// ============================================================================

/**
 * Skill identifier with associated duration/length.
 * Used in cardio training methods where the skill type determines
 * the interval pattern and length determines total duration.
 */
export const SkillWithLengthSchema = v.object({
  skill: v.string(),
  length: v.number(),
});
export type SkillWithLength = v.InferOutput<typeof SkillWithLengthSchema>;

/**
 * Simplified branch reference for cardio exercises.
 * Unlike BranchExerciseReference, this omits branchId as cardio
 * exercises are identified solely by their tags and exercise ID.
 */
export const CardioBranchReferenceSchema = v.object({
  branchTags: v.array(v.string()),
  exerciseId: v.string(),
});
export type CardioBranchReference = v.InferOutput<
  typeof CardioBranchReferenceSchema
>;

/**
 * Exercise pair for cardio training intervals.
 * First exercise is always required (the main cardio activity).
 * Second is optional, used for alternating interval patterns
 * in lower-intensity cardio types (CARDIO_1 through CARDIO_3).
 */
export const CardioExercisePairSchema = v.object({
  first: CardioBranchReferenceSchema,
  second: v.optional(CardioBranchReferenceSchema),
});
export type CardioExercisePair = v.InferOutput<typeof CardioExercisePairSchema>;

// ============================================================================
// Exercise Start Values (for getExerciseStartValues return type)
// ============================================================================

/**
 * Weight type indicator: absolute weight in kg or percentage of F-max.
 */
export const WeightTypeSchema = v.picklist(["weightAbsolute", "weightFMax"]);
export type WeightType = v.InferOutput<typeof WeightTypeSchema>;

/**
 * Return type for getExerciseStartValues method.
 * Contains exercise parameters computed from skill defaults,
 * user progression data, and feedback adjustments.
 */
export type ExerciseStartValues = {
  /** Branch tags for the exercise */
  tags: string[];
  /** Exercise identifier */
  exerciseId: string;
  /** Branch identifier */
  branchId: string;
  /** Duration in seconds (for isAdvanceByDuration exercises) */
  duration?: number;
  /** Height setting */
  height?: number;
  /** Repetition count (for isAdvanceByReps exercises) */
  repetition?: number;
  /** Weight value */
  weight?: number;
  /** Weight type - absolute kg or F-max percentage */
  weightType: WeightType;
};

// ============================================================================
// Test Workout Types (for getTestSetExercise and getTestSetList)
// ============================================================================

/**
 * Level-based weight values for test workouts.
 * Not all levels may be present for all exercises/genders.
 */
export type TestWorkoutLevelWeights = Partial<{
  beginner: number;
  advanced: number;
  professional: number;
}>;

/**
 * Gender-based weight configuration for a single test workout exercise.
 */
export type TestWorkoutGenderWeights = {
  w?: TestWorkoutLevelWeights;
  m?: TestWorkoutLevelWeights;
};

/**
 * Start values configuration for test workout exercises.
 * Maps exercise ID to gender-specific level-based weights.
 */
export type TestWorkoutsStartValuesType = Record<
  string,
  TestWorkoutGenderWeights
>;

// ============================================================================
// Adjustment Types (for getAdjustmentByUserData - Step 7)
// ============================================================================

/**
 * User feedback type on exercise difficulty (non-null values only).
 * Use with `| null` when the feedback state can be absent.
 * See also: ExerciseDifficultyType in workoutConstants.ts which includes null.
 */
export type DifficultyFeedbackType = "SUCCEEDED" | "TOO_EASY" | "TOO_HARD";

/**
 * Adjustment values for each feedback type.
 */
export type FeedbackAdjustment = {
  SUCCEEDED: number;
  TOO_EASY: number;
  TOO_HARD: number;
};

/**
 * Configuration for how to adjust exercise values based on feedback.
 * Returned by getAdjustmentByUserData method.
 */
export type AdjustmentConfig = {
  duration?: FeedbackAdjustment;
  height?: FeedbackAdjustment;
  repetition?: FeedbackAdjustment;
  weightFMax?: FeedbackAdjustment;
  weightAbsolute?: FeedbackAdjustment;
};

// ============================================================================
// Exercise Values Types (for getExerciseValues/adjustExerciseValues - Step 7)
// ============================================================================

/**
 * Exercise values data structure for duration, reps, weight, height.
 * Used by getExerciseValues and adjustExerciseValues methods.
 */
export type ExerciseValuesData = {
  duration?: number;
  height?: number;
  repetition?: number;
  weight?: number;
  weightType?: WeightType;
};

// ============================================================================
// Max Training Types (for getMaxTrainingWeights/getMaxTrainingReps - Step 8)
// ============================================================================

/**
 * Result of max training weight calculation.
 */
export type MaxTrainingWeightsResult = {
  trainingWeights: number[];
  inclineBenchWeightDifference: number;
};

/**
 * Single entry in max training reps array with difficulty level.
 */
export type MaxTrainingRepsEntry = {
  level: string;
  repetitions: number;
};

// ============================================================================
// Helper Function Types (for filterByUserLevel, getStartValues - Step 8)
// ============================================================================

/**
 * Branch data structure for filter functions.
 * Used throughout training generation for branch data with levels/exercises.
 * Note: tags is optional to support different data sources; consumers use ?? [] fallback.
 */
export type SkillBranchData = {
  tags?: string[];
  exercises?: Record<string, { exerciseId?: string; id?: string }>;
  levels?: Record<string, { exerciseId?: string; id?: string }>;
  exerciseBranchId?: string;
};

/**
 * Result of branch filtering operations.
 */
export type FilterResult = {
  keep: Record<string, SkillBranchData>;
  replace: string[];
};

/**
 * Nested lookup structure: gender -> level -> value.
 * Used by getValueByGenderAndLevel helper function.
 */
export type GenderLevelValueMap =
  | Record<string, Record<string, number> | number | undefined>
  | undefined;

/**
 * Exercise value configuration with start/target values.
 */
export type ExerciseValueConfig = {
  startValue?: GenderLevelValueMap;
  targetValue?: GenderLevelValueMap;
  type?: { type: string };
};

/**
 * Full exercise values configuration keyed by parameter type.
 */
export type ExerciseValuesConfig = Record<string, ExerciseValueConfig>;

/**
 * Extracted start values for all exercise value types.
 */
export type StartValuesResult = {
  repetition?: number;
  duration?: number;
  weight?: number;
  height?: number;
};
