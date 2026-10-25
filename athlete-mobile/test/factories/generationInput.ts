import type { LevelTag } from "@/constants/workoutConstants";
import {
  createGenerationInput,
  type GenerationInput,
} from "@/features/training/workoutGenerator/generationInput";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserType } from "@/schemas/user.schema";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";

export interface GenerationInputFactoryOptions {
  level?: LevelTag;
  birthday?: string;
  gender?: "MALE" | "FEMALE";
  pains?: string[];
  soreMuscles?: string[];
  place?: string;
  equipment?: string[];
  exerciseCatalog?: ExerciseType[];
  /** The athlete's own level per branch ID, as stored branch data. */
  branchLevels?: Record<string, number>;
  random?: () => number;
}

type AthleteOptions = Pick<
  GenerationInputFactoryOptions,
  "level" | "birthday" | "gender" | "pains" | "soreMuscles"
>;

/**
 * Builds the athlete of a generation input: an adult man at fitness level
 * ADVANCED without pains or muscle soreness.
 *
 * generateAthlete({ soreMuscles: ["CHEST"] })
 * → { userId: "athlete", personalData: { gender: "MALE", birthday: "1990-06-15" },
 *     workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: [] } },
 *     temporalData: [{ tag: "CHEST", date: "2026-10-24", expiration: "2026-10-25" }] }
 */
const generateAthlete = ({
  level = "ADVANCED",
  birthday = "1990-06-15",
  gender = "MALE",
  pains = [],
  soreMuscles = [],
}: AthleteOptions): UserType => ({
  userId: "athlete",
  personalData: { gender, birthday },
  workoutData: { tags: { LEVEL: [level], PAIN: pains } },
  temporalData: soreMuscles.map((tag) => ({
    tag,
    date: "2026-10-24",
    expiration: "2026-10-25",
  })),
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
      { branchId, level },
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
  random,
  ...athleteOptions
}: GenerationInputFactoryOptions = {}): GenerationInput =>
  createGenerationInput({
    athlete: generateAthlete(athleteOptions),
    place,
    equipment,
    exerciseCatalog,
    exerciseData: {
      exerciseData: {},
      branchData: generateBranchData(branchLevels),
    },
    random,
  });
