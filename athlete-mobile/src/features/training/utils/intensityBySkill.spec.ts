import { getExerciseById } from "@/data/exerciseRegistry";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import { getIntensityBySkill } from "./intensityBySkill";
import { getResetDuration, getResetRepetition } from "./weightAdjustmentUtils";

const WEIGHTED = { tags: ["EQ_TYPE_WEIGHTS"] };
const BODYWEIGHT = { tags: ["EQ_TYPE_BODYWEIGHT"] };
// These skills read a config by a fixed name, not by their catalog entry.
const FIXED_NAME_SKILLS = [
  "SWR1",
  "SWR1KG",
  "SWR2",
  "SWR2KG",
  "PLYO_HIGH",
  "PLYO_MEDIUM",
];
const CATALOG_SKILLS = (Object.keys(loadSkillCatalog()) as SkillCode[]).filter(
  (skill) => !FIXED_NAME_SKILLS.includes(skill),
);

const authoredValues = (start: string, target: string) => ({
  startValue: { default: { default: start }, m: { default: start } },
  targetValue: { default: { default: target }, m: { default: target } },
});

/**
 * Builds a weighted exercise that advances by the given value.
 *
 * generateWeightedExercise("duration", { duration: authoredValues("40", "80") })
 * → { id: "1", isAdvanceByDuration: true, tags: [..., "EQ_TYPE_WEIGHTS"], ... }
 */
const generateWeightedExercise = (
  mode: "repetition" | "duration",
  values: ExerciseType["values"],
): ExerciseType => ({
  id: "1",
  name: "Test Exercise",
  displayName: "Test Exercise",
  description: "Test Description",
  picture: "test.jpg",
  video: "test.mp4",
  level: { m: 1, w: 1 },
  tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "EQ_TYPE_WEIGHTS"],
  isAdvanceByReps: mode === "repetition",
  isAdvanceByDuration: mode === "duration",
  isJump: false,
  values,
});

describe("getIntensityBySkill", () => {
  it.each(["PLYO_HIGH", "PLYO_MEDIUM"] as const)(
    "reads the PLYO config for %s",
    (skill) => {
      expect(getIntensityBySkill(skill)).toEqual(loadIntensityConfig("PLYO"));
    },
  );

  it.each([
    ["SWR1", "SWR2"],
    ["SWR1KG", "SWR2"],
    ["SWR2", "SWR2"],
    ["SWR2KG", "SWR2KG"],
  ] as const)(
    "reads the %s hypertrophy config as %s without an exercise",
    (skill, config) => {
      expect(getIntensityBySkill(skill)).toEqual(loadIntensityConfig(config));
    },
  );

  it.each(["SWR1", "SWR2KG"] as const)(
    "reads SWR2 for a weighted %s exercise and SWR2KG for a bodyweight one",
    (skill) => {
      expect(getIntensityBySkill(skill, WEIGHTED)).toEqual(
        loadIntensityConfig("SWR2"),
      );
      expect(getIntensityBySkill(skill, BODYWEIGHT)).toEqual(
        loadIntensityConfig("SWR2KG"),
      );
    },
  );

  it.each(CATALOG_SKILLS)("reads the catalog config of %s", (skill) => {
    const entry = loadSkillCatalog()[skill];

    expect(getIntensityBySkill(skill, WEIGHTED)).toEqual(
      loadIntensityConfig(entry?.intensity ?? "DEFAULTKG"),
    );
  });

  it("reads the catalog config without weights for a bodyweight exercise", () => {
    const [skill, entry] = Object.entries(loadSkillCatalog()).find(
      ([, candidate]) => candidate.intensityWithoutWeights !== undefined,
    ) ?? ["", undefined];

    expect(getIntensityBySkill(skill as SkillCode, BODYWEIGHT)).toEqual(
      loadIntensityConfig(entry?.intensityWithoutWeights ?? ""),
    );
  });

  it("resets a weighted exercise to the hypertrophy start after a weight increase", () => {
    const intensity = getIntensityBySkill("SWR2");
    const repsExercise = generateWeightedExercise("repetition", {
      repetition: authoredValues("12", "20"),
    });
    const durationExercise = generateWeightedExercise("duration", {
      duration: authoredValues("40", "80"),
    });

    expect(getResetRepetition(repsExercise, intensity, "m", "advanced")).toBe(
      8,
    );
    expect(getResetDuration(durationExercise, intensity, "m", "advanced")).toBe(
      30,
    );
  });

  it("resets the PREVKNEE landing exercise 1107 to its start of 4 repetitions after a weight step", () => {
    const landing = getExerciseById("1107");
    if (!landing) throw new Error("Exercise 1107 missing from the registry");

    expect(
      getResetRepetition(
        landing,
        getIntensityBySkill("PREVKNEE", landing),
        "m",
        "beginner",
      ),
    ).toBe(4);
  });
});
