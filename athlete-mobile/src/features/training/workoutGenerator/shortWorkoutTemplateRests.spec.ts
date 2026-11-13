import { loadExercises } from "@/data/loadExercises";
import { loadTemplates } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { generateGenerationInput } from "@test/factories/generationInput";
import PlacesData from "../../../../assets/data/generator/places.json";
import { generateShortWorkoutFromTemplate } from "./shortWorkoutGeneration";

const PREVENTION_TEMPLATES = [
  "PREV",
  "PREVSHOULDER",
  "PREVKNEE",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",
];

/**
 * Generates the short workout of a bundled template for a beginner who draws
 * the first candidate every time.
 *
 * generateBundledWorkout("BAS") → the BAS set list with pauses
 */
const generateBundledWorkout = (templateId: string): GeneratedSetListEntry[] =>
  generateShortWorkoutFromTemplate(
    loadTemplates()[templateId],
    generateGenerationInput({
      level: "BEGINNER",
      equipment: PlacesData.STUDIO.EQUIPMENT,
      exerciseCatalog: loadExercises(),
      random: () => 0,
    }),
    getAllSkillTrees(),
  );

/**
 * Lists the durations of the pauses a skill trained.
 *
 * listPauseDurations(setList, "WUSPEZIAL") → [10, 10, 30]
 */
const listPauseDurations = (
  setList: GeneratedSetListEntry[],
  skill: string,
): (number | undefined)[] =>
  setList
    .filter(
      (entry) => isPauseExercise(entry.exerciseId) && entry.skill === skill,
    )
    .map((entry) => entry.duration);

describe("shortWorkoutTemplateRests: prevention templates", () => {
  it.each(PREVENTION_TEMPLATES)(
    "%s rests 30 s after the last special warm-up entry and 10 s before",
    (templateId) => {
      const rests = listPauseDurations(
        generateBundledWorkout(templateId),
        "WUSPEZIAL",
      );

      expect(rests.length).toBeGreaterThan(1);
      expect(rests[rests.length - 1]).toBe(30);
      expect(rests.slice(0, -1).every((rest) => rest === 10)).toBe(true);
    },
  );

  it("PREV rests 30 s after every prevention entry", () => {
    const rests = listPauseDurations(generateBundledWorkout("PREV"), "PREV");

    expect(rests.length).toBeGreaterThan(0);
    expect(rests.every((rest) => rest === 30)).toBe(true);
  });
});

describe("shortWorkoutTemplateRests: STABILITY", () => {
  it("builds at least one superset pair with interleaved exercises", () => {
    const exercises = generateBundledWorkout("STABILITY").filter(
      (entry) => !isPauseExercise(entry.exerciseId),
    );

    const hasInterleavedPair = exercises.some(
      (entry, index) =>
        index >= 2 &&
        entry.set[0] === 2 &&
        exercises[index - 2].exerciseId === entry.exerciseId &&
        exercises[index - 1].exerciseId !== entry.exerciseId,
    );

    expect(hasInterleavedPair).toBe(true);
  });

  it("rests 30 s between the sets of a single exercise", () => {
    const entries = generateBundledWorkout("STABILITY");

    const betweenSets = entries.flatMap((entry, index) => {
      const rest = entries[index + 1];
      const next = entries[index + 2];
      return !isPauseExercise(entry.exerciseId) &&
        rest !== undefined &&
        isPauseExercise(rest.exerciseId) &&
        next?.exerciseId === entry.exerciseId &&
        next.set[0] === entry.set[0] + 1
        ? [rest.duration]
        : [];
    });

    expect(betweenSets.length).toBeGreaterThan(0);
    expect(betweenSets.every((rest) => rest === 30)).toBe(true);
  });
});
