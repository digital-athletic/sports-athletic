import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import { deepFreeze } from "@test/factories/deepFreeze";
import {
  buildPlanUser,
  generatePlanWorkoutForWeekday,
  importTrees,
  nextWeek,
  realExercises,
  today,
} from "@test/factories/planWorkout";

describe("AIWL training day: plan workout", () => {
  setUpAiwlGeneratorFlag(true);

  it("does not throw when trainingPlan is frozen (immer store) and daysSinceLastWorkout > 7", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        SWR1: [
          {
            branchId: "22",
            tags: ["SKILL_SWR", "PLACE_STUDIO", "EQ_DUMBBELL"],
            exercises: {
              "1": { exerciseId: "118" },
              "2": { exerciseId: "118" },
              "3": { exerciseId: "261" },
            },
          },
        ],
      },
      lengths: { SWR1: 10 },
    });

    // Simulate immer's recursive deep freeze (Zustand immer middleware freezes all store state)
    deepFreeze(user.trainingPlan!);

    const result = generateWorkout({
      type: "PLAN",
      user,
      place: "STUDIO",
      exercises: realExercises,
      skillTrees: importTrees("WU", "SWR1", "CARDIO_3", "CARDIO_4", "CARDIO_5"),
      weekday: 1,
      equipment: ["DUMBBELL", "BARBELL"],
      givenSection: undefined,
      daysSinceLastWorkout: 14, // > 7 days triggers extendSectionsForMissedWeeks
      userExerciseData: { exerciseData: {}, branchData: {} },
    });
    expect(result.length).toBeGreaterThan(0);
  });

  it("branch threshold profile: BEGINNER with branch level 2 does not throw", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        SWR1: [
          {
            branchId: "22",
            tags: ["SKILL_SWR", "PLACE_STUDIO", "EQ_DUMBBELL"],
            exercises: {
              "1": { exerciseId: "118" },
              "2": { exerciseId: "118" },
              "3": { exerciseId: "261" },
            },
          },
        ],
      },
      lengths: { SWR1: 10 },
    });
    user.workoutData!.tags = { LEVEL: ["BEGINNER"], POSITION: ["FIELD"] };

    const studioEquipment = [
      "DUMBBELL",
      "BARBELL",
      "BENCH",
      "ADJUSTABLE_BENCH",
      "BARBELL_BENCH",
      "EXERCISING_BENCH",
      "POWER_RACK",
    ];
    const exerciseData: Record<string, UserExerciseDataType | undefined> = {
      "118": {
        exerciseId: "118",
        skill: "SWR1",
        weight: 25,
        repetition: 15,
        weightType: "weightAbsolute",
      },
    };
    const branchData: Record<string, UserExerciseBranchDataType | undefined> = {
      "22": { branchId: "22", level: 2 },
    };

    const result = generateWorkout({
      type: "PLAN",
      user,
      place: "STUDIO",
      exercises: realExercises,
      skillTrees: importTrees("WU", "SWR1", "CARDIO_3", "CARDIO_4", "CARDIO_5"),
      weekday: 1,
      equipment: studioEquipment,
      givenSection: 0,
      daysSinceLastWorkout: 0,
      userExerciseData: { exerciseData, branchData },
    });
    expect(result.length).toBeGreaterThan(0);
  });

  // Regression: leg soreness on a CARDIO_3 day swaps in CARDIO_5, and the
  // replacement entries must resolve to an exercise.
  it("does not crash with leg soreness on endurance (CARDIO_3) training day", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        CARDIO_3: [
          {
            branchId: "580",
            tags: [
              "EQ_TREADMILL",
              "EQ_TYPE_EQUIPMENT",
              "REGION_LOWER_BODY",
              "SKILL_CARDIO",
              "SKILL_CARDIO_3",
              "PLACE_STUDIO",
            ],
            exercises: {
              "1": { exerciseId: "43" },
              "2": { exerciseId: "43" },
              "3": { exerciseId: "43" },
            },
          },
        ],
      },
      lengths: { CARDIO_3: 20 },
      temporalData: [
        { date: today, expiration: nextWeek, tag: "QUADRICEPS_LEFT" },
      ],
    });

    const result = generatePlanWorkoutForWeekday(user, {
      place: "STUDIO",
      equipment: ["TREADMILL"],
      skillTrees: importTrees("WU", "CARDIO_3", "CARDIO_4", "CARDIO_5"),
    });

    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(typeof entry.exerciseId).toBe("string");
    }
  });
});
