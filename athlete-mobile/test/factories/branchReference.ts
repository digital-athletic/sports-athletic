import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  generateAuthoredValues,
  generateTaggedExercise,
} from "./valueExercise";

/**
 * Builds a two sided branch reference with the exercise ID `e<id>`, unless
 * the exercise ID is given.
 *
 * generateBranchReference("c", ["MUSCLE_CHEST"])
 * → { branchId: "c", exerciseId: "ec", branchTags: ["SIDE_BOTH", "MUSCLE_CHEST"] }
 */
export const generateBranchReference = (
  id: string,
  tags: string[] = [],
  exerciseId = `e${id}`,
): BranchExerciseReference => ({
  branchId: id,
  exerciseId,
  branchTags: ["SIDE_BOTH", ...tags],
});

/**
 * Builds a one sided branch reference: the two sided reference with the tag
 * SIDE_ONE in place of SIDE_BOTH.
 *
 * generateOneSidedReference("lunge", ["MUSCLE_QUADRICEPS"])
 * → { branchId: "lunge", exerciseId: "elunge", branchTags: ["SIDE_ONE", "MUSCLE_QUADRICEPS"] }
 */
export const generateOneSidedReference = (
  id: string,
  tags: string[] = [],
): BranchExerciseReference => {
  const reference = generateBranchReference(id, tags);
  return { ...reference, branchTags: ["SIDE_ONE", ...tags] };
};

/**
 * References a branch of a self named tree by its ID, which also serves as
 * its exercise ID.
 *
 * generateReferenceFromBranch({ a: { tags: ["SIDE_ONE"], ... } }, "a")
 * → { branchId: "a", branchTags: ["SIDE_ONE"], exerciseId: "a" }
 */
export const generateReferenceFromBranch = (
  branches: SkillTreeType,
  id: string,
): BranchExerciseReference => ({
  branchId: id,
  branchTags: branches[id].tags,
  exerciseId: id,
});

/**
 * Copies a reference as a branch that resolved to no exercise.
 *
 * generateUnresolvedReference(chest)
 * → { branchId: "c", exerciseId: "-1", branchTags: chest.branchTags }
 */
export const generateUnresolvedReference = (
  reference: BranchExerciseReference,
): BranchExerciseReference => ({ ...reference, exerciseId: "-1" });

/**
 * Builds a catalog exercise advanced by repetitions for each reference. The
 * exercise carries the tags of its reference; a one sided one names its other
 * side `<exerciseId>Right`.
 *
 * generateReferenceCatalog([generateOneSidedReference("lunge")])
 * → [{ id: "elunge", tags: ["SIDE_ONE"], otherSideExerciseId: "elungeRight", ... }]
 */
export const generateReferenceCatalog = (
  references: BranchExerciseReference[],
): ExerciseType[] =>
  references.map(({ exerciseId, branchTags }) =>
    generateTaggedExercise(exerciseId, branchTags, {
      otherSideExerciseId: branchTags.includes("SIDE_ONE")
        ? `${exerciseId}Right`
        : undefined,
    }),
  );

/**
 * Builds three upper body references: chest and latissimus (big, opposing)
 * and biceps (small).
 *
 * generateUpperBodyReferences().chest
 * → { branchId: "c", exerciseId: "ec", branchTags: ["SIDE_BOTH", "MUSCLE_CHEST", "REGION_UPPER_BODY"] }
 */
export const generateUpperBodyReferences = () => ({
  chest: generateBranchReference("c", ["MUSCLE_CHEST", "REGION_UPPER_BODY"]),
  latissimus: generateBranchReference("l", [
    "MUSCLE_LATISSIMUS",
    "REGION_UPPER_BODY",
  ]),
  biceps: generateBranchReference("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY"]),
});

/**
 * Builds four bodyweight references: chest twice, biceps (same region as
 * chest) and quadriceps.
 *
 * generateBodyweightReferences().chest
 * → { branchId: "c", exerciseId: "ec",
 *     branchTags: ["SIDE_BOTH", "MUSCLE_CHEST", "REGION_UPPER_BODY", "EQ_TYPE_KG"] }
 */
export const generateBodyweightReferences = () => ({
  chest: generateBranchReference("c", [
    "MUSCLE_CHEST",
    "REGION_UPPER_BODY",
    "EQ_TYPE_KG",
  ]),
  chestAgain: generateBranchReference("c2", [
    "MUSCLE_CHEST",
    "REGION_UPPER_BODY",
    "EQ_TYPE_KG",
  ]),
  biceps: generateBranchReference("b", [
    "MUSCLE_BICEPS",
    "REGION_UPPER_BODY",
    "EQ_TYPE_KG",
  ]),
  quads: generateBranchReference("q", [
    "MUSCLE_QUADRICEPS",
    "REGION_LOWER_BODY",
    "EQ_TYPE_KG",
  ]),
});

/**
 * Builds a weighted chest reference with its catalog exercise, which starts
 * at 40 kg and 10 repetitions.
 *
 * generateWeightedChestReference().reference
 * → { branchId: "w", exerciseId: "ew", branchTags: ["SIDE_BOTH", ..., "EQ_TYPE_WEIGHTS"] }
 */
export const generateWeightedChestReference = () => {
  const reference = generateBranchReference("w", [
    "MUSCLE_CHEST",
    "REGION_UPPER_BODY",
    "EQ_TYPE_WEIGHTS",
  ]);
  const exercise = generateTaggedExercise(
    reference.exerciseId,
    reference.branchTags,
    {
      values: {
        weight: generateAuthoredValues("40", "80"),
        repetition: generateAuthoredValues("10", "15"),
      },
    },
  );
  return { reference, exercise };
};
