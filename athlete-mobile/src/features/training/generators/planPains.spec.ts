import { WorkoutConstants } from "@/constants/workoutConstants";
import { loadExercises } from "@/data/loadExercises";
import { loadSkillTree } from "@/data/loadSkillTrees";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import { minutes } from "@/features/training/models/TimeUnits";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { PlacesData } from "@/store/placesStore";
import PlanGenerator from "./PlanGenerator";

const TREES = [
  "BAS",
  "BR",
  "CD",
  "GKS",
  "GKSKG",
  "MAX",
  "MOB",
  "PLYO",
  "PREV",
  "PREVKG",
  "SK",
  "SKKG",
  "SWR1",
  "SWR1KG",
  "WU",
  "WUSKSA",
  "WUSPEZIAL",
] as const;

const generateWithPains = (pains: string[]): TrainingPlanType => {
  const skillTrees: Record<string, SkillTreeType> = {};
  for (const name of TREES) {
    skillTrees[name] = loadSkillTree(name);
  }
  const userTrainingDays: TrainingDayType[] = [0, 1, 2, 3, 4, 5, 6].map(
    (weekday) => ({
      active: weekday === 1 || weekday === 3,
      weekday,
      duration: minutes(60),
      place: "STUDIO",
    }),
  );
  const places = {
    STUDIO: { equipment: ["BARBELL", "DUMBBELL", "BENCH", "MAT"] },
  } as PlacesData;

  return PlanGenerator.generatePlan(
    {
      userId: "pain-user",
      personalData: { gender: "MALE", birthday: "1990-01-01" },
      workoutData: {
        tags: {
          LEVEL: [WorkoutConstants.LEVELS.ADVANCED],
          POSITION: ["FIELD"],
          PAIN: pains,
        },
        seasonPhase: {
          type: SeasonPhase.PREPARATORY,
          numOfWeeks: 8,
          endDate: "2026-03-16",
        },
      },
    },
    loadExercises(),
    skillTrees,
    {},
    userTrainingDays,
    places,
    new Date(2026, 0, 19),
  );
};

const skillsPerTraining = (plan: TrainingPlanType) =>
  plan.sections.flatMap((section) =>
    section.trainings.map((training) => training.lengths),
  );

describe("generatePlan: pain tags", () => {
  it("plans an athlete with only an unknown pain tag like an athlete without pain", () => {
    expect(skillsPerTraining(generateWithPains(["FOOT_LEFT"]))).toEqual(
      skillsPerTraining(generateWithPains([])),
    );
  });
});
