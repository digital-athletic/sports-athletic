import type { ExerciseType } from "@/schemas/exercise.schema";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import { getValueByGenderAndLevel, roundWeightValue } from "./workoutUtils";

const exercises = ExercisesData as unknown as ExerciseType[];

interface FixedWeight {
  exercise: string;
  field: string;
  value: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// Every start and target entry of a weight authored in kilograms.
const getFixedWeights = (exercise: ExerciseType): FixedWeight[] => {
  const result: FixedWeight[] = [];
  const weight: unknown = exercise.values?.weight;
  if (!isRecord(weight)) return result;
  for (const bound of ["startValue", "targetValue"]) {
    const entries = weight[bound];
    if (!isRecord(entries)) continue;
    const type = isRecord(entries.type) ? entries.type.type : undefined;
    if (type !== "weightAbsolute") continue;
    for (const [group, levels] of Object.entries(entries)) {
      if (group === "type" || !isRecord(levels)) continue;
      for (const [level, value] of Object.entries(levels)) {
        if (value === "" || value === null) continue;
        result.push({
          exercise: exercise.id,
          field: `${bound}.${group}.${level}`,
          value,
        });
      }
    }
  }
  return result;
};

describe("exercise catalog: fixed weights are loadable", () => {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const fixedWeights = exercises.flatMap(getFixedWeights);

  it("finds fixed weights in the catalog", () => {
    expect(fixedWeights.length).toBeGreaterThan(0);
  });

  it("holds only numeric kilogram values", () => {
    const invalid = fixedWeights.filter(
      ({ value }) => typeof value !== "number" || !isFinite(value),
    );
    expect(invalid).toEqual([]);
  });

  // Dumbbells per hand: 1 kg steps up to 10 kg, then 2 kg. Barbell: 2.5 kg
  // steps from the empty bar. Other equipment: 1 kg.
  it("rounds every fixed start and target weight to itself", () => {
    const notLoadable = fixedWeights
      .filter(({ exercise, value }) => {
        const data = byId.get(exercise);
        return (
          typeof value === "number" && roundWeightValue(value, data) !== value
        );
      })
      .map(({ exercise, field, value }) => `${exercise} ${field}: ${value}`);
    expect(notLoadable).toEqual([]);
  });

  it("never starts above the target weight", () => {
    const genders = ["m", "w", "k"] as const;
    const levels = ["beginner", "advanced", "professional"] as const;
    const violations: string[] = [];
    for (const exercise of exercises) {
      const weight = exercise.values?.weight;
      if (!weight) continue;
      for (const gender of genders) {
        for (const level of levels) {
          const start = getValueByGenderAndLevel(
            weight.startValue,
            gender,
            level,
          );
          const target = getValueByGenderAndLevel(
            weight.targetValue,
            gender,
            level,
          );
          if (start !== undefined && target !== undefined && start > target) {
            violations.push(
              `${exercise.id} ${gender}.${level}: start ${start} above target ${target}`,
            );
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
