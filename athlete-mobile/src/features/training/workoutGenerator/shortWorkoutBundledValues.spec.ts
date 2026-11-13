import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { loadExercises } from "@/data/loadExercises";
import { loadPlaces } from "@/data/loadPlaces";
import { loadTemplate } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { readAuthoredStartValues } from "./exerciseValues/startAndTargetValues";
import { generateShortWorkoutFromTemplate } from "./shortWorkoutGeneration";

const PREVENTION_TEMPLATES = [
  "PREV",
  "PREVSHOULDER",
  "PREVKNEE",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",
];

const RANGE_START = {
  PREV: { repetition: 10, duration: 40 },
  GKS: { repetition: 8, duration: 30 },
};

const exerciseById = new Map(
  loadExercises().map((exercise) => [exercise.id, exercise]),
);

/**
 * Generates the work entries of the bundled templates for a beginner at a
 * studio, keeping the entries of the skills that start with the prefix.
 *
 * generateWorkEntries(["PREV"], "PREV")
 * → [{ branchId: "...", exerciseId: "...", skill: "PREV", repetition: 10, ... }, ...]
 */
const generateWorkEntries = (
  templateIds: string[],
  skillPrefix: string,
): GeneratedSetListEntry[] =>
  templateIds.flatMap((templateId) => {
    const template = loadTemplate(templateId);
    if (!template) throw new Error(`bundled ${templateId} template is missing`);
    return generateShortWorkoutFromTemplate(
      template,
      generateRuleFamilyInput({
        level: "BEGINNER",
        place: "STUDIO",
        equipment: loadPlaces().STUDIO.EQUIPMENT,
        exerciseCatalog: loadExercises(),
        random: () => 0,
      }),
      getAllSkillTrees(),
    ).filter(
      ({ skill, exerciseId }) =>
        skill.startsWith(skillPrefix) && !isPauseExercise(exerciseId),
    );
  });

/**
 * Reads the start repetitions and duration the catalog authors for the
 * exercise of an entry, for a beginner man.
 *
 * readAuthoredStart(entry)
 * → { repetition: 4, duration: undefined }
 */
const readAuthoredStart = ({ exerciseId }: GeneratedSetListEntry) => {
  const exercise = exerciseById.get(exerciseId);
  if (!exercise?.values) return {};
  const start = readAuthoredStartValues(exercise.values, "m", "beginner");
  return {
    repetition: exercise.isAdvanceByReps ? start.repetition : undefined,
    duration: exercise.isAdvanceByDuration ? start.duration : undefined,
  };
};

describe("shortWorkoutBundledValues: bundled templates", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ["PREV", PREVENTION_TEMPLATES],
    ["GKS", ["GKS"]],
  ] as const)(
    "%s: gives a work entry other than the skill range start",
    (prefix, templateIds) => {
      const range = RANGE_START[prefix];

      expect(
        generateWorkEntries([...templateIds], prefix).some(
          (entry) =>
            (entry.repetition !== undefined &&
              entry.repetition !== range.repetition) ||
            (entry.duration !== undefined && entry.duration !== range.duration),
        ),
      ).toBe(true);
    },
  );

  it.each([
    ["PREV", PREVENTION_TEMPLATES],
    ["GKS", ["GKS"]],
  ] as const)(
    "%s: gives each work entry the authored start value of its exercise",
    (prefix, templateIds) => {
      let checked = 0;
      for (const entry of generateWorkEntries([...templateIds], prefix)) {
        const start = readAuthoredStart(entry);
        if (start.repetition !== undefined) {
          expect(entry.repetition).toBe(start.repetition);
          checked += 1;
        }
        if (start.duration !== undefined) {
          expect(entry.duration).toBe(start.duration);
          checked += 1;
        }
      }

      expect(checked).toBeGreaterThan(0);
    },
  );
});
