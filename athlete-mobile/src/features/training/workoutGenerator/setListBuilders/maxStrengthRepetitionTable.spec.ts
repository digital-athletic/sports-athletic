import { generateAthleteWithMaxValues } from "@test/factories/athlete";
import { generateSquatStoredProgress } from "@test/factories/storedExerciseData";
import { generateSquatExercise } from "@test/factories/valueExercise";
import type { MaxStrengthBuffer } from "@/schemas/generator.schema";
import {
  readMaxTrainingRepetitions,
  readMaxTrainingWeights,
} from "./maxStrengthLadder";

describe("maxStrengthRepetitionTable: repetitions per athlete", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T00:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("gives an adolescent Pro 2 repetitions at 90% in the hardest buffer", () => {
    const adolescent = generateAthleteWithMaxValues({
      level: "PROFESSIONAL",
      birthday: "2009-05-01",
    });

    const repetitions = readMaxTrainingRepetitions(adolescent, {
      trainingWeights: [75, 80, 85, 90],
      levels: ["HARD", "HARD", "HARD", "HARD"],
    });

    expect(repetitions.at(-1)?.repetitions).toBe(2);
  });

  it("gives an adolescent Pro the repetitions of an adult Pro", () => {
    const levels: MaxStrengthBuffer[] = ["EASY", "MEDIUM", "HARD", "MEDIUM"];
    const ladder = { trainingWeights: [75, 80, 85, 90], levels };

    expect(
      readMaxTrainingRepetitions(
        generateAthleteWithMaxValues({
          level: "PROFESSIONAL",
          birthday: "2009-05-01",
        }),
        ladder,
      ),
    ).toEqual(
      readMaxTrainingRepetitions(
        generateAthleteWithMaxValues({
          level: "PROFESSIONAL",
          birthday: "1990-01-01",
        }),
        ladder,
      ),
    );
  });

  it("falls back to the 10% buffer for a Pro with an empty buffer at 90%", () => {
    const repetitions = readMaxTrainingRepetitions(
      generateAthleteWithMaxValues({ level: "PROFESSIONAL" }),
      {
        trainingWeights: [75, 80, 85, 90],
        levels: ["EASY", "EASY", "EASY", "EASY"],
      },
    );

    expect(repetitions.at(-1)).toEqual({
      level: "MEDIUM",
      repetitions: 1,
      weightPercentage: 90,
    });
  });
});

describe("maxStrengthRepetitionTable: buffer per set after too hard", () => {
  it("keeps the buffer of every Pro set and raises the weight from set to set", () => {
    const athlete = generateAthleteWithMaxValues({ level: "PROFESSIONAL" });

    const { trainingWeights, levels } = readMaxTrainingWeights(
      generateSquatExercise(),
      athlete,
      generateSquatStoredProgress(
        {
          maxFRepetitions: [
            { level: "EASY", repetitions: 3, weightPercentage: 75 },
            { level: "MEDIUM", repetitions: 3, weightPercentage: 80 },
            { level: "HARD", repetitions: 3, weightPercentage: 85 },
            { level: "MEDIUM", repetitions: 1, weightPercentage: 90 },
          ],
        },
        "TOO_HARD",
      ),
      "MAX_STRENGTH",
    );

    expect(levels).toEqual(["EASY", "MEDIUM", "HARD", "MEDIUM"]);
    for (let i = 1; i < trainingWeights.length; i++) {
      expect(trainingWeights[i]).toBeGreaterThan(trainingWeights[i - 1]);
    }
  });
});
