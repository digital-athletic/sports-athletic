import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { selectStoredTrainingDay } from "@/features/training/storedTrainingDaySelection";
import { requireAiwlTraining } from "@/features/training/utils/testFixtures";
import { toExerciseBranch } from "@/features/training/exerciseSwap/exerciseSwap";
import { readTrainingDayWorkout } from "@/features/training/workoutGenerator/trainingDayWorkout";
import { generateSetList } from "@/features/training/workoutGenerator/workoutGeneration";
import { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import { TemplateSchema } from "@/schemas/aiwl.schema";
import type { UserType } from "@/schemas/user.schema";
import * as v from "valibot";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generatePlanGenerationInput } from "@test/factories/planGenerationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateTrainingPlan } from "./planGeneration";
import type { PlanGenerationInput } from "./planGenerationInput/planGenerationInput";

const SEED = 20261102;
/** Thursday, the studio day of the default weekly schedule. */
const STUDIO_WEEKDAY = 3;
const SECONDS_PER_MINUTE = 60;

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
        requireAiwlTraining(
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
    expect(secondSectionDay.workout).not.toEqual(firstSectionDay.workout);
    expect(storedDay).toEqual(secondSectionDay.workout);
  });
});

describe("generateTrainingPlan: end to end with the workout generator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Creates a plan with the new plan generator and generates the set list of
   * the studio day in the second section, as the athlete trains it.
   */
  const generateStudioDay = () => {
    const input = generatePlanGenerationInput({
      random: generateSeededRandom(SEED),
    });
    const plan = generateTrainingPlan(input);
    jest.setSystemTime(new Date(`${plan.sections[1].start}T12:00:00`));
    const training = requireAiwlTraining(
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
    // Pause and support entries carry a placeholder branch.
    const exerciseEntries = setList.filter(
      ({ branchId }) => !isPlaceholderBranch(branchId),
    );
    return { plan, training, setList, exerciseEntries };
  };

  it("marks the plan as AIWL and writes each training as a valid AIWL workout", () => {
    const { plan } = generateStudioDay();

    expect(plan.format).toBe("aiwl");
    for (const { trainings } of plan.sections) {
      for (const training of trainings) {
        expect(
          v.safeParse(TemplateSchema, requireAiwlTraining(training).workout)
            .success,
        ).toBe(true);
      }
    }
  });

  it("writes the blocks in the order of the section's skills", () => {
    const { training } = generateStudioDay();

    // the cardio day of the default schedule budgets its skills in this order
    expect(training.workout.blocks.map(({ skill }) => skill)).toEqual([
      "CARDIO_2",
      "MOB",
      "CD",
    ]);
  });

  it("trains the skills of the planned blocks", () => {
    const { training, setList } = generateStudioDay();

    // the set list builder orders the skills by the training day timing
    expect(new Set(setList.map(({ skill }) => skill))).toEqual(
      new Set(training.workout.blocks.map(({ skill }) => skill)),
    );
  });

  it("trains the same set list as a legacy training of the same branches and minutes", () => {
    const { training } = generateStudioDay();
    const createInput = () =>
      generateGenerationInput({
        exerciseCatalog: loadExercises(),
        equipment:
          generatePlanGenerationInput().trainingPlaces.STUDIO.equipment,
        random: generateSeededRandom(SEED),
      });
    const { branchLookupIndex } = createInput();
    const branchesBlocks = training.workout.blocks.flatMap((block) =>
      block.kind === "branches" ? [block] : [],
    );
    const legacyDay = {
      skills: Object.fromEntries(
        branchesBlocks.map(({ skill, branches }) => [
          skill,
          branches.map((branchId) => {
            const indexed = branchLookupIndex.get(branchId);
            if (!indexed) throw new Error(`No catalog branch ${branchId}`);
            return toExerciseBranch({ branchId, branch: indexed.branch });
          }),
        ]),
      ),
      lengths: Object.fromEntries(
        branchesBlocks.map(({ skill, duration }) => [
          skill,
          (duration ?? 0) / SECONDS_PER_MINUTE,
        ]),
      ),
    };

    const aiwlDay = readTrainingDayWorkout(training.workout);
    const legacyDayWorkout = readTrainingDayWorkout(legacyDay);

    expect(
      generateSetList(aiwlDay.workout, aiwlDay.lookUpBranch, createInput()),
    ).toEqual(
      generateSetList(
        legacyDayWorkout.workout,
        legacyDayWorkout.lookUpBranch,
        createInput(),
      ),
    );
  });

  it("trains the planned branches of each block", () => {
    const { training, exerciseEntries } = generateStudioDay();

    const plannedBranches = new Map(
      training.workout.blocks.map((block) => [
        block.skill,
        block.kind === "branches" ? block.branches : [],
      ]),
    );
    for (const { skill, branchId } of exerciseEntries) {
      expect(plannedBranches.get(skill)).toContain(branchId);
    }
    expect(new Set(exerciseEntries.map(({ branchId }) => branchId))).toEqual(
      new Set([...plannedBranches.values()].flat()),
    );
  });
});
