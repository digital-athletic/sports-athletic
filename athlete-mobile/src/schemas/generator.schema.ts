import * as v from "valibot";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import { CardioTypesSchema, SectionTypesSchema } from "./common.schema";

// Direction schemas
export const SideTypeSchema = v.picklist(["BOTH", "ONE"]);

// Matches the EXERCISE_DIRECTION_* tag suffixes of the exercise catalog.
export const MovementDirectionSchema = v.picklist([
  "SIDE",
  "BACK",
  "FRONT",
  "ROTATION",
  "HORIZONTAL_PUSH",
  "HORIZONTAL_PULL",
  "VERTICAL_PUSH",
  "VERTICAL_PULL",
  "HIP",
  "KNEE",
]);

export const DirectionEntrySchema = v.strictObject({
  direction: v.nullable(MovementDirectionSchema),
  side: SideTypeSchema,
});
export type DirectionEntry = v.InferOutput<typeof DirectionEntrySchema>;

// Keys are the number of exercises (1, 2, 3...), which become strings in JSON
export const DirectionsMapSchema = v.record(
  v.pipe(v.string(), v.regex(/^\d+$/, "Expected numeric string key")),
  v.array(DirectionEntrySchema),
);
export type DirectionsMap = v.InferOutput<typeof DirectionsMapSchema>;

export const DirectionsByRegionSchema = v.strictObject({
  CORE: DirectionsMapSchema,
  FULL_BODY: DirectionsMapSchema,
  LOWER_BODY: DirectionsMapSchema,
  LOWER_BODY_GKS: DirectionsMapSchema,
  UPPER_BODY: DirectionsMapSchema,
});
export type DirectionsByRegion = v.InferOutput<typeof DirectionsByRegionSchema>;

// Place schemas: equipment ids per training location
export const PlaceDataSchema = v.strictObject({
  EQUIPMENT: v.array(v.string()),
});

export const PlacesDataSchema = v.strictObject({
  HOME: PlaceDataSchema,
  STUDIO: PlaceDataSchema,
  HALL: PlaceDataSchema,
  OUTSIDE: PlaceDataSchema,
});
export type PlacesJson = v.InferOutput<typeof PlacesDataSchema>;

// Training Section schemas
export const SectionEntrySchema = v.object({
  type: SectionTypesSchema,
  numOfWeeks: v.pipe(v.number(), v.integer(), v.minValue(1)),
  cardioType: CardioTypesSchema,
});
export type SectionEntry = v.InferOutput<typeof SectionEntrySchema>;

const WEEK_KEY = /^([1-9]|1\d|20)$/;
const WEEK_KEYS = Array.from({ length: 20 }, (_, index) => String(index + 1));

// Uses objectWithRest to type both the explicit 'repeat' property and
// numeric week keys (1-20) which map to SectionEntry arrays
export const TrainingSectionsMapSchema = v.pipe(
  v.objectWithRest(
    { repeat: v.optional(v.array(SectionEntrySchema)) },
    v.array(SectionEntrySchema),
  ),
  v.check(
    (map) =>
      Object.keys(map).every((key) => key === "repeat" || WEEK_KEY.test(key)),
    "Only the keys 1 to 20 and repeat are allowed",
  ),
  v.check(
    (map) => WEEK_KEYS.every((key) => key in map),
    "Every key from 1 to 20 is required",
  ),
);
export type TrainingSectionsMap = v.InferOutput<
  typeof TrainingSectionsMapSchema
>;

// Exercise branch exercise reference - used in exercises and levels records
// Uses exerciseId field (the id field is deprecated)
export const BranchExerciseRefSchema = v.looseObject({
  exerciseId: v.optional(v.string()),
});

