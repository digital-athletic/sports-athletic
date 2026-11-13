import { generateAthleteWithMaxValues } from "@test/factories/athlete";
import { generateExerciseStartValueSource } from "@test/factories/exerciseStartValueSource";
import { generateValueExercise } from "@test/factories/valueExercise";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { readExerciseStartValues } from "./exerciseStartValues";

const readStartValues = (
  skill: string,
  exercise: ExerciseType,
  athleteOptions: Parameters<typeof generateAthleteWithMaxValues>[0] = {},
) =>
  readExerciseStartValues(
    generateExerciseStartValueSource({
      athlete: generateAthleteWithMaxValues(athleteOptions),
    }),
    { skill },
    { branchId: "1", exerciseId: exercise.id, branchTags: exercise.tags },
    exercise,
  );

describe("exerciseStartValueDefaults: catalog start durations of the cardio interval skills", () => {
  it("starts a duration exercise of CARDIO_1_SHORT at 10 seconds", () => {
    expect(
      readStartValues("CARDIO_1_SHORT", generateValueExercise("duration"))
        .duration,
    ).toBe(10);
  });

  it("starts a duration exercise of CARDIO_1_LAKTAT at 30 seconds", () => {
    expect(
      readStartValues("CARDIO_1_LAKTAT", generateValueExercise("duration"))
        .duration,
    ).toBe(30);
  });
});

describe("exerciseStartValueDefaults: gender values of an athlete without a birthday", () => {
  const exercise = generateValueExercise("repetition", {
    values: {
      repetition: {
        startValue: {
          default: { default: 6 },
          k: { default: 4 },
          w: { default: 5 },
        },
        targetValue: { default: { default: 20 } },
      },
    },
  });

  it("reads the values of a man for a man without a birthday", () => {
    expect(readStartValues("PREV", exercise, { birthday: "" }).repetition).toBe(
      6,
    );
  });

  it("reads the child values for a child", () => {
    const childBirthday = `${new Date().getFullYear() - 10}-01-01`;

    expect(
      readStartValues("PREV", exercise, { birthday: childBirthday }).repetition,
    ).toBe(4);
  });
});
