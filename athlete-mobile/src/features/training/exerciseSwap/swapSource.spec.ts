import { loadExercises } from "@/data/loadExercises";
import { loadTemplates } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { TrainingType } from "@/features/training/models/Training";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import { generateTrainingDaySetList } from "@/features/training/workoutGenerator/trainingDayWorkout";
import { generateSetList } from "@/features/training/workoutGenerator/workoutGeneration";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import {
  toUserExerciseData,
  toUserExerciseDataList,
} from "@/schemas/generator.schema";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { generateTreeCatalogEntry } from "@test/factories/skillCatalog";
import { generateSkillBranch } from "@test/factories/skillTree";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
  generateTemplate,
} from "@test/factories/templateBlock";
import { findNextSwap } from "./exerciseSwap";
import {
  createPlanSwapSource,
  createShortWorkoutSwapSource,
  supportsExerciseSwap,
} from "./swapSource";

/**
 * Lists the distinct real branch IDs of entries in order, without pauses,
 * e.g. entries of branches "98001", "-1", "98101" → ["98001", "98101"].
 */
const listTrainedBranchIds = (
  entries: readonly { branchId?: string }[],
): string[] => [
  ...new Set(
    entries.flatMap(({ branchId }) =>
      branchId && !isPlaceholderBranch(branchId) ? [branchId] : [],
    ),
  ),
];

/**
 * Builds a bodyweight branch that trains one catalog exercise on every level,
 * e.g. generateSyntheticBranch("114")
 * → { tags: ["SIDE_BOTH"], levels: { 1: { exerciseId: "114" }, 2: ..., 3: ... } }.
 */
const generateSyntheticBranch = (exerciseId: string) =>
  generateSkillBranch(["SIDE_BOTH"], {
    1: { exerciseId },
    2: { exerciseId },
    3: { exerciseId },
  });

/**
 * Builds a skill catalog of the skill SYN that reads the tree T_A and the
 * skill SYN2 that reads the tree T_B, e.g. generateSyntheticSkillCatalog().SYN2
 * → { skillTree: { withoutWeights: ["T_B"], ... }, countBy: "entries", ... }.
 */
const generateSyntheticSkillCatalog = () => ({
  SYN: generateTreeCatalogEntry(),
  SYN2: generateTreeCatalogEntry({
    skillTree: { withWeights: ["T_B"], withoutWeights: ["T_B"] },
  }),
});

describe("swapSource: supportsExerciseSwap", () => {
  it.each<[string, TrainingType, boolean, boolean]>([
    ["a plan training with a training plan", "PLAN", true, true],
    ["a plan training without a training plan", "PLAN", false, false],
    ["the strength test", "TEST_WORKOUT", true, false],
    ["a short workout without a training plan", "MOB", false, true],
  ])("returns the answer for %s", (_label, type, hasTrainingPlan, expected) => {
    expect(supportsExerciseSwap(type, hasTrainingPlan)).toBe(expected);
  });
});

