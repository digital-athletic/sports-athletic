import * as v from "valibot";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { UserExerciseDataSchema } from "@/schemas/sync.schema";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateEmptyValueExercise } from "@test/factories/valueExercise";
import { generateShortWorkoutFromTemplate } from "./shortWorkoutGeneration";

// The skill catalog carries the per training facts of a template the app code
// has never seen, as a backend sync could deliver it.
jest.mock("../../../../assets/data/generator/skills.json", () => {
  const bundled = jest.requireActual(
    "../../../../assets/data/generator/skills.json",
  );
  return {
    ...bundled,
    PREVHIP: {
      skillTree: {
        withWeights: ["PREV", "PREVKG"],
        withoutWeights: ["PREV", "PREVKG"],
      },
      intensity: "BAS",
      focusArea: "MOBILITY",
      progression: false,
      painRegions: ["KNEE"],
    },
  };
});

const hipTemplate: Template = {
  aiwl: 1,
  id: "PREVHIP",
  name: { en: "Hip prevention", de: "Hüftprävention" },
  blocks: [
    {
      kind: "picks",
      skill: "PREVHIP",
      picks: [{ tags: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"], count: 1 }],
      countBy: "pairs",
      fallbackToWholeTree: false,
      sets: 1,
      rest: { withinSuperset: 30, betweenSets: 60, afterExercise: 60 },
      superset: "drawOrderWithLeftovers",
    },
  ],
};

/**
 * Builds a skill tree of one prevention branch that trains the given exercise.
 *
 * generateHipTree("hip", "101")
 * → { hip: { tags: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP", "SIDE_BOTH"], levels: { 1: { exerciseId: "101" } } } }
 */
const generateHipTree = (
  branchId: string,
  exerciseId: string,
): SkillTreeType => ({
  [branchId]: {
    tags: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP", "SIDE_BOTH"],
    levels: { 1: { exerciseId } },
  },
});

describe("newFocusShortWorkout: template without code changes", () => {
  it("generates a workout from the merged skill trees the catalog names", () => {
    const skillTrees = {
      PREV: generateHipTree("hip", "101"),
      PREVKG: generateHipTree("hipKg", "102"),
    };

    const entries = generateShortWorkoutFromTemplate(
      hipTemplate,
      generateGenerationInput({
        level: "BEGINNER",
        place: "HOME",
        exerciseCatalog: [
          generateEmptyValueExercise("101", ["SIDE_BOTH"]),
          generateEmptyValueExercise("102", ["SIDE_BOTH"]),
        ],
      }),
      skillTrees,
    );
    const trained = entries.filter(
      (entry) => !isPauseExercise(entry.exerciseId),
    );

    expect(trained.map((entry) => entry.exerciseId).sort()).toEqual([
      "101",
      "102",
    ]);
    expect(trained.every((entry) => entry.skill === "PREVHIP")).toBe(true);
  });

  it("writes entries that the user exercise data schema accepts", () => {
    const skillTrees = {
      PREV: generateHipTree("hip", "101"),
      PREVKG: generateHipTree("hipKg", "102"),
    };

    const entries = generateShortWorkoutFromTemplate(
      hipTemplate,
      generateGenerationInput({
        level: "BEGINNER",
        place: "HOME",
        exerciseCatalog: [
          generateEmptyValueExercise("101", ["SIDE_BOTH"]),
          generateEmptyValueExercise("102", ["SIDE_BOTH"]),
        ],
      }),
      skillTrees,
    );

    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.every(
        (entry) => v.safeParse(UserExerciseDataSchema, entry).success,
      ),
    ).toBe(true);
  });
});
