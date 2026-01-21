import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserExerciseDataType } from "./models/UserExerciseData";
import { getEquipmentForPlace, getEquipmentList } from "./trainingUtils";

describe("getEquipmentForPlace", () => {
  it("returns ADJUSTABLE_BENCH and BARBELL_BENCH for STUDIO with dumbbells and barbell", () => {
    const equipment = ["BENCH", "DUMBBELL", "BARBELL"];
    const result = getEquipmentForPlace(equipment, "STUDIO");

    expect(result).toEqual([
      "ADJUSTABLE_BENCH",
      "BARBELL_BENCH",
      "DUMBBELL",
      "BARBELL",
    ]);
  });

  it("returns ADJUSTABLE_BENCH and BENCH for STUDIO with dumbbells but no barbell", () => {
    const equipment = ["BENCH", "DUMBBELL"];
    const result = getEquipmentForPlace(equipment, "STUDIO");

    expect(result).toEqual(["ADJUSTABLE_BENCH", "BENCH", "DUMBBELL"]);
  });

  it("returns default BENCH for HOME regardless of weights", () => {
    const equipment = ["BENCH", "DUMBBELL", "BARBELL"];
    const result = getEquipmentForPlace(equipment, "HOME");

    expect(result).toEqual(["BENCH", "DUMBBELL", "BARBELL"]);
  });

  it("consolidates multiple medicine balls into single MEDICINE_BALL", () => {
    const equipment = ["MEDICINE_BALL_JUMPING", "MEDICINE_BALL"];
    const result = getEquipmentForPlace(equipment, "HOME");

    expect(result).toEqual(["MEDICINE_BALL"]);
  });
});

describe("getEquipmentList", () => {
  const exercises: ExerciseType[] = [
    {
      id: "1",
      name: "Dumbbell Press",
      displayName: "Dumbbell Press",
      description: "Press with dumbbells",
      picture: "exercise1.jpg",
      video: "exercise1.mp4",
      level: { m: 1, w: 1 },
      values: {},
      tags: ["EQ_DUMBBELL", "EQ_BENCH"],
      isAdvanceByReps: true,
      isAdvanceByDuration: false,
      isJump: false,
    },
    {
      id: "2",
      name: "Barbell Squat",
      displayName: "Barbell Squat",
      description: "Squat with barbell",
      picture: "exercise2.jpg",
      video: "exercise2.mp4",
      level: { m: 1, w: 1 },
      values: {},
      tags: ["EQ_BARBELL"],
      isAdvanceByReps: true,
      isAdvanceByDuration: false,
      isJump: false,
    },
  ];

  it("extracts equipment from exercises using EQ_ tag prefix", () => {
    const exerciseList: UserExerciseDataType[] = [
      { exerciseId: "1", skill: "SWR", set: [1, 2], repetition: 10 },
    ];

    const result = getEquipmentList(exerciseList, exercises, "HOME");

    expect(result).toEqual(["BENCH", "DUMBBELL"]);
  });

  it("excludes pause exercises (id 999999)", () => {
    const exerciseList: UserExerciseDataType[] = [
      { exerciseId: "1", skill: "SWR", set: [1, 2], repetition: 10 },
      { exerciseId: "999999", skill: "SWR", set: [1, 2], duration: 10 },
    ];

    const result = getEquipmentList(exerciseList, exercises, "HOME");

    expect(result).not.toContain("BARBELL");
  });
});
