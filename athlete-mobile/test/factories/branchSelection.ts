import type { PlanGenerationInput } from "@/features/training/planGenerator/planGenerationInput/planGenerationInput";
import type { SkillSelectionRequest } from "@/features/training/planGenerator/stages/branchSelection";
import type {
  DirectionEntry,
  DirectionsByRegion,
  RegionTagEntry,
} from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { PlacesData } from "@/store/placesStore";
import { deepFreeze } from "./deepFreeze";
import { generatePlanGenerationInput } from "./planGenerationInput";
import { generateSequenceRandom } from "./sequenceRandom";
import { generateTreeBranch } from "./skillTree";
import { generateTaggedExercise } from "./valueExercise";

export interface BranchSelectionInputOptions {
  skillTrees: Record<string, SkillTreeType>;
  /** The draws in order; the source throws once they run out. */
  draws: number[];
  /** Exercises tagged SIDE_ONE; every other exercise is SIDE_BOTH. */
  oneSidedExerciseIds?: string[];
  movementDirections?: Partial<DirectionsByRegion>;
  trainingPlaces?: Partial<PlacesData>;
}

const NO_MOVEMENT_DIRECTIONS: DirectionsByRegion = {
  CORE: {},
  FULL_BODY: {},
  LOWER_BODY: {},
  LOWER_BODY_GKS: {},
  UPPER_BODY: {},
};

const NO_EQUIPMENT_PLACES: PlacesData = {
  HOME: { equipment: [] },
  STUDIO: { equipment: [] },
  HALL: { equipment: [] },
  OUTSIDE: { equipment: [] },
};

const listExerciseIds = (skillTrees: Record<string, SkillTreeType>) => [
  ...new Set(
    Object.values(skillTrees).flatMap((tree) =>
      Object.values(tree).flatMap(({ levels }) =>
        Object.values(levels).map(({ exerciseId }) => exerciseId),
      ),
    ),
  ),
];

/**
 * Builds a plan generation input whose authored data holds only the given
 * skill trees, one catalog exercise per exercise ID of the trees, and the
 * given movement direction configurations, deep frozen. The places hold no
 * equipment unless overridden, and the random source returns the draws in
 * order.
 *
 * generateBranchSelectionInput({ skillTrees: { BAS: { a: <a> } }, draws: [0, 0] })
 * → { ..., authoredData: { ..., skillTrees: { BAS: ... }, exerciseCatalog: [<a, SIDE_BOTH>] },
 *     trainingPlaces: { HOME: { equipment: [] }, ... }, random: 0, 0, then throws }
 */
export const generateBranchSelectionInput = ({
  skillTrees,
  draws,
  oneSidedExerciseIds = [],
  movementDirections = {},
  trainingPlaces = {},
}: BranchSelectionInputOptions): PlanGenerationInput => {
  const input = generatePlanGenerationInput();
  return {
    ...input,
    authoredData: {
      ...input.authoredData,
      skillTrees,
      exerciseCatalog: listExerciseIds(skillTrees).map((id) =>
        generateTaggedExercise(id, [
          oneSidedExerciseIds.includes(id) ? "SIDE_ONE" : "SIDE_BOTH",
        ]),
      ),
      movementDirections: deepFreeze({
        ...NO_MOVEMENT_DIRECTIONS,
        ...movementDirections,
      }),
    },
    trainingPlaces: { ...NO_EQUIPMENT_PLACES, ...trainingPlaces },
    random: generateSequenceRandom(draws),
  };
};

/**
 * Builds branches whose only level holds the exercise named like the branch.
 *
 * generateSelectionBranches({ a: ["REGION_CORE"] })
 * → { a: { tags: ["REGION_CORE"], levels: { 1: { exerciseId: "a" } } } }
 */
export const generateSelectionBranches = (
  tagsById: Record<string, string[]>,
): SkillTreeType =>
  Object.fromEntries(
    Object.entries(tagsById).map(([id, tags]) => [
      id,
      generateTreeBranch([id], tags),
    ]),
  );

/**
 * Builds the request of one skill with one tag entry.
 *
 * generateSkillSelectionRequest("BAS", ["REGION_CORE"], 2)
 * → { skill: "BAS", tagEntries: [{ tags: ["REGION_CORE"], count: 2 }] }
 */
export const generateSkillSelectionRequest = (
  skill: string,
  tags: string[],
  count: number,
): SkillSelectionRequest => ({ skill, tagEntries: [{ tags, count }] });

/**
 * Builds a request of one skill with the given tag entries.
 *
 * generateMultiEntryRequest("BAS", [{ tags: ["REGION_CORE"], count: 1 }])
 * → { skill: "BAS", tagEntries: [{ tags: ["REGION_CORE"], count: 1 }] }
 */
export const generateMultiEntryRequest = (
  skill: string,
  tagEntries: RegionTagEntry[],
): SkillSelectionRequest => ({ skill, tagEntries });

/**
 * Builds a movement direction priority sequence of two-sided entries for the
 * given exercise count.
 *
 * generateDirectionSequence(2, ["VERTICAL_PULL", "HORIZONTAL_PUSH"])
 * → { "2": [{ direction: "VERTICAL_PULL", side: "BOTH" }, { direction: "HORIZONTAL_PUSH", side: "BOTH" }] }
 */
export const generateDirectionSequence = (
  count: number,
  directions: NonNullable<DirectionEntry["direction"]>[],
): Record<string, DirectionEntry[]> => ({
  [String(count)]: directions.map((direction) => ({
    direction,
    side: "BOTH",
  })),
});
