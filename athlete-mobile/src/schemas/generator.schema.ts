import * as v from "valibot";
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
export type PhaseMap = v.InferOutput<typeof PhaseMapSchema>;

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
export type SkillPrioritiesType = v.InferOutput<typeof SkillPrioritiesSchema>;

// Exercise branch schemas
export const ExerciseBranchEntrySchema = v.looseObject({
  exerciseBranchId: v.optional(v.string()),
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
export type SkillBranches = v.InferOutput<typeof SkillBranchesSchema>;

// Skills map schema (for skill training plan)
export const SkillsMapSchema = v.record(v.string(), v.array(v.string()));
export type SkillsMap = v.InferOutput<typeof SkillsMapSchema>;

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
export type ExerciseLevels = v.InferOutput<typeof ExerciseLevelsSchema>;

// Set list entry schema (for warmup sets)
export const SetListEntrySchema = v.looseObject({
  branchId: v.optional(v.string()),
  exerciseId: v.optional(v.string()),
  weight: v.optional(v.number()),
  repetition: v.optional(v.number()),
  duration: v.optional(v.number()),
});
export type SetListEntryClone = v.InferOutput<typeof SetListEntrySchema>;

// Workout/Exercise array schema (loose, for generic validation)
export const WorkoutArraySchema = v.array(v.looseObject({}));
export type WorkoutArray = v.InferOutput<typeof WorkoutArraySchema>;

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
export type TransformType = v.InferOutput<typeof TransformSchema>;
