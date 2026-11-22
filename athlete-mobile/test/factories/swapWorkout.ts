import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import {
  setUpSwapWorkout,
  type SwapWorkout,
} from "@/features/training/exerciseSwap/swapWorkout";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import type { InterpretedWorkout } from "@/features/training/workoutGenerator/stages/blockWalk";
import {
  readTrainingDayWorkout,
  type TrainingDay,
} from "@/features/training/workoutGenerator/trainingDayWorkout";
import type { WorkoutFilters } from "@/features/training/workoutGenerator/workoutFilters";
import { generateFinishedWorkout } from "@/features/training/workoutGenerator/workoutGeneration";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";
import { toUserExerciseDataList } from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  generateGenerationInput,
  type GenerationInputFactoryOptions,
} from "./generationInput";
import { generateTreeCatalogEntry } from "./skillCatalog";
import { generateOneExerciseBranch } from "./skillTree";
import { generateBranchesBlock, generateTemplate } from "./templateBlock";
import {
  generateLowerBodyExercises,
  generateTaggedExercise,
} from "./valueExercise";

/**
 * Builds the bundled exercises plus synthetic ones: a one sided exercise
 * "eLeft" with the other side "eRight", and the cardio exercises "eCardioA"
 * and "eCardioB", e.g. generateSyntheticExerciseCatalog().at(-1)
 * → { id: "eCardioB", tags: ["SIDE_BOTH"], ... }.
 */
export const generateSyntheticExerciseCatalog = () => [
  ...loadExercises(),
  generateTaggedExercise("eLeft", ["SIDE_ONE"], {
    otherSideExerciseId: "eRight",
  }),
  generateTaggedExercise("eRight", ["SIDE_ONE"]),
  generateTaggedExercise("eCardioA", ["SIDE_BOTH"]),
  generateTaggedExercise("eCardioB", ["SIDE_BOTH"]),
];

/**
 * Builds the bundled skill trees plus SYN with the branches 98001 to 98003
 * (exercises 114, 115, 161), SYN2 with 98101, 98201 (exercise 164), all with
 * the given tags. Each tree is named after its skill, because the alternative
 * listing reads the tree by skill name, e.g. generateSyntheticSkillTrees().SYN2
 * → { "98101": { tags: ["SIDE_BOTH"], levels: { 1: { exerciseId: "164" }, ... } }, "98201": ... }.
 */
export const generateSyntheticSkillTrees = (
  tags: string[] = ["SIDE_BOTH"],
): Record<string, SkillTreeType> => ({
  ...getAllSkillTrees(),
  SYN: {
    "98001": generateOneExerciseBranch("114", tags),
    "98002": generateOneExerciseBranch("115", tags),
    "98003": generateOneExerciseBranch("161", tags),
  },
  SYN2: {
    "98101": generateOneExerciseBranch("164", tags),
    "98201": generateOneExerciseBranch("164", tags),
  },
});

/**
 * Builds a skill catalog of the skill SYN that reads the tree SYN, and the
 * skills SYN2 and MOB that read the tree SYN2, e.g.
 * generateSyntheticSkillCatalog().SYN2
 * → { skillTree: { withWeights: ["SYN2"], ... }, countBy: "entries", sets: 2, ... }.
 */
export const generateSyntheticSkillCatalog = () => ({
  SYN: generateTreeCatalogEntry({
    skillTree: { withWeights: ["SYN"], withoutWeights: ["SYN"] },
  }),
  SYN2: generateTreeCatalogEntry({
    skillTree: { withWeights: ["SYN2"], withoutWeights: ["SYN2"] },
  }),
  MOB: generateTreeCatalogEntry({
    skillTree: { withWeights: ["SYN2"], withoutWeights: ["SYN2"] },
  }),
});

/**
 * Builds a generation input over the synthetic exercises, trees and skill
 * catalog that draws the first option, e.g. generateSyntheticInput({ pains: ["KNEE_LEFT"] })
 * → { athlete: { ... PAIN: ["KNEE_LEFT"] }, skillCatalog: { SYN, SYN2, MOB }, ... }.
 */