describe("swapSource: createShortWorkoutSwapSource", () => {
  it("lists a swap for each exercise with alternatives and generates the workout with the alternative", () => {
    const skillTrees = {
      ...getAllSkillTrees(),
      T_A: {
        "98001": generateSyntheticBranch("114"),
        "98002": generateSyntheticBranch("115"),
        "98003": generateSyntheticBranch("161"),
      },
      T_B: { "98101": generateSyntheticBranch("164") },
    };
    const input = {
      ...generateGenerationInput({
        exerciseCatalog: loadExercises(),
        random: () => 0,
        skillTrees,
      }),
      skillCatalog: generateSyntheticSkillCatalog(),
    };
    const template = generateShortTemplate([
      generatePicksBlock("SYN"),
      generatePicksBlock("SYN2"),
    ]);
    const session = toUserExerciseDataList(
      generateSetList(template, lookUpStoredBranchInCatalog, input, {
        skillTrees,
        filters: SHORT_WORKOUT_FILTERS,
      }),
    );

    const source = createShortWorkoutSwapSource(
      template,
      input,
      skillTrees,
      session,
    );
    const swapped = source.generateSwapped(
      "SYN",
      "98001",
      source.swaps["98001"].alternatives[0],
    );

    // Branch 98101 is the only branch of its tree, so it gets no swap.
    expect(source.swaps).toEqual({
      "98001": {
        skill: "SYN",
        position: 0,
        alternatives: [
          expect.objectContaining({ branchId: "98002" }),
          expect.objectContaining({ branchId: "98003" }),
        ],
        originalEntries: session.filter(({ branchId }) => branchId === "98001"),
      },
    });
    expect(listTrainedBranchIds(swapped)).toEqual(["98002", "98101"]);
  });

  it("lists swaps for the branch of a branches block", () => {
    const input = generateGenerationInput({
      exerciseCatalog: loadExercises(),
      equipment: ["DUMBBELL", "BARBELL", "TREADMILL"],
      random: () => 0,
    });
    const skillTrees = getAllSkillTrees();
    const template = generateShortTemplate([
      generateBranchesBlock("GKS", ["510"], { duration: undefined }),
    ]);
    const session = toUserExerciseDataList(
      generateSetList(template, lookUpStoredBranchInCatalog, input, {
        skillTrees,
        filters: SHORT_WORKOUT_FILTERS,
      }),
    );

    const { swaps } = createShortWorkoutSwapSource(
      template,
      input,
      skillTrees,
      session,
    );

    expect(swaps["510"].alternatives.length).toBeGreaterThan(0);
  });

  // Pins the bundled PREVKNEE template, skill trees and exercises: a data
  // change fails this case without a logic regression.
  it("moves every exercise of the knee prevention training to its first alternative", () => {
    const template = loadTemplates().PREVKNEE;
    const skillTrees = getAllSkillTrees();
    const input = generateGenerationInput({
      exerciseCatalog: loadExercises(),
      equipment: ["DUMBBELL", "BARBELL", "BENCH", "FOAM_ROLLER", "TOWEL"],
      random: generateSeededRandom(1),
    });
    const session = toUserExerciseDataList(
      generateSetList(template, lookUpStoredBranchInCatalog, input, {
        skillTrees,
        filters: SHORT_WORKOUT_FILTERS,
      }),
    );
    const source = createShortWorkoutSwapSource(
      template,
      input,
      skillTrees,
      session,
    );

    const moves = Object.entries(source.swaps).map(([original, swap]) => {
      const next = findNextSwap({
        session,
        original,
        swap,
        generateWith: (alternative) =>
          source.generateSwapped(swap.skill, original, alternative),
      });
      const branchIds = listTrainedBranchIds(next?.session ?? []);
      return {
        original,
        position: next?.position,
        holdsAlternative: branchIds.includes(swap.alternatives[0].branchId),
        holdsOriginal: branchIds.includes(original),
      };
    });

    // Object keys that are integers list in ascending order, not session order
    expect(moves.map(({ original }) => original).sort()).toEqual(
      listTrainedBranchIds(session).sort(),
    );
    expect(moves).toEqual(
      moves.map(({ original }) => ({
        original,
        position: 1,
        holdsAlternative: true,
        holdsOriginal: false,
      })),
    );
  });
});

describe("swapSource: createPlanSwapSource", () => {
  const generatePlanInput = () =>
    generateGenerationInput({
      exerciseCatalog: loadExercises(),
      // the place holds weights, so GKS draws alternatives from its own tree
      equipment: ["DUMBBELL", "BARBELL", "TREADMILL"],
      random: () => 0,
    });

  it("lists a swap for a planned branch and generates the day with the alternative", () => {
    const input = generatePlanInput();
    const day = generateTemplate([
      generateBranchesBlock("GKS", ["510"], { duration: 600 }),
      generateBranchesBlock("CARDIO_5", ["576"], { duration: 1500 }),
    ]);
    const session = generateTrainingDaySetList(
      day,
      input,
      getAllSkillTrees(),
    ).map(toUserExerciseData);

    const source = createPlanSwapSource(
      day,
      input,
      getAllSkillTrees(),
      session,
    );
    const [alternative] = source.swaps["510"].alternatives;
    const swapped = source.generateSwapped("GKS", "510", alternative);

    expect(source.swaps["510"]).toMatchObject({
      skill: "GKS",
      position: 0,
      originalEntries: session.filter(({ branchId }) => branchId === "510"),
    });
    expect(listTrainedBranchIds(swapped)).toEqual([
      alternative.branchId,
      "576",
    ]);
  });
});
