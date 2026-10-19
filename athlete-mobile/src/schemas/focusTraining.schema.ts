import * as v from "valibot";
import { GeneratorSkillTypeSchema } from "./generator.schema";
import { FocusAreaSchema } from "./sync.schema";

const SecondsSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
const CountSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

// A branch needs one listed tag of every tag group the pick names.
const PickSchema = v.strictObject({
  tags: v.array(v.string()),
  count: CountSchema,
});

export const FocusTrainingBlockSchema = v.strictObject({
  // Skill code of the generated entries, defaults to the training type.
  skill: v.optional(GeneratorSkillTypeSchema),
  // Adds this skill tree to the branches the blocks draw from.
  skillTree: v.optional(v.string()),
  // slots: a one sided exercise fills two slots; pairs: count superset pairs.
  draw: v.picklist(["slots", "exercises", "pairs"]),
  picks: v.pipe(v.array(PickSchema), v.minLength(1)),
  picksWithoutWeights: v.optional(v.pipe(v.array(PickSchema), v.minLength(1))),
  // Draws from all branches once the picks run out of matching ones.
  fallback: v.boolean(),
  sets: CountSchema,
  // Fixed seconds per set; without it the exercise intensity sets the values.
  work: v.optional(SecondsSchema),
  pause: v.strictObject({
    // Rest after each exercise of a superset pair.
    superset: SecondsSchema,
    // Rest between the sets of an exercise without a partner.
    sets: SecondsSchema,
    // Rest after the last set, before the next exercise.
    exercise: SecondsSchema,
  }),
  // A one sided exercise always pairs with its other side. none: no other
  // pairs; muscles: pairs opposing muscles; drawOrder: pairs in draw order;
  // drawOrderAll: draw order, then the leftover singles pair with each other.
  superset: v.picklist(["none", "muscles", "drawOrder", "drawOrderAll"]),
});
export type FocusTrainingBlock = v.InferOutput<typeof FocusTrainingBlockSchema>;

const LocalizedTextSchema = v.strictObject({
  en: v.pipe(v.string(), v.minLength(1)),
  de: v.pipe(v.string(), v.minLength(1)),
});
export type LocalizedText = v.InferOutput<typeof LocalizedTextSchema>;

export const FocusTrainingSchema = v.strictObject({
  title: LocalizedTextSchema,
  // Stats credit the training time of every exercise to this area.
  focusArea: FocusAreaSchema,
  // Intensity configuration name; without it the DEFAULTKG configuration applies.
  intensity: v.optional(v.string()),
  // Replaces the intensity for exercises without weights.
  intensityWithoutWeights: v.optional(v.string()),
  // false: completed exercises keep their values and ask for no feedback.
  progression: v.boolean(),
  // Pain regions of a prevention training: the special warm up draws from
  // them and one sided exercises train the painful side.
  regions: v.optional(v.array(v.string())),
  // The branches of all listed skill trees, limited to the template tags.
  skillTrees: v.pipe(v.array(v.string()), v.minLength(1)),
  tags: v.optional(v.array(v.string())),
  // The athlete needs one of these.
  requiredEquipment: v.optional(v.array(v.string())),
  blocks: v.pipe(v.array(FocusTrainingBlockSchema), v.minLength(1)),
});
export type FocusTraining = v.InferOutput<typeof FocusTrainingSchema>;

export const FocusTrainingsSchema = v.record(v.string(), FocusTrainingSchema);
export type FocusTrainings = v.InferOutput<typeof FocusTrainingsSchema>;