export const generateSyntheticInput = (
  options: GenerationInputFactoryOptions = {},
): GenerationInput => ({
  ...generateGenerationInput({
    exerciseCatalog: generateSyntheticExerciseCatalog(),
    random: () => 0,
    skillTrees: generateSyntheticSkillTrees(),
    ...options,
  }),
  skillCatalog: generateSyntheticSkillCatalog(),
});

/**
 * Builds the generation input of a beginner whose catalog contains the lower
 * body exercises e1 to e9, with the skill SYN that reads the tree T_A, e.g.
 * generatePicksGenerationInput().skillCatalog
 * → { SYN: { skillTree: { withoutWeights: ["T_A"], ... }, ... } }.
 */
export const generatePicksGenerationInput = (): GenerationInput => ({
  ...generateGenerationInput({
    level: "BEGINNER",
    exerciseCatalog: generateLowerBodyExercises([
      "e1",
      "e2",
      "e3",
      "e4",
      "e5",
      "e6",
      "e7",
      "e8",
      "e9",
    ]),
    random: () => 0,
  }),
  skillCatalog: { SYN: generateTreeCatalogEntry() },
});

/**
 * Builds the AIWL plan day of the ADR example: SYN trains the branches 98001
 * and 98002, SYN2 trains 98101, e.g. generateAdrPlanDay().blocks[0].branches
 * → ["98001", "98002"].
 */
export const generateAdrPlanDay = (): Template =>
  generateTemplate([
    generateBranchesBlock("SYN", ["98001", "98002"], { duration: undefined }),
    generateBranchesBlock("SYN2", ["98101"], { duration: undefined }),
  ]);

interface SwapWorkoutParts {
  workout: InterpretedWorkout;
  session: readonly UserExerciseDataType[];
  input: GenerationInput;
  skillTrees: Record<string, SkillTreeType>;
  /** The filters of the workout kind; every filter applies when omitted. */
  filters?: Partial<WorkoutFilters>;
}

/**
 * Builds the swap workout of a session and the workout behind it: the session,
 * the workout and the input that workout setup derives from it, e.g.
 * generateSwapWorkout({ workout, session, input, skillTrees })
 * → { session: [{ branchId: "98001", ... }], workout, input: { ..., picksWorkout, filters } }.
 */
export const generateSwapWorkout = ({
  workout,
  session,
  input,
  skillTrees,
  filters = {},
}: SwapWorkoutParts): SwapWorkout => ({
  session,
  ...setUpSwapWorkout({ workout, filters }, input, skillTrees),
});

/**
 * Builds the swap workout of a plan day: the session the day generates with
 * every filter on, and the workout the day reads as, e.g.
 * generatePlanDaySwapWorkout(day, input, trees)
 * → { session: [{ branchId: "98001", ... }, ...], workout: { blocks: [...] }, input: { ..., picksWorkout } }.
 */
export const generatePlanDaySwapWorkout = (
  day: TrainingDay,
  input: GenerationInput,
  skillTrees: Record<string, SkillTreeType>,
): SwapWorkout => {
  const { workout, lookUpBranch } = readTrainingDayWorkout(day);
  return generateSwapWorkout({
    workout,
    session: toUserExerciseDataList(
      generateFinishedWorkout(workout, lookUpBranch, input, { skillTrees })
        .setList,
    ),
    input,
    skillTrees,
  });
};

/**
 * Builds the swap workout of a short workout: the session the template draws
 * with the short workout filters unless others are given, and the same template
 * object as workout, e.g. generateShortWorkout(template, input, trees)
 * → { session: [{ branchId: "98001", ... }, ...], workout: template, input: { ..., picksWorkout } }.
 */
export const generateShortWorkout = (
  template: Template,
  input: GenerationInput,
  skillTrees: Record<string, SkillTreeType>,
  filters: Partial<WorkoutFilters> = SHORT_WORKOUT_FILTERS,
): SwapWorkout =>
  generateSwapWorkout({
    workout: template,
    session: toUserExerciseDataList(
      generateFinishedWorkout(template, lookUpStoredBranchInCatalog, input, {
        skillTrees,
        filters,
      }).setList,
    ),
    input,
    skillTrees,
    filters,
  });
