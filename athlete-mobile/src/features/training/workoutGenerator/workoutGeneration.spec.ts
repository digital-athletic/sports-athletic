import { generateExercisesBlock } from "@test/factories/exercisesBlock";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { listTrainedExercises } from "@test/factories/setListDescription";
import { generateLowerBodyBranch } from "@test/factories/skillTree";
import {
  generateShortTemplate,
  generateUntimedBranchesBlock,
} from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateLowerBodyExercises } from "@test/factories/valueExercise";
import { lookUpStoredBranchInCatalog } from "./blockHandlers/branches/storedBranchLookup";
import { generateSetList } from "./workoutGeneration";

describe("workoutGeneration: generateSetList of a short workout", () => {
  it("trains a replacement branch of the same skill when pain blocks every listed branch", () => {
    // MOB branch 1 is blocked for knee pain, branch 2 is free
    const skillTrees = {
      MOB: {
        "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, [
          "BLOCK_KNEE",
        ]),
        "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const workout = generateShortTemplate([
      generateUntimedBranchesBlock("MOB", { branches: ["1"] }),
    ]);

    const setList = generateSetList(
      workout,
      lookUpStoredBranchInCatalog,
      generateRuleFamilyInput({
        exerciseCatalog: generateLowerBodyExercises(["e1", "e2"]),
        skillTrees,
        pains: ["KNEE_LEFT"],
        random: () => 0,
      }),
      { skillTrees },
    );

    expect(listTrainedExercises(setList)).toEqual(["e2"]);
  });

  it("trains a replacement branch of the same skill for a branch ID the catalog lacks", () => {
    // no skill tree holds the branch ID 900001
    const skillTrees = {
      MOB: { "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }) },
    };
    const workout = generateShortTemplate([
      generateUntimedBranchesBlock("MOB", { branches: ["900001"] }),
    ]);

    const setList = generateSetList(
      workout,
      lookUpStoredBranchInCatalog,
      generateRuleFamilyInput({
        exerciseCatalog: generateLowerBodyExercises(["e2"]),
        skillTrees,
        random: () => 0,
      }),
      { skillTrees },
    );

    expect(listTrainedExercises(setList)).toEqual(["e2"]);
  });

  it("throws OTHER BLOCK_KIND for an exercises block without test sets", () => {
    const workout = generateShortTemplate([generateExercisesBlock(["25"])]);

    const thrown = catchThrownValue(() =>
      generateSetList(
        workout,
        lookUpStoredBranchInCatalog,
        generateRuleFamilyInput(),
      ),
    );

    expect(thrown).toStrictEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["short.blocks[0]", "exercises"],
    });
  });
});
