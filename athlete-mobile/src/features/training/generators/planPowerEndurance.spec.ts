import { WorkoutConstants } from "@/constants/workoutConstants";
import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import { minutes } from "@/features/training/models/TimeUnits";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { PlacesData } from "@/store/placesStore";
import PlanGenerator from "./PlanGenerator";
import TrainingGenerator from "./TrainingGenerator";

const TRAINING_WEEKDAYS = [1, 3];
const STUDIO_EQUIPMENT = ["BARBELL", "DUMBBELL", "BENCH", "MAT"];

// entries of every workout in the field player's power endurance section
const powerEnduranceEntries = (birthday: string) => {
  const exercises = loadExercises();
  const skillTrees = getAllSkillTrees();
  const userTrainingDays: TrainingDayType[] = [0, 1, 2, 3, 4, 5, 6].map(
    (weekday) => ({
      active: TRAINING_WEEKDAYS.includes(weekday),
      weekday,
      duration: minutes(60),
      place: "STUDIO",
    }),
  );
  const places = { STUDIO: { equipment: STUDIO_EQUIPMENT } } as PlacesData;
  const user = {
    userId: "power-endurance-user",
    personalData: { gender: "MALE" as const, birthday },
    workoutData: {
      tags: {
        LEVEL: [WorkoutConstants.LEVELS.ADVANCED],
        POSITION: ["FIELD"],
      },
      seasonPhase: {
        type: SeasonPhase.COMPETITION,
        numOfWeeks: 14,
        endDate: "2026-04-20",
      },
    },
  };
  const trainingPlan = PlanGenerator.generatePlan(
    user,
    exercises,
    skillTrees,
    {},
    userTrainingDays,
    places,
    new Date(2026, 0, 12),
  );
  const sectionIndex = trainingPlan.sections.findIndex(
    (section) => section.type === "SA",
  );
  expect(sectionIndex).toBeGreaterThan(-1);

  const generator = new TrainingGenerator();
  return TRAINING_WEEKDAYS.flatMap((weekday) =>
    generator.generatePlanWorkout(
      "PLAN",
      { ...user, trainingPlan },
      "STUDIO",
      exercises,
      skillTrees,
      weekday,
      STUDIO_EQUIPMENT,
      sectionIndex,
      0,
      { exerciseData: {}, branchData: {} },
    ),
  );
};

const specialBranchIds = new Set(Object.keys(getAllSkillTrees().SAS));
const usesSpecialBranch = (entries: { branchId: string }[]) =>
  entries.some((entry) => specialBranchIds.has(entry.branchId));

describe("generatePlan: power endurance for field players", () => {
  it.each([
    ["an adult", "1990-01-01"],
    ["a child", "2020-01-01"],
  ])(
    "fills power endurance and its special slots for %s",
    (_label, birthday) => {
      const entries = powerEnduranceEntries(birthday);

      expect(entries.some((entry) => entry.skill === "SA")).toBe(true);
      expect(usesSpecialBranch(entries)).toBe(true);
    },
  );
});
