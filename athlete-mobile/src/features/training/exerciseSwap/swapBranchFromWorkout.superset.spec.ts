import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import type { Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { Logger } from "@/services/Logger";
import { deepFreeze } from "@test/factories/deepFreeze";
import { generateTreeCatalogEntry } from "@test/factories/skillCatalog";
import { generateOneExerciseBranch } from "@test/factories/skillTree";
import { generateStoredBranch } from "@test/factories/storedBranch";
import {
  listEntriesOfBranch,
  listSetsOfBranch,
} from "@test/factories/swapSession";
import {
  generatePlanDaySwapWorkout,
  generateSyntheticExerciseCatalog,
  generateSyntheticInput,
  generateSyntheticSkillTrees,
} from "@test/factories/swapWorkout";
import {
  generateBranchesBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import {
  generatePlainExercises,
  generateTaggedExercise,
} from "@test/factories/valueExercise";
import { swapBranchFromWorkout } from "./swapWorkout";

/**
 * Builds the exercise catalog of the warm up cases: the synthetic catalog plus
 * the weighted exercises eWeightedA, eWeightedB and the plain exercises
 * ePlainA to ePlainC, e.g.
 * generateWarmUpExerciseCatalog().find(({ id }) => id === "eWeightedA")
 * → { id: "eWeightedA", tags: ["SIDE_BOTH", "EQ_TYPE_WEIGHTS"], ... }.
 */
const generateWarmUpExerciseCatalog = () => [
  ...generateSyntheticExerciseCatalog(),
  generateTaggedExercise("eWeightedA", ["SIDE_BOTH", "EQ_TYPE_WEIGHTS"]),
  generateTaggedExercise("eWeightedB", ["SIDE_BOTH", "EQ_TYPE_WEIGHTS"]),
  ...generatePlainExercises(),
];

/**
 * Builds the skill trees of the warm up cases: the synthetic trees plus T_S
 * with the weighted branches 98301 (eWeightedA), 98304 (eWeightedB) and the
 * plain branches 98302, 98303, 98305, e.g. generateWarmUpSkillTrees().T_S["98301"]
 * → { tags: ["SIDE_BOTH", "EQ_TYPE_WEIGHTS"], levels: { 1: { exerciseId: "eWeightedA" }, ... } }.
 */
const generateWarmUpSkillTrees = (): Record<string, SkillTreeType> => ({
  ...generateSyntheticSkillTrees(),
  T_S: {
    "98301": generateOneExerciseBranch("eWeightedA", [
      "SIDE_BOTH",
      "EQ_TYPE_WEIGHTS",
    ]),
    "98302": generateOneExerciseBranch("ePlainA"),
    "98303": generateOneExerciseBranch("ePlainB"),
    "98304": generateOneExerciseBranch("eWeightedB", [
      "SIDE_BOTH",
      "EQ_TYPE_WEIGHTS",
    ]),
    "98305": generateOneExerciseBranch("ePlainC"),
  },
});

/**
 * Builds the input of the warm up cases: the synthetic input over the warm up
 * exercises and trees, with the skill SWR that reads the tree T_S, e.g.
 * generateWarmUpInput().skillCatalog.SWR
 * → { skillTree: { withWeights: ["T_S"], ... }, sets: 2, superset: "none", ... }.
 */
const generateWarmUpInput = (
  skillTrees: Record<string, SkillTreeType>,
): GenerationInput => {
  const input = generateSyntheticInput({
    exerciseCatalog: generateWarmUpExerciseCatalog(),
    skillTrees,
  });
  return {
    ...input,
    skillCatalog: {
      ...input.skillCatalog,
      SWR: generateTreeCatalogEntry({
        skillTree: { withWeights: ["T_S"], withoutWeights: ["T_S"] },
      }),
    },
  };
};

/**
 * Builds the plan day of one SWR block that pairs the given branches in draw
 * order with two sets, e.g. generateSwrDay(["98301", "98302"])
 * → { blocks: [{ kind: "branches", skill: "SWR", branches: ["98301", "98302"], superset: "drawOrder", sets: 2 }] }.
 */
const generateSwrDay = (branches: string[]): Template =>
  generateTemplate([
    generateBranchesBlock("SWR", branches, {
      duration: undefined,
      superset: "drawOrder",
      sets: 2,
    }),
  ]);

describe("swapBranchFromWorkout: warm up set of a superset", () => {
  // Branch 98301 trains a weighted exercise, so the pair of 98301 and 98302
  // opens with a warm up set: one more set than the block asks for.
  it("gives the second exercise of a pair the warm up set of its weighted partner", () => {
    const skillTrees = generateWarmUpSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateSwrDay(["98301", "98302"]),
      generateWarmUpInput(skillTrees),
      skillTrees,
    );

    const swapped = swapBranchFromWorkout(
      workout,
      "98302",
      generateStoredBranch("98303", [], "ePlainB"),
    );

    expect(listSetsOfBranch(swapped ?? [], "98303")).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  // The first swap moves the weighted partner 98301 to the weighted branch
  // 98304, which the plan day does not list.
  it("follows the current exercise of a partner that was swapped earlier", () => {
    const skillTrees = generateWarmUpSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateSwrDay(["98301", "98302"]),
      generateWarmUpInput(skillTrees),
      skillTrees,
    );
    const partnerSwapped =
      swapBranchFromWorkout(
        workout,
        "98301",
        generateStoredBranch(
          "98304",
          ["SIDE_BOTH", "EQ_TYPE_WEIGHTS"],
          "eWeightedB",
        ),
      ) ?? [];

    const swapped = swapBranchFromWorkout(
      { ...workout, session: partnerSwapped },
      "98302",
      generateStoredBranch("98303", [], "ePlainB"),
    );

    expect(listSetsOfBranch(swapped ?? [], "98303")).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it("rejects a weighted alternative next to an unweighted partner", () => {
    const skillTrees = generateWarmUpSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateSwrDay(["98302", "98305"]),
      generateWarmUpInput(skillTrees),
      skillTrees,
    );
    const sessionBefore = workout.session.map((entry) => ({ ...entry }));
    deepFreeze(workout.session);

    // the weighted alternative would add a warm up set to the pair
    const swapped = swapBranchFromWorkout(
      workout,
      "98302",
      generateStoredBranch(
        "98301",
        ["SIDE_BOTH", "EQ_TYPE_WEIGHTS"],
        "eWeightedA",
      ),
    );

    expect(swapped).toBeNull();
    expect(workout.session).toEqual(sessionBefore);
  });

  it("rejects an unweighted alternative for the weighted exercise that caused the warm up set", () => {
    const skillTrees = generateWarmUpSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateSwrDay(["98301", "98302"]),
      generateWarmUpInput(skillTrees),
      skillTrees,
    );
    const sessionBefore = workout.session.map((entry) => ({ ...entry }));
    deepFreeze(workout.session);

    // the plain alternative would remove the warm up set of the pair
    const swapped = swapBranchFromWorkout(
      workout,
      "98301",
      generateStoredBranch("98303", [], "ePlainB"),
    );

    expect(swapped).toBeNull();
    expect(workout.session).toEqual(sessionBefore);
  });
});

describe("swapBranchFromWorkout: superset partner probes", () => {
  it("builds the same entries for a pair with one set per exercise as a generated pair", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const input = generateSyntheticInput();
    const day = generateTemplate([
      generateBranchesBlock("SYN", ["98001", "98002"], {
        superset: "drawOrder",
        sets: 1,
        duration: undefined,
      }),
    ]);
    const referenceDay = generateTemplate([
      generateBranchesBlock("SYN", ["98001", "98003"], {
        superset: "drawOrder",
        sets: 1,
        duration: undefined,
      }),
    ]);
    const workout = generatePlanDaySwapWorkout(day, input, skillTrees);
    const reference = generatePlanDaySwapWorkout(
      referenceDay,
      input,
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98002",
        generateStoredBranch("98003", [], "161"),
      ) ?? [];

    expect(listEntriesOfBranch(swapped, "98003")).toEqual(
      listEntriesOfBranch(reference.session, "98003"),
    );
  });

  // The generator writes all sets of one pair before the next pair, so a
  // generated session never interleaves three branches of a skill.
  it("swaps each branch of a block with four branches without a partner error", () => {
    const skillTrees = {
      ...generateSyntheticSkillTrees(),
      SYN: {
        ...generateSyntheticSkillTrees().SYN,
        "98005": generateOneExerciseBranch("164"),
      },
    };
    const input = generateSyntheticInput({
      skillTrees,
      exerciseCatalog: [
        ...generateSyntheticExerciseCatalog(),
        ...generatePlainExercises(),
      ],
    });
    const trained = ["98001", "98002", "98003", "98005"];
    const day = generateTemplate([
      generateBranchesBlock("SYN", trained, {
        superset: "drawOrder",
        sets: 2,
        duration: undefined,
      }),
    ]);
    const workout = generatePlanDaySwapWorkout(day, input, skillTrees);
    const alternatives = [
      generateStoredBranch("98010", [], "eCardioA"),
      generateStoredBranch("98011", [], "eCardioB"),
      generateStoredBranch("98012", [], "ePlainA"),
      generateStoredBranch("98013", [], "ePlainB"),
    ];
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const swapped = trained.map((target, index) =>
      swapBranchFromWorkout(workout, target, alternatives[index]),
    );

    expect([
      swapped.map((session) => session !== null),
      logError.mock.calls.length,
    ]).toEqual([[true, true, true, true], 0]);
    logError.mockRestore();
  });
});
