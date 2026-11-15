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
import { generateTrainingDay } from "./trainingDayGeneration";
import { generateSetList } from "./workoutGeneration";

const exerciseCatalog = loadExercises();

// Each run gets its own draws from the same seed, so both sources draw alike.
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

describe("sameBlocksSetList: a short workout and a training day of the same blocks", () => {
  it("generate the same set list", () => {
    const shortWorkout = generateSetList(
      workout,
      lookUpStoredBranchInCatalog,
      generateInput(),
      { skillTrees: getAllSkillTrees() },
    );
    const trainingDay = generateTrainingDay(workout, generateInput());

    expect(shortWorkout).toEqual(trainingDay);
  });

  it("train every block and end on a set", () => {
    const setList = generateSetList(
      workout,
      lookUpStoredBranchInCatalog,
      generateInput(),
      { skillTrees: getAllSkillTrees() },
    );

    expect([...new Set(setList.map(({ skill }) => skill))]).toEqual([
      "WU",
      "GKS",
      "MAX",
      "CARDIO_2",
    ]);
    expect(isPauseExercise(setList[setList.length - 1].exerciseId)).toBe(false);
  });
});
