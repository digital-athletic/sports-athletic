import { useExerciseCompletion } from "@/features/training/hooks/useExerciseCompletion";
import { useUpdateTrainingPlan } from "@/features/training/hooks/useUpdateTrainingPlan";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import type { SkillCode } from "@/schemas/generator.schema";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { act, renderHook } from "@testing-library/react-native";
import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import {
  generateAdultMalePersonalData,
  generateAdvancedWorkoutData,
} from "@test/factories/completionAthlete";
import {
  FRONT_SQUAT_EXERCISE_ID,
  generateFrontSquatRecord,
  generateFrontSquatTemplate,
  generateStudioWorkoutRequest,
} from "@test/factories/frontSquatWorkout";
import {
  generateStoredProgressRequest,
  readStoredProgress,
  seedSharedSkillWorkouts,
  setUpActiveTraining,
  setUpRecreatedPlanScenario,
} from "@test/factories/progressPerSkillScenarios";
import {
  generateExerciseDataMap,
  generateStoredProgress,
} from "@test/factories/storedExerciseData";

/**
 * Weight and repetition of the last front squat set of a set list, the set
 * after the warm up sets.
 *
 * frontSquatValues(setList)
 * → { weight: 26, repetition: 11 }
 */
const frontSquatValues = (setList: GeneratedSetListEntry[]) => {
  const entry = setList.findLast(
    (candidate) => candidate.exerciseId === FRONT_SQUAT_EXERCISE_ID,
  );
  return { weight: entry?.weight, repetition: entry?.repetition };
};

/**
 * Index of the last set of the front squat, the set that saves the progress.
 *
 * lastFrontSquatIndex(setList)
 * → 5
 */
const lastFrontSquatIndex = (setList: GeneratedSetListEntry[]) =>
  setList.findLastIndex(
    (candidate) => candidate.exerciseId === FRONT_SQUAT_EXERCISE_ID,
  );

/**
 * Reads the stored front squat record of a skill.
 *
 * progressOf("SWR1")
 * → { exerciseId: "118", skill: "SWR1", weight: 26, repetition: 11, updatedAt: 1761550000 }
 */
const progressOf = (skill: SkillCode) =>
  useExerciseProgressStore.getState().exerciseProgress[skill]?.[
    FRONT_SQUAT_EXERCISE_ID
  ];

/**
 * Saves a short workout of the front squat under the given skill and returns
 * its template ID.
 *
 * saveFrontSquatWorkout("SA")
 * → "<uuid>"
 */
const saveFrontSquatWorkout = (skill: SkillCode) =>
  useCustomWorkoutsStore
    .getState()
    .saveCustomWorkout(
      generateFrontSquatTemplate(skill.toLowerCase(), skill),
      null,
    ).id;

setUpAiwlGeneratorFlag(true);

beforeEach(() => {
  useTrainingStore.setState(BASELINE_TRAINING_STATE);
  useUserWorkoutStore.setState({ workoutData: generateAdvancedWorkoutData() });
  useUserProfileStore.setState({
    personalData: generateAdultMalePersonalData(),
  });
  useExerciseProgressStore.getState().resetProgress();
});

