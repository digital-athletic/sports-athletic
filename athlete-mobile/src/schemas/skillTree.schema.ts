import * as v from "valibot";

const NumericStringSchema = v.pipe(
  v.string(),
  v.regex(/^\d+$/, "Expected numeric string"),
);

const SkillBranchInputSchema = v.object({
  tags: v.array(v.string()),
  levels: v.record(NumericStringSchema, v.object({ exerciseId: v.string() })),
});

export const SkillBranchSchema = v.pipe(
  SkillBranchInputSchema,
  v.transform((input) => ({
    ...input,
    levels: Object.fromEntries(
      Object.entries(input.levels).map(([key, value]) => [Number(key), value]),
    ) as Record<number, { exerciseId: string }>,
  })),
);
export type SkillBranchType = v.InferOutput<typeof SkillBranchSchema>;

export const SkillTreeSchema = v.record(v.string(), SkillBranchSchema);
export type SkillTreeType = v.InferOutput<typeof SkillTreeSchema>;
