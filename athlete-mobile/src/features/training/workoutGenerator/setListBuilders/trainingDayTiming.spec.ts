import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { generateTreeCatalogEntry } from "@test/factories/skillCatalog";
import { readTrainingDayTimingDefaults } from "./trainingDayTiming";

describe("trainingDayTiming: readTrainingDayTimingDefaults", () => {
  // Rests: within a superset, between sets, after an exercise.
  it.each([
    ["CARDIO_1_SHORT", 10, "none", [50, 10, 50]],
    ["CARDIO_1_LAKTAT", 4, "none", [240, 10, 240]],
    ["CARDIO_2", 8, "none", [60, 10, 60]],
    ["CARDIO_3", 6, "none", [60, 10, 60]],
    ["CARDIO_4", 1, "none", [10, 10, 10]],
    ["CARDIO_5", 1, "none", [10, 10, 10]],
    ["WU", 1, "muscles", [10, 10, 30]],
    ["WUSKSA", 1, "muscles", [30, 30, 30]],
    ["WUSPEZIAL", 1, "muscles", [10, 10, 10]],
    ["MOB", 1, "muscles", [10, 10, 10]],
    ["BR", 1, "muscles", [10, 10, 10]],
    ["CD", 1, "muscles", [10, 10, 10]],
    ["MAX", 4, "none", [10, 10, 180]],
    ["MAX_STRENGTH", 4, "none", [10, 10, 180]],
    ["SWR1", 2, "muscles", [30, 90, 60]],
    ["SWR2KG", 2, "muscles", [30, 90, 60]],
    ["SK", 2, "muscles", [60, 180, 60]],
    ["SKKG", 2, "muscles", [60, 180, 60]],
    ["SA", 2, "muscles", [75, 180, 75]],
    ["SAKG", 2, "muscles", [75, 180, 75]],
    ["BAS", 2, "muscles", [30, 60, 60]],
    ["STABILITY", 2, "muscles", [30, 60, 60]],
    ["PREV", 2, "muscles", [30, 60, 60]],
    ["PREVKNEE", 2, "muscles", [30, 60, 60]],
    ["GKS", 2, "none", [45, 90, 60]],
    ["GKSKG", 2, "none", [45, 90, 60]],
    ["SAS", 2, "none", [10, 10, 10]],
    ["SASKG", 2, "muscles", [10, 10, 10]],
    ["PLYO", 2, "muscles", [60, 180, 60]],
  ] as const)(
    "keeps %s at %i sets, superset %s and rests %j with the bundled catalog",
    (skill, sets, superset, [withinSuperset, betweenSets, afterExercise]) => {
      expect(readTrainingDayTimingDefaults(skill, loadSkillCatalog())).toEqual({
        sets,
        superset,
        rest: { withinSuperset, betweenSets, afterExercise },
      });
    },
  );

  it("reads a skill without override from the skill catalog", () => {
    const skillCatalog = {
      ...loadSkillCatalog(),
      BAS: generateTreeCatalogEntry({
        sets: 3,
        superset: "none",
        rest: { withinSuperset: 20, betweenSets: 40, afterExercise: 50 },
      }),
    };

    expect(readTrainingDayTimingDefaults("BAS", skillCatalog)).toEqual({
      sets: 3,
      superset: "none",
      rest: { withinSuperset: 20, betweenSets: 40, afterExercise: 50 },
    });
  });

  it("takes the training day override before the skill catalog value", () => {
    const skillCatalog = {
      ...loadSkillCatalog(),
      MAX: generateTreeCatalogEntry({ sets: 3 }),
    };

    expect(readTrainingDayTimingDefaults("MAX", skillCatalog).sets).toBe(4);
  });

  it("reads the skill catalog for a field the override leaves open", () => {
    const skillCatalog = {
      ...loadSkillCatalog(),
      MAX: generateTreeCatalogEntry({ superset: "muscles" }),
    };

    expect(readTrainingDayTimingDefaults("MAX", skillCatalog).superset).toBe(
      "muscles",
    );
  });

  it("falls back to 2 sets, a superset by muscles and 10 second rests for an unknown skill", () => {
    expect(readTrainingDayTimingDefaults("UNKNOWN", {})).toEqual({
      sets: 2,
      superset: "muscles",
      rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
    });
  });

  it("reads no inherited key as a skill", () => {
    expect(readTrainingDayTimingDefaults("constructor", {})).toEqual({
      sets: 2,
      superset: "muscles",
      rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
    });
  });
});