afterEach(() => {
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("Progress per skill: plan day and short workout", () => {
  it("starts the plan day from the SWR1 record and the short workout from the SA record", () => {
    const shortWorkoutId = saveFrontSquatWorkout("SA");
    useExerciseProgressStore.setState(
      generateStoredProgress(
        generateFrontSquatRecord("SWR1", { weight: 26, repetition: 11 }),
        generateFrontSquatRecord("SA", { weight: 20, repetition: 12 }),
      ),
    );

    const planDay = generateWorkout(generateStoredProgressRequest("PLAN"));
    const shortWorkout = generateWorkout(
      generateStoredProgressRequest(shortWorkoutId),
    );

    expect(frontSquatValues(planDay)).toEqual({ weight: 26, repetition: 11 });
    expect(frontSquatValues(shortWorkout)).toEqual({
      weight: 20,
      repetition: 12,
    });
  });

  it("writes a completed short workout into the SA record and leaves the SWR1 record alone", async () => {
    const shortWorkoutId = saveFrontSquatWorkout("SA");
    const swr1Record = generateFrontSquatRecord("SWR1", {
      weight: 26,
      repetition: 11,
    });
    useExerciseProgressStore.setState(
      generateStoredProgress(
        swr1Record,
        generateFrontSquatRecord("SA", { weight: 20, repetition: 12 }),
      ),
    );
    const shortWorkout = generateWorkout(
      generateStoredProgressRequest(shortWorkoutId),
    );
    setUpActiveTraining(shortWorkout, "short-session", shortWorkoutId);
    const { result } = await renderHook(() => useExerciseCompletion());

    await act(() =>
      result.current.saveExerciseAndBranchData(
        lastFrontSquatIndex(shortWorkout),
      ),
    );

    expect(progressOf("SA")).toMatchObject({
      skill: "SA",
      weight: 20,
      repetition: 12,
      updatedAt: expect.any(Number),
    });
    expect(progressOf("SWR1")).toEqual(swr1Record);
  });
});

describe("Progress per skill: two workouts sharing a skill", () => {
  it("starts the second workout where the first one ended", async () => {
    const { first, second } = seedSharedSkillWorkouts();
    const firstWorkout = generateWorkout(
      generateStoredProgressRequest(first.id),
    );
    setUpActiveTraining(firstWorkout, "first-session", first.id);
    const completion = await renderHook(() => useExerciseCompletion());
    await act(() =>
      completion.result.current.saveExerciseAndBranchData(
        lastFrontSquatIndex(firstWorkout),
      ),
    );

    // the TOO_EASY step of the SA record moves the first workout off 20 kg and 9 repetitions
    expect(frontSquatValues(firstWorkout)).not.toEqual({
      weight: 20,
      repetition: 9,
    });
    expect(progressOf("SA")).toMatchObject({
      skill: "SA",
      weight: frontSquatValues(firstWorkout).weight,
      repetition: frontSquatValues(firstWorkout).repetition,
      updatedAt: expect.any(Number),
    });
    const secondWorkout = generateWorkout(
      generateStoredProgressRequest(second.id),
    );
    expect(frontSquatValues(secondWorkout)).toEqual(
      frontSquatValues(firstWorkout),
    );
  });
});

describe("Progress per skill: moved training day", () => {
  it("generates the same values on Thursday as on Monday", () => {
    useExerciseProgressStore.setState(
      generateStoredProgress(
        generateFrontSquatRecord("SWR1", { weight: 26, repetition: 11 }),
      ),
    );

    const monday = generateWorkout(generateStoredProgressRequest("PLAN", 1));
    const thursday = generateWorkout(generateStoredProgressRequest("PLAN", 4));

    expect(frontSquatValues(monday)).toEqual({ weight: 26, repetition: 11 });
    expect(frontSquatValues(thursday)).toEqual(frontSquatValues(monday));
  });
});

describe("Progress per skill: recreated plan", () => {
  it("keeps the records and continues the next SWR1 day from them", async () => {
    const { user, firstPlan, swr1Training, level, exerciseId, branchId } =
      setUpRecreatedPlanScenario();
    const recordsBefore = structuredClone(readStoredProgress());

    // The settings screens recreate the plan through this hook.
    const { result } = await renderHook(() => useUpdateTrainingPlan());
    await act(() => result.current.updateTrainingPlan({ redrawAllDays: true }));
    const recreatedPlan = useUserWorkoutStore.getState().trainingPlan;
    const nextDay = generateWorkout(
      generateStudioWorkoutRequest(
        "PLAN",
        { ...user, trainingPlan: recreatedPlan },
        {
          ...readStoredProgress(),
          branchData: {
            [branchId]: { branchId, level: Number(level), exerciseId },
          },
        },
        swr1Training?.weekday,
      ),
    );

    expect(recreatedPlan).not.toBe(firstPlan);
    expect(readStoredProgress()).toEqual(recordsBefore);
    expect(
      nextDay.find(
        (entry) => entry.skill === "SWR1" && entry.exerciseId === exerciseId,
      )?.repetition,
    ).toBe(11);
  });
});

describe("Progress per skill: a new skill", () => {
  it("starts from its start values although another skill trained the exercise", () => {
    const id = saveFrontSquatWorkout("SWR2KG");
    const withoutRecords = generateWorkout(generateStoredProgressRequest(id));
    // SWR1 and SA trained the front squat, SWR2KG never did.
    useExerciseProgressStore.setState(
      generateStoredProgress(
        generateFrontSquatRecord("SWR1", {
          weight: 30,
          repetition: 11,
          feedback: { difficulty: "TOO_EASY" },
          updatedAt: 100,
        }),
        generateFrontSquatRecord("SA", { weight: 40, repetition: 8 }),
      ),
    );

    const newSkill = generateWorkout(generateStoredProgressRequest(id));

    expect(frontSquatValues(newSkill)).toEqual(
      frontSquatValues(withoutRecords),
    );
  });
});

describe("Progress per skill: athlete with only the older record per exercise", () => {
  it("continues the stored skill from the older record and starts another skill from its start values", () => {
    const shortWorkoutId = saveFrontSquatWorkout("SA");
    const freshShortWorkout = generateWorkout(
      generateStoredProgressRequest(shortWorkoutId),
    );
    // An athlete who trained before the records per skill existed.
    useExerciseProgressStore.setState({
      exerciseProgress: {},
      exerciseData: generateExerciseDataMap(
        generateFrontSquatRecord("SWR1", { weight: 26, repetition: 11 }),
      ),
    });

    const planDay = generateWorkout(generateStoredProgressRequest("PLAN"));
    const shortWorkout = generateWorkout(
      generateStoredProgressRequest(shortWorkoutId),
    );

    expect(frontSquatValues(planDay)).toEqual({ weight: 26, repetition: 11 });
    expect(frontSquatValues(shortWorkout)).toEqual(
      frontSquatValues(freshShortWorkout),
    );
  });
});
