import { loadExercises } from "@/data/loadExercises";
import { loadTemplate } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { generateShortWorkoutFromTemplate } from "./shortWorkoutGeneration";

const exerciseCatalog = loadExercises();

const generatePreventionKneeWorkout = (
  pains: string[],
  random: () => number,
): GeneratedSetListEntry[] => {
  const template = loadTemplate("PREVKNEE");
  if (!template) throw new Error("bundled PREVKNEE template is missing");
  return generateShortWorkoutFromTemplate(
    template,
    generateGenerationInput({ pains, exerciseCatalog, random }),
    getAllSkillTrees(),
  );
};

const listTrained = (setList: GeneratedSetListEntry[], skill: string) =>
  setList.filter(
    (entry) => entry.skill === skill && !isPauseExercise(entry.exerciseId),
  );

describe("shortWorkoutPreventionKnee: PREVKNEE with sided pain", () => {
  it("trains at least 3 WUSPEZIAL warm-up exercises for KNEE_RIGHT pain", () => {
    const setList = generatePreventionKneeWorkout(
      ["KNEE_RIGHT"],
      generateSeededRandom(3),
    );

    // 3 warm-up branches are drawn; a one sided exercise expands to left and
    // right, so the count is at least 3
    expect(listTrained(setList, "WUSPEZIAL").length).toBeGreaterThanOrEqual(3);
  });

  it("trains at least 6 main PREVKNEE exercises for KNEE_RIGHT pain", () => {
    const setList = generatePreventionKneeWorkout(
      ["KNEE_RIGHT"],
      generateSeededRandom(3),
    );

    // 3 superset pairs are drawn; fill-up branches can raise the count above 6
    expect(listTrained(setList, "PREVKNEE").length).toBeGreaterThanOrEqual(6);
  });

  it("gives the same PREVKNEE exercises for a right knee pain as without pains", () => {
    const withPain = listTrained(
      generatePreventionKneeWorkout(["KNEE_RIGHT"], () => 0),
      "PREVKNEE",
    ).map((entry) => entry.exerciseId);
    const withoutPains = listTrained(
      generatePreventionKneeWorkout([], () => 0),
      "PREVKNEE",
    ).map((entry) => entry.exerciseId);

    expect(withPain.length).toBeGreaterThanOrEqual(6);
    expect(withPain).toEqual(withoutPains);
  });
});
