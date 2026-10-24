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

export interface GenerationInput {
  readonly athlete: UserType;
  readonly place: string;
  readonly equipment: readonly string[];
  readonly muscleSoreness: readonly TemporalDataType[];
  readonly skillCatalog: SkillCatalog;
  readonly branchLookupIndex: BranchLookupIndex;
  readonly exerciseCatalog: readonly ExerciseType[];
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
}

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
}: GenerationInputOptions): GenerationInput =>
  Object.freeze({
    athlete,
    place,
    equipment: Object.freeze([...equipment]),
    muscleSoreness: Object.freeze(getTemporalData(athlete)),
    skillCatalog: loadSkillCatalog(),
    branchLookupIndex,
    exerciseCatalog,
    exerciseData,
    random,
  });
