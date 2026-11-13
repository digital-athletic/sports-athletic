import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { selectStoredTrainingDay } from "@/features/training/storedTrainingDaySelection";
import { requireOldTraining } from "@/features/training/utils/testFixtures";
import { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import type { UserType } from "@/schemas/user.schema";
import { setUpAiwlGeneratorFlag } from "@test/factories/generatorFlags";
import { generatePlanGenerationInput } from "@test/factories/planGenerationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateTrainingPlan } from "./planGeneration";
import type { PlanGenerationInput } from "./planGenerationInput/planGenerationInput";

const SEED = 20261102;
/** Thursday, the studio day of the default weekly schedule. */
const STUDIO_WEEKDAY = 3;

/**
 * Builds the athlete's stored user around a generated plan.
 *
 * generateUserWithPlan(input, plan)
 * → { userId: "plan-user", personalData, workoutData, trainingPlan: plan }
 */
const generateUserWithPlan = (
  { athlete }: PlanGenerationInput,
  trainingPlan: TrainingPlanType,
): UserType => ({
  userId: "plan-user",
  personalData: athlete.personalData,
  workoutData: athlete.workoutData,
  trainingPlan,
});

describe("generateTrainingPlan: plan start", () => {
  it("dates the plan and its first section from the input's plan start date", () => {
    const input = generatePlanGenerationInput({ planStartDate: "2026-11-04" });

    const plan = generateTrainingPlan(input);

    expect([plan.start, plan.sections[0].start]).toEqual([
      "2026-11-04",
      "2026-11-09",
    ]);
  });
});

describe("generateTrainingPlan: training days", () => {
  it("holds one training per active weekday of the schedule in each section", () => {
    const input = generatePlanGenerationInput();
    const activeWeekdays = input.weeklySchedule
      .filter(({ active }) => active)
      .map(({ weekday }) => weekday);

    const plan = generateTrainingPlan(input);

    expect(plan.sections.length).toBeGreaterThan(0);
    for (const { trainings } of plan.sections) {
      expect(trainings.map(({ weekday }) => weekday).sort()).toEqual(
        activeWeekdays,
      );
    }
  });
});

describe("generateTrainingPlan: errors", () => {
  it("throws the missing workout data error for a missing season phase type", () => {
    const input = generatePlanGenerationInput({
      seasonPhase: { type: null, endDate: "" },
    });

    expect(catchThrownValue(() => generateTrainingPlan(input))).toMatchObject({
      type: "NO_ANAMNESIS",
      subtype: "MISSING_WORKOUT_DATA",
    });
  });

  it("throws the configuration error for missing section templates", () => {
    const base = generatePlanGenerationInput();
    const input = generatePlanGenerationInput({
      authoredData: { ...base.authoredData, sectionTemplates: {} },
    });

    expect(catchThrownValue(() => generateTrainingPlan(input))).toMatchObject({
      type: "OTHER",
      subtype: "OTHER",
    });
  });

  it("throws the configuration error for missing region configurations", () => {
    const base = generatePlanGenerationInput();
    const input = generatePlanGenerationInput({
      authoredData: { ...base.authoredData, regionConfigs: {} },
    });

    expect(catchThrownValue(() => generateTrainingPlan(input))).toMatchObject({
      type: "OTHER",
      subtype: "OTHER",
    });
  });
});

describe("generateTrainingPlan: workout generator day lookup", () => {
  setUpAiwlGeneratorFlag(true);

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("finds the weekday's training of the second section on a date inside it", () => {
    const input = generatePlanGenerationInput({
      random: generateSeededRandom(SEED),
    });
    const plan = generateTrainingPlan(input);
    jest.setSystemTime(new Date(`${plan.sections[1].start}T12:00:00`));
    const [firstSectionDay, secondSectionDay] = plan.sections.map(
      ({ trainings }) =>
        requireOldTraining(
          trainings.filter(({ weekday }) => weekday === STUDIO_WEEKDAY)[0],
        ),
    );

    const storedDay = selectStoredTrainingDay(
      generateUserWithPlan(input, plan),
      STUDIO_WEEKDAY,
      undefined,
      0,
    );

    // The sections must differ, or a lookup of the first section passes too.
    expect(secondSectionDay.skills).not.toEqual(firstSectionDay.skills);
    expect(storedDay).toEqual({
      skills: secondSectionDay.skills,
      lengths: secondSectionDay.lengths,
    });
  });

  it("builds a set list from the skills of the weekday's training in the second section", () => {
    const input = generatePlanGenerationInput({
      random: generateSeededRandom(SEED),
    });
    const plan = generateTrainingPlan(input);
    jest.setSystemTime(new Date(`${plan.sections[1].start}T12:00:00`));
    const secondSectionDay = requireOldTraining(
      plan.sections[1].trainings.filter(
        ({ weekday }) => weekday === STUDIO_WEEKDAY,
      )[0],
    );

    const setList = generateWorkout({
      type: "PLAN",
      user: generateUserWithPlan(input, plan),
      place: "STUDIO",
      exercises: loadExercises(),
      skillTrees: getAllSkillTrees(),
      weekday: STUDIO_WEEKDAY,
      equipment: input.trainingPlaces.STUDIO.equipment,
      givenSection: undefined,
      daysSinceLastWorkout: 0,
      userExerciseData: { exerciseData: {}, branchData: {} },
    });

    // Pause entries carry the placeholder branch "-1".
    const exerciseEntries = setList.filter(({ branchId }) => branchId !== "-1");
    expect(new Set(exerciseEntries.map(({ branchId }) => branchId))).toEqual(
      new Set(
        Object.values(secondSectionDay.skills).flatMap((branches) =>
          branches.map(({ branchId }) => branchId),
        ),
      ),
    );
  });
});
