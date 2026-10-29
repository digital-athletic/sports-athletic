import type { ExerciseProgressMapType } from "@/features/training/models/ExerciseProgress";
import { buildBranchLookupIndex } from "@/features/training/workoutGenerator/generationInput/branchLookupIndex";
import {
  createGenerationInput,
  type GenerationInput,
} from "@/features/training/workoutGenerator/generationInput/generationInput";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import { type AthleteOptions, generateAthlete } from "./athlete";

export interface GenerationInputFactoryOptions extends AthleteOptions {
  place?: string;
  equipment?: string[];
  exerciseCatalog?: ExerciseType[];
  /** The athlete's own level per branch ID, as stored branch data. */
  branchLevels?: Record<string, number>;
  /** The athlete's stored exercise data per exercise ID. */
  exerciseData?: ExerciseProgressMapType;
  /** Limits the branch lookup index to these skill trees. */
  skillTrees?: Record<string, SkillTreeType>;
  random?: () => number;
}

/**
 * Builds the athlete's stored level of one branch.
 *
 * generateBranchLevel("253", 4) → { branchId: "253", level: 4 }
 */
export const generateBranchLevel = (branchId: string, level: number) => ({
  branchId,
  level,
});

/**
 * Builds the stored branch data of an athlete from a level per branch ID.
 *
 * generateBranchData({ "510": 1 }) → { "510": { branchId: "510", level: 1 } }
 */
const generateBranchData = (
  branchLevels: Record<string, number>,
): BranchDataMapType =>
  Object.fromEntries(
    Object.entries(branchLevels).map(([branchId, level]) => [
      branchId,
      generateBranchLevel(branchId, level),
    ]),
  );

/**
 * Builds a generation input. The default athlete is an adult man at fitness
 * level ADVANCED without pains, muscle soreness or branch data, training in a
 * studio without equipment, and draws through Math.random.
 *
 * generateGenerationInput({ soreMuscles: ["CHEST"], branchLevels: { "510": 1 }, random: () => 0 })
 * → { athlete: { personalData: { gender: "MALE", birthday: "1990-06-15" },
 *       workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: [] } },
 *       temporalData: [{ tag: "CHEST", ... }] },
 *     place: "STUDIO", equipment: [], exerciseCatalog: [],
 *     exerciseData: { exerciseData: {}, branchData: { "510": { branchId: "510", level: 1 } } },
 *     random: () => 0, ... }
 */
export const generateGenerationInput = ({
  place = "STUDIO",
  equipment = [],
  exerciseCatalog = [],
  branchLevels = {},
  exerciseData = {},
  skillTrees,
  random,
  ...athleteOptions
}: GenerationInputFactoryOptions = {}): GenerationInput =>
  createGenerationInput({
    branchLookupIndex: skillTrees && buildBranchLookupIndex(skillTrees),
    athlete: generateAthlete(athleteOptions),
    place,
    equipment,
    exerciseCatalog,
    exerciseData: {
      exerciseData,
      branchData: generateBranchData(branchLevels),
    },
    random,
  });
