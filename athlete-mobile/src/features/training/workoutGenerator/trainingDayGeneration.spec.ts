import { loadExercises } from "@/data/loadExercises";
import { generateGenerationInput } from "../../../../test/factories/generationInput";
import { generateStoredTrainingDay } from "../../../../test/factories/storedTrainingDay";
import { catchThrownValue } from "../../../../test/factories/thrownValue";
import { generateTrainingDayFromStoredDay } from "./trainingDayGeneration";

const exerciseCatalog = loadExercises();

describe("trainingDayGeneration: generateTrainingDayFromStoredDay", () => {
  it("generates from the branch snapshot the stored day holds, not from the catalog", () => {
    // the catalog trains exercise 39 on branch 576; the stored day trains 721
    const setList = generateTrainingDayFromStoredDay(
      generateStoredTrainingDay({ CARDIO_5: ["576"] }, { CARDIO_5: 25 }, "721"),
      generateGenerationInput({ exerciseCatalog, random: () => 0 }),
    );

    expect(setList).toEqual([
      {
        branchId: "576",
        exerciseId: "721",
        set: [1, 1],
        skill: "CARDIO_5",
        duration: 1500,
      },
    ]);
  });

  it("runs fractional stored minutes as the same number of seconds", () => {
    const setList = generateTrainingDayFromStoredDay(
      generateStoredTrainingDay(
        { CARDIO_5: ["576"] },
        { CARDIO_5: 12.5 },
        "721",
      ),
      generateGenerationInput({ exerciseCatalog, random: () => 0 }),
    );

    expect(setList.map(({ duration }) => duration)).toEqual([750]);
  });

  it("swaps a cardio skill that lower body soreness blocks for CARDIO_5 of at most 20 minutes", () => {
    const setList = generateTrainingDayFromStoredDay(
      generateStoredTrainingDay({ CARDIO_3: ["580"] }, { CARDIO_3: 30 }, "721"),
      generateGenerationInput({
        exerciseCatalog,
        soreMuscles: ["QUADRICEPS"],
        random: () => 0,
      }),
    );

    expect(setList).toEqual([
      {
        branchId: "576",
        exerciseId: "39",
        set: [1, 1],
        skill: "CARDIO_5",
        duration: 1200,
      },
    ]);
  });

  it("returns an empty set list for a day without skills", () => {
    expect(
      generateTrainingDayFromStoredDay(
        generateStoredTrainingDay({}, { BR: 5 }),
        generateGenerationInput({ exerciseCatalog }),
      ),
    ).toEqual([]);
  });

  it("throws the equipment error when the only skill holds no branch", () => {
    const thrown = catchThrownValue(() =>
      generateTrainingDayFromStoredDay(
        generateStoredTrainingDay({ WU: [] }, { WU: 5 }),
        generateGenerationInput({ exerciseCatalog }),
      ),
    );

    expect(thrown).toEqual({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: [],
    });
  });

  it("throws the anamnesis error for an athlete without workout data", () => {
    const thrown = catchThrownValue(() =>
      generateTrainingDayFromStoredDay(
        generateStoredTrainingDay(
          { CARDIO_5: ["576"] },
          { CARDIO_5: 25 },
          "721",
        ),
        generateGenerationInput({ exerciseCatalog, withoutWorkoutData: true }),
      ),
    );

    expect(thrown).toEqual({
      type: "NO_ANAMNESIS",
      subtype: "MISSING_WORKOUT_DATA",
      params: [],
    });
  });
});
