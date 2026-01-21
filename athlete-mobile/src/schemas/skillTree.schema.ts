import * as v from "valibot";

const NumericStringSchema = v.pipe(
  v.string(),
  v.regex(/^\d+$/, "Expected numeric string"),
);

export const SkillBranchSchema = v.object({
  tags: v.array(v.string()),
  levels: v.record(NumericStringSchema, v.object({ id: v.string() })),
});
export type SkillBranchType = v.InferOutput<typeof SkillBranchSchema>;

export const SkillTreeSchema = v.record(v.string(), SkillBranchSchema);
export type SkillTreeType = v.InferOutput<typeof SkillTreeSchema>;
