import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import PlanGenerator from "@/features/training/generators/PlanGenerator";
import { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import { generateProfessionalKneePainPlanInputs } from "@test/factories/studioPlanInputs";

describe("workoutGeneratorRouter: training length", () => {
  setUpAiwlGeneratorFlag(true);

  it("plans max strength and prevention on a professional max strength day with knee pain", () => {
    const exercises = loadExercises();
    const skillTrees = getAllSkillTrees();
    const { user, userTrainingDays, places } =
      generateProfessionalKneePainPlanInputs();
    const trainingPlan = PlanGenerator.generatePlan(
      user,
      exercises,
      skillTrees,
      {},
      userTrainingDays,
      places,
      new Date(2026, 0, 12),
    );
    const maxStrengthSection = trainingPlan.sections.findIndex(
      (section) => section.type === "MAX",
    );

    const entries = generateWorkout({
      type: "PLAN",
      user: { ...user, trainingPlan },
      place: "STUDIO",
      exercises,
      skillTrees,
      weekday: 3,
      equipment: places.STUDIO.equipment,
      givenSection: maxStrengthSection,
      daysSinceLastWorkout: 0,
      userExerciseData: { exerciseData: {}, branchData: {} },
    });

    expect(entries.some((entry) => entry.skill === "MAX")).toBe(true);
    expect(entries.some((entry) => entry.skill.startsWith("PREV"))).toBe(true);
  });
});
