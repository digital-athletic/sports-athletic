import { loadExercises } from "@/data/loadExercises";
import { loadTemplate } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import {
  generatePicksBlock,
  generateShortTemplate,
} from "@test/factories/templateBlock";
import { lookUpStoredBranchInCatalog } from "./blockHandlers/branches/storedBranchLookup";
import { generateSetListFromWorkout } from "./workoutGeneration";

// Every prevention branch of the PREV tree needs a dumbbell. Without equipment
// the PREVKG tree keeps at least 3 branches per prevention area (wrist and
// elbow), so a count of 2 fills for every area.
const PREVENTION_PICKS: [string, number][] = [
  ["PREVENTION_SHOULDER", 2],
  ["PREVENTION_KNEE_HIP", 2],
  ["PREVENTION_SPINE", 2],
  ["PREVENTION_ANKLE", 2],
  ["PREVENTION_WRIST_ELBOW", 2],
];

describe("shortWorkoutGeneration: prevention without equipment", () => {
  it.each(PREVENTION_PICKS)(
    "draws only PREVKG branches for a PREV block tagged %s",
    (tag, count) => {
      const template = generateShortTemplate([
        generatePicksBlock("PREV", { picks: [{ tags: [tag], count }] }),
      ]);

      const drawn = generateSetListFromWorkout(
        template,
        lookUpStoredBranchInCatalog,
        generateRuleFamilyInput({ exerciseCatalog: loadExercises() }),
        { skillTrees: getAllSkillTrees() },
      ).setList.filter(({ exerciseId }) => !isPauseExercise(exerciseId));

      expect(drawn.length).toBeGreaterThan(0);
      drawn.forEach(({ branchId }) =>
        expect(Object.keys(getAllSkillTrees().PREVKG)).toContain(branchId),
      );
    },
  );

  it("draws the prevention exercises of the bundled PREV template from PREVKG", () => {
    const template = loadTemplate("PREV");
    if (!template) throw new Error("bundled PREV template is missing");

    const drawn = generateSetListFromWorkout(
      template,
      lookUpStoredBranchInCatalog,
      generateRuleFamilyInput({ exerciseCatalog: loadExercises() }),
      { skillTrees: getAllSkillTrees() },
    ).setList.filter(
      ({ skill, exerciseId }) =>
        skill === "PREV" && !isPauseExercise(exerciseId),
    );

    expect(drawn.length).toBeGreaterThan(0);
    drawn.forEach(({ branchId }) =>
      expect(Object.keys(getAllSkillTrees().PREVKG)).toContain(branchId),
    );
  });
});