// Exercise branch schemas - matches Branch interface for filter compatibility
// Note: tags is optional to handle data variations; filter functions use ?? [] fallback
export const ExerciseBranchEntrySchema = v.looseObject({
  branchId: v.optional(v.string()),
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

// REGION tags are the catalog regions, SKILL tags the skill names the generator resolves
// and EXERCISE_NAME tags the names that getBranchIdByNameAndSkill maps to branch ids.
const REGION_CONFIG_TAGS: readonly string[] = [
  "REGION_UPPER_BODY",
  "REGION_LOWER_BODY",
  "REGION_CORE",
  "REGION_FULL_BODY",
  "SKILL_SAS",
  "SKILL_PLYO_HIGH",
  "SKILL_PLYO_MEDIUM",
  "SKILL_PLYO_LOW",
  "EXERCISE_NAME_SQUAT",
  "EXERCISE_NAME_DEADLIFT",
  "EXERCISE_NAME_BENCH_PRESS",
  "EXERCISE_NAME_ROWING",
  "EXERCISE_NAME_SHOULDER_PRESS",
  "EXERCISE_NAME_CALFLIFT",
];

// Stays a string type, so callers can still build entries from plain strings.
const RegionConfigTagSchema = v.pipe(
  v.string(),
  v.check((tag) => REGION_CONFIG_TAGS.includes(tag), "Unknown region tag"),
);

// Region tag entry (used in skill tag configurations).
export const RegionTagEntrySchema = v.strictObject({
  tags: v.array(RegionConfigTagSchema),
  count: v.number(),
  support: v.optional(v.boolean()),
});
export type RegionTagEntry = v.InferOutput<typeof RegionTagEntrySchema>;

// Minutes (digit string keys in JSON) mapped to the entries for that duration
export const DurationTagMapSchema = v.record(
  v.pipe(v.string(), v.regex(/^\d+$/, "Expected minutes as digit string")),
  v.array(RegionTagEntrySchema),
);
export type DurationTagMap = v.InferOutput<typeof DurationTagMapSchema>;

// Region configuration with optional child/professional variants
export const RegionConfigSchema = v.strictObject({
  default: DurationTagMapSchema,
  child: v.optional(DurationTagMapSchema),
  professional: v.optional(DurationTagMapSchema),
});
export type RegionConfig = v.InferOutput<typeof RegionConfigSchema>;

// Fallback section schema (used in mapFallbackSections)
export const FallbackSectionSchema = v.looseObject({
  length: v.optional(v.number()),
  type: v.optional(v.string()),
});
export type FallbackSection = v.InferOutput<typeof FallbackSectionSchema>;

// Exercise levels schema (from skillTree)
export const ExerciseLevelsSchema = v.record(
  v.string(),
  v.object({ exerciseId: v.string() }),
);

// SkillBranch with ID schema (for possibleBranches validation in plan generator)
export const SkillBranchWithIdSchema = v.object({
  branchId: v.string(),
  tags: v.array(v.string()),
  levels: v.record(v.string(), v.object({ exerciseId: v.string() })),
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

// Schema for numeric string keys that transform to number
const NumericKeySchema = v.pipe(
  v.string(),
  v.regex(/^\d+$/, "Expected numeric string key"),
  v.transform(Number),
);

// ExerciseBranch schema (strict, matches ExerciseBranchType)
// Note: exercises keys are numbers at runtime (JS coerces to string in JSON, we convert back)
export const ExerciseBranchSchema = v.object({
  branchId: v.string(),
  tags: v.array(v.string()),
  exercises: v.record(NumericKeySchema, v.object({ exerciseId: v.string() })),
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
  "POWER_ENDURANCE_SPECIAL",
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
  "MAX_STRENGTH",

  // Stability types (-> STABILITY)
  "BAS",
  "GKS",
  "GKSKG",

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
 * Canonical type for all skill codes used during training generation: a
 * generator skill code or the key of the short workout template that
 * generated the exercise. Templates can come without an app release, so any
 * key is accepted; the literals keep autocompletion.
 */
export type SkillCode =
  | GeneratorSkillTypeFromSchema
  | (string & Record<never, never>);
export const SkillCodeSchema = v.pipe(v.string(), v.minLength(1));

// SkillPriorities schemas
// PREV1 to PREV3 are placeholders the plan generator resolves to a prevention skill
export const SkillPriorityCodeSchema = v.union([
  GeneratorSkillTypeSchema,
  v.picklist(["PREV1", "PREV2", "PREV3"]),
]);

// Keys are the session minutes from which the skills apply
export const PhaseMapSchema = v.record(
  v.pipe(v.string(), v.regex(/^\d+$/, "Expected numeric string key")),
  v.array(SkillPriorityCodeSchema),
);

export const PainConfigSchema = v.strictObject({
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
export type SkillPriorities = v.InferOutput<typeof SkillPrioritiesSchema>;

// MaxMinutes schemas: maximum minutes per skill group and fitness level
// 0 is valid but the plan generator currently treats it as 200 minutes
const MinutesSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

const LevelMinutesSchema = v.object({
  BEGINNER: MinutesSchema,
  ADVANCED: MinutesSchema,
  PROFESSIONAL: MinutesSchema,
});

export const MaxMinutesSchema = v.object({
  BAS: LevelMinutesSchema,
  CARDIO: LevelMinutesSchema,
  DEFAULT: LevelMinutesSchema,
  GKS: LevelMinutesSchema,
  MAX: LevelMinutesSchema,
  PREV: LevelMinutesSchema,
  SA: LevelMinutesSchema,
  SK: LevelMinutesSchema,
  SWR: LevelMinutesSchema,
  WUSPEZIAL: LevelMinutesSchema,
});
export type MaxMinutes = v.InferOutput<typeof MaxMinutesSchema>;
export type MaxMinutesGroup = keyof MaxMinutes;

/**
 * Tuple representing [currentSet, totalSets] for exercise sets.
 * @example [1, 3] means "set 1 of 3"
 */
export const SetTupleSchema = v.tuple([v.number(), v.number()]);
export type SetTuple = v.InferOutput<typeof SetTupleSchema>;

/**
 * Generated set list entry with required branchId (used during training generation).
 */
export const GeneratedSetListEntrySchema = v.object({
  branchId: v.string(),
  exerciseId: v.string(),
  set: SetTupleSchema,
  skill: SkillCodeSchema,
  duration: v.optional(v.number()),
  repetition: v.optional(v.number()),
  weight: v.optional(v.number()),
  height: v.optional(v.number()),
  weightType: v.optional(v.string()),
  repetitionMAX: v.optional(
    v.object({
      level: v.string(),
      repetitions: v.number(),
      weightPercentage: v.optional(v.number()),
    }),
  ),
});
export type GeneratedSetListEntryFromSchema = v.InferOutput<
  typeof GeneratedSetListEntrySchema
>;

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * User-facing exercise entry format.
 * The skill field stores the raw generator skill code. Use mapSkillCodeToFocusArea()
 * from skillTreeUtils.ts to convert to FocusArea for statistics/radar chart.
 */
export type UserExerciseEntry = {
  exerciseId: string;
  set: SetTuple;
  skill: SkillCode;
  duration?: number;
  repetition?: number;
  weight?: number;
  height?: number;
  weightType?: string;
  branchId?: string;
  maxFRepetitions?: {
    level: "WARMUP" | "EASY" | "MEDIUM" | "HARD";
    repetitions: number;
    weightPercentage?: number;
  }[];
};

/**
 * Converts a GeneratedSetListEntry to user-facing format.
 * Skill is passed through unchanged - use mapSkillCodeToFocusArea() for FocusArea conversion.
 */
export function toUserExerciseData(
  entry: GeneratedSetListEntryFromSchema,
): UserExerciseEntry {
  return {
    exerciseId: entry.exerciseId,
    set: entry.set,
    skill: entry.skill,
    duration: entry.duration,
    repetition: entry.repetition,
    weight: entry.weight,
    height: entry.height,
    weightType: entry.weightType,
    branchId: entry.branchId,
    maxFRepetitions: entry.repetitionMAX
      ? [
          entry.repetitionMAX as {
            level: "WARMUP" | "EASY" | "MEDIUM" | "HARD";
            repetitions: number;
            weightPercentage?: number;
          },
        ]
      : undefined,
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
 * Lift exercise ids of one fitness level: a default list plus an optional
 * list per gender (m, w) that replaces the default.
 */
const LiftListSchema = v.strictObject({
  default: v.array(v.string()),
  m: v.optional(v.array(v.string())),
  w: v.optional(v.array(v.string())),
});

const TestSetLoadByLevelSchema = v.object({
  beginner: v.number(),
  advanced: v.number(),
  professional: v.number(),
});

const WarmUpRegionQuotaSchema = v.object({
  tags: v.array(v.string()),
  count: v.number(),
});

/**
 * Strength test data: lifts per fitness level, test set loads in kg per
 * exercise id, gender and fitness level, and warm-up region quotas.
 */
export const StrengthTestSchema = v.pipe(
  v.object({
    lifts: v.object({
      BEGINNER: LiftListSchema,
      ADVANCED: LiftListSchema,
      PROFESSIONAL: LiftListSchema,
    }),
    testSetLoads: v.record(
      v.string(),
      v.strictObject({
        w: v.optional(TestSetLoadByLevelSchema),
        m: v.optional(TestSetLoadByLevelSchema),
      }),
    ),
    warmUpRegionQuotas: v.array(WarmUpRegionQuotaSchema),
  }),
  v.check(
    ({ lifts, testSetLoads }) =>
      Object.values(lifts)
        .flatMap((list) => [
          ...list.default,
          ...(list.m ?? []),
          ...(list.w ?? []),
        ])
        .every((id) => testSetLoads[id]?.w && testSetLoads[id]?.m),
    "Every lift needs test set loads for both genders",
  ),
);
export type StrengthTest = v.InferOutput<typeof StrengthTestSchema>;
export type TestSetLoads = StrengthTest["testSetLoads"];

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
  /** Working set weights in percent of F-Max. */
  trainingWeights: number[];
  /** Buffer of each working set, aligned with trainingWeights. */
  levels: MaxStrengthBuffer[];
};

export type MaxStrengthBuffer = "EASY" | "MEDIUM" | "HARD";

/**
 * Single entry in max training reps array with difficulty level.
 */
export type MaxTrainingRepsEntry = {
  level: string;
  repetitions: number;
  /** Set only on working sets. */
  weightPercentage?: number;
};

// ============================================================================
// Helper Function Types (for filterByUserLevel, getStartValues - Step 8)
// ============================================================================

/**
 * Branch data structure for filter functions.
 * Used throughout training generation for branch data with levels/exercises.
 * Level keys are numbers (converted from string during import).
 * Note: tags is optional to support different data sources; consumers use ?? [] fallback.
 */
export type SkillBranchData = {
  tags?: string[];
  exercises?: Record<number, { exerciseId?: string }>;
  levels?: Record<number, { exerciseId?: string }>;
  branchId?: string;
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
