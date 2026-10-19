import * as v from "valibot";
import { GeneratorSkillTypeSchema } from "./generator.schema";

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

export const FocusTrainingSchema = v.strictObject({
  skillTree: v.string(),
  tags: v.optional(v.array(v.string())),
  // The athlete needs one of these.
  requiredEquipment: v.optional(v.array(v.string())),
  blocks: v.pipe(v.array(FocusTrainingBlockSchema), v.minLength(1)),
});
export type FocusTraining = v.InferOutput<typeof FocusTrainingSchema>;

export const FocusTrainingsSchema = v.record(v.string(), FocusTrainingSchema);
export type FocusTrainings = v.InferOutput<typeof FocusTrainingsSchema>;
