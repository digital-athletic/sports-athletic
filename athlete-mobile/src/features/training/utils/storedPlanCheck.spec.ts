import type { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { minutes } from "@/features/training/models/TimeUnits";
import type { PlacesData } from "@/store/placesStore";
import {
  importTree,
  realExercises,
} from "../../../../test/factories/planWorkout";
import { isStoredPlanBroken } from "./storedPlanCheck";

const maxTree = importTree("MAX");

// Branch 143 is the barbell back squat of max strength
const squat: ExerciseBranchType = {
  branchId: "143",
  tags: maxTree["143"].tags,
  exercises: maxTree["143"].levels,
};

const adultOnly: ExerciseBranchType = {
  branchId: "adult-only",
  tags: ["AGE_ADULT"],
  exercises: { 1: { exerciseId: "1" } },
};

const planWith = (skills: UserSkills): TrainingPlanType => ({
  start: "2026-10-05",
  sections: [
    {
      start: "2026-10-05",
      numOfWeeks: 4,
      type: "MAX_KRAFT",
      cardioType: "CARDIO_3",
      trainings: [{ weekday: 1, skills, lengths: {}, focus: "PHASE" }],
    },
  ],
});

type UserSkills =
  TrainingPlanType["sections"][number]["trainings"][number]["skills"];

const trainingDays = (place: TrainingDayType["place"]): TrainingDayType[] => [
  { active: true, weekday: 1, duration: minutes(60), place },
];

const places: PlacesData = {
  HOME: { equipment: ["DUMBBELL"] },
  STUDIO: { equipment: ["BARBELL", "POWER_RACK", "BENCH"] },
  HALL: { equipment: [] },
  OUTSIDE: { equipment: [] },
};

const check = (
  plan: TrainingPlanType,
  options: { birthday?: string; place?: TrainingDayType["place"] } = {},
) =>
  isStoredPlanBroken({
    plan,
    birthday: options.birthday ?? "1990-01-01",
    userLevel: "ADVANCED",
    trainingDays: trainingDays(options.place ?? "STUDIO"),
    places,
    exercises: realExercises,
    branchData: {},
  });

const twelveYearsAgo = `${new Date().getFullYear() - 12}-01-01`;

describe("isStoredPlanBroken", () => {
  it("flags an adult-only branch in the plan of a child", () => {
    expect(
      check(planWith({ SWR1: [adultOnly] }), { birthday: twelveYearsAgo }),
    ).toBe(true);
  });

  it("accepts an adult-only branch in the plan of an adult", () => {
    expect(check(planWith({ SWR1: [adultOnly] }))).toBe(false);
  });

  it("accepts an adult-only branch when the birthday is missing", () => {
    expect(check(planWith({ SWR1: [adultOnly] }), { birthday: "" })).toBe(
      false,
    );
  });

  it("flags a max strength lift whose equipment the day's place lacks", () => {
    expect(check(planWith({ MAX_KRAFT: [squat] }), { place: "HOME" })).toBe(
      true,
    );
  });

  it("accepts a max strength lift at a place with its equipment", () => {
    expect(check(planWith({ MAX_KRAFT: [squat] }), { place: "STUDIO" })).toBe(
      false,
    );
  });

  it("accepts other skills with missing equipment, which workouts replace", () => {
    expect(check(planWith({ SWR1: [squat] }), { place: "HOME" })).toBe(false);
  });
});
