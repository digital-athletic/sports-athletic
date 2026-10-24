import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { TemporalDataType } from "@/features/training/models/TemporalData";
import { getTemporalData } from "@/features/training/utils/userDataUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserExerciseDataMapType } from "@/schemas/generator.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import type { UserType } from "@/schemas/user.schema";
import {
  type BranchLookupIndex,
  loadBranchLookupIndex,
} from "./branchLookupIndex";

// The lists keep the mutable array types the shared filters and builders take,
// so stages pass them straight through. Freezing guards them at runtime.
export interface GenerationInput {
  readonly athlete: UserType;
  readonly place: string;
  readonly equipment: string[];
  readonly muscleSoreness: TemporalDataType[];
  readonly skillCatalog: SkillCatalog;
  readonly branchLookupIndex: BranchLookupIndex;
  readonly exerciseCatalog: ExerciseType[];
  readonly exerciseData: UserExerciseDataMapType;
  readonly random: () => number;
}

export interface GenerationInputOptions {
  athlete: UserType;
  place: string;
  equipment: readonly string[];
  exerciseCatalog: readonly ExerciseType[];
  exerciseData: UserExerciseDataMapType;
  random?: () => number;
  branchLookupIndex?: BranchLookupIndex;
  skillCatalog?: SkillCatalog;
}

const createFrozenListCopy = <T>(list: readonly T[]): T[] => {
  const copy = [...list];
  Object.freeze(copy);
  return copy;
};

/**
 * Collects every input the generator stages read into one frozen object.
 * Tests pass a fixed random source; the app draws through Math.random.
 */
export const createGenerationInput = ({
  athlete,
  place,
  equipment,
  exerciseCatalog,
  exerciseData,
  random = Math.random,
  branchLookupIndex = loadBranchLookupIndex(),
  skillCatalog = loadSkillCatalog(),
}: GenerationInputOptions): GenerationInput =>
  Object.freeze({
    athlete,
    place,
    equipment: createFrozenListCopy(equipment),
    muscleSoreness: createFrozenListCopy(getTemporalData(athlete)),
    skillCatalog,
    branchLookupIndex,
    exerciseCatalog: createFrozenListCopy(exerciseCatalog),
    exerciseData,
    random,
  });
