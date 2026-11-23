import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import {
  generateBranchesBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { lookUpStoredBranchInCatalog } from "./blockHandlers/branches/storedBranchLookup";
import type { GenerationInput } from "./generationInput/generationInput";
import { generateSetListFromWorkout } from "./workoutGeneration";

const exerciseCatalog = loadExercises();

const generateInput = (): GenerationInput =>
  generateGenerationInput({
    exerciseCatalog,
    equipment: [
      "DUMBBELL",
      "BARBELL",
      "RACK",
      "BENCH",
      "TREADMILL",
      "AREA_5",
      "AREA_10",
      "AREA_20",
      "MARKERS",
      "TRACK_20",
    ],
    random: generateSeededRandom(7),
  });

// The blocks follow the section order, so the plan day sort keeps their order.
const workout = generateTemplate([
  generateBranchesBlock("WU", ["410", "414"]),
  generateBranchesBlock("GKS", ["510", "512", "513"]),
  generateBranchesBlock("MAX", ["133", "134"]),
  generateBranchesBlock("CARDIO_2", ["582", "584", "585"], { duration: 1200 }),
]);

describe("sameBlocksSetList: a workout of branches blocks", () => {
  it("train every block and end on a set", () => {
    const setList = generateSetListFromWorkout(
      workout,
      lookUpStoredBranchInCatalog,
      generateInput(),
      { skillTrees: getAllSkillTrees() },
    ).setList;

    expect([...new Set(setList.map(({ skill }) => skill))]).toEqual([
      "WU",
      "GKS",
      "MAX",
      "CARDIO_2",
    ]);
    expect(isPauseExercise(setList[setList.length - 1].exerciseId)).toBe(false);
  });
});
