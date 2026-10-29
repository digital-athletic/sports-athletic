import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import PlanGenerator from "@/features/training/generators/PlanGenerator";
import type { ExerciseProgressSourceType } from "@/features/training/models/ExerciseProgress";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { useTrainingStore } from "@/features/training/trainingStore";
import { toUserExerciseDataList } from "@/schemas/generator.schema";
import { useAuthStore } from "@/store/authStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { generateAdvancedWorkoutData } from "./completionAthlete";
import {
  generateFrontSquatBranchData,
  generateFrontSquatPlanUser,
  generateFrontSquatRecord,
  generateStudioWorkoutRequest,
} from "./frontSquatWorkout";
import { generateStudioPlanInputs } from "./studioPlanInputs";
import { generateStoredProgress } from "./storedExerciseData";

/**
 * Reads the stored progress the generation hook hands to the generator: the
 * records per skill and the older record per exercise.
 *
 * readStoredProgress()
 * → { exerciseProgress: { SA: { "118": { ... } } }, exerciseData: {} }
 */
export const readStoredProgress = (): ExerciseProgressSourceType => {
  const { exerciseProgress, exerciseData } =
    useExerciseProgressStore.getState();
  return { exerciseProgress, exerciseData };
};

/**
 * Builds the studio request of a workout from the progress in the store and
 * the pinned front squat branch, on Monday unless given.
 *
 * generateStoredProgressRequest("PLAN")
 * → { type: "PLAN", weekday: 1, userExerciseData: { exerciseProgress: <store>, exerciseData: <store>, branchData: { "22": ... } }, ... }
 */
export const generateStoredProgressRequest = (type: string, weekday = 1) =>
  generateStudioWorkoutRequest(
    type,
    generateFrontSquatPlanUser(weekday),
    { ...readStoredProgress(), branchData: generateFrontSquatBranchData() },
    weekday,
  );

/**
 * Starts a training session on a generated set list, ready to save its sets.
 *
 * setUpActiveTraining(setList, "first-session", "short-id")
 * → training store: { exerciseList: <user exercise data>, activeTraining: { id: "first-session", type: "short-id" } }
 */
export const setUpActiveTraining = (
  setList: GeneratedSetListEntry[],
  sessionId: string,
  type: string,
) => {
  useTrainingStore.setState({
    exerciseList: toUserExerciseDataList(setList),
    activeTraining: { id: sessionId, type },
  });
};

/**
 * Prepares a generated plan, the SWR1 record of its first SWR1 exercise
 * (26 kg, 11 repetitions) and the stores that the plan update hook reads.
 * Fixes Math.random and the clock, so both plans hold the same days.
 *
 * setUpRecreatedPlanScenario()
 * → { user, firstPlan, swr1Training, level: "1", exerciseId: "118", branchId: "22" }
 */
export const setUpRecreatedPlanScenario = () => {
  // the first candidate wins every draw, so both plans hold the same days
  jest.spyOn(Math, "random").mockReturnValue(0);
  // the workout of today comes from the first section of the plan
  const startDate = new Date(2026, 0, 12);
  jest.useFakeTimers().setSystemTime(startDate);
  const { user, userTrainingDays, places } = generateStudioPlanInputs();
  const firstPlan = PlanGenerator.generatePlan(
    user,
    loadExercises(),
    getAllSkillTrees(),
    {},
    userTrainingDays,
    places,
    startDate,
  );
  const swr1Training = firstPlan.sections[0]?.trainings.find(
    (training) => training.skills.SWR1?.length,
  );
  const swr1Entry = swr1Training?.skills.SWR1?.[0];
  const [level, { exerciseId }] = Object.entries(swr1Entry?.exercises ?? {})[0];
  useExerciseProgressStore.setState(
    generateStoredProgress(
      generateFrontSquatRecord("SWR1", {
        exerciseId,
        weight: 26,
        repetition: 11,
      }),
    ),
  );
  useAuthStore.setState({ auth: { userId: user.userId } });
  useUserWorkoutStore.setState({
    workoutData: { ...generateAdvancedWorkoutData(), ...user.workoutData },
    trainingPlan: firstPlan,
  });
  useTrainingScheduleStore.setState({ trainingDays: userTrainingDays });
  usePlacesStore.setState({ places });
  return {
    user,
    firstPlan,
    swr1Training,
    level,
    exerciseId,
    branchId: swr1Entry?.branchId ?? "",
  };
};
