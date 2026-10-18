import * as v from "valibot";

export const TutorialSchema = v.strictObject({
  ordering: v.pipe(v.number(), v.integer()),
  // A default text plus optional translations keyed by language code.
  title: v.objectWithRest({ default: v.string() }, v.string()),
  picture: v.string(),
  video: v.string(),
});
export type Tutorial = v.InferOutput<typeof TutorialSchema>;

export const TutorialsFileSchema = v.array(TutorialSchema);
export type TutorialsFile = v.InferOutput<typeof TutorialsFileSchema>;
