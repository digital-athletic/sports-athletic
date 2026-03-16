import { Ionicon } from "@/common/Ionicon";
import { TagGroups } from "@/constants/tagGroups";
import {
  ExerciseDifficultyType,
  isLevelTag,
  isSkillTypes,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import {
  FOOTER_HEIGHT,
  TrainingFooter,
} from "@/features/training/TrainingFooter";
import { TrainingNavigation } from "@/features/training/TrainingNavigation";
import { getIntensityBySkill } from "@/features/training/generators/TrainingGenerator";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import type { SkillCode } from "@/schemas/generator.schema";
import { useTrainingStore } from "@/features/training/trainingStore";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import {
  applyBranchLevelUpdate,
  type BranchLevelContext,
  calculateBranchLevelUpdate,
  type TrainingPlanContext,
} from "@/features/training/utils/branchLevelUtils";
import {
  calculateNewWeight,
  calculateStandardExerciseAdjustment,
  type ExerciseAdjustmentContext,
  findMainCardioExercise,
  getResetDuration,
  getResetRepetition,
  shouldProcessExerciseValues,
} from "@/features/training/utils/exerciseDataUtils";
import { heartRateBySkillAndBirthday } from "@/features/training/utils/heartRateUtils";
import { getLastMaxFRep } from "@/features/training/utils/maxFRepetitionsUtils";
import {
  getSkillTree,
  isPreventionSkill,
  mapSkillCodeToFocusArea,
} from "@/features/training/utils/skillTreeUtils";
import {
  applyMaxValueToDirections,
  calculateAdjustedMaxValues,
  deriveWeightForExercise,
  getMaxValueForExercise,
  getRoundedResultForValueAndStep,
  isInclineBenchPress,
  maxWeightByEpley,
} from "@/features/training/utils/workoutUtils";
import { isTrainingLevel } from "@/schemas/common.schema";
import { Logger } from "@/services/Logger";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTheme } from "@/theme/theme";
import {
  getTagValues,
  getUserTagValue,
  getUserTagValues,
} from "@/utils/tagUtils";
import { VideoPlayer } from "@/video/VideoPlayer";
import { useKeepAwake } from "expo-keep-awake";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TRAINING_INPUT_OFFSET = 100;

type TrainingActiveProps = Record<string, never>;

/**
 * Active training execution screen - displays exercises, tracks progress.
 * Prevents accidental exits during training via disabled back gestures.
 * Legacy: views/training/Training
 */
const TrainingActive: FC<TrainingActiveProps> = () => {
  useKeepAwake();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Training store state
  const {
    equipment,
    exerciseList,
    activeTraining,
    addPauseTime,
    addSkillTime,
    setTrainingEndTime,
    setExerciseSkipped,
    setExerciseFeedback,
  } = useTrainingStore();
  const skillTrees = getAllSkillTrees();
  const {
    branchData,
    setBranchLevel,
    updateExercise,
    addTestResult,
    updateUserExerciseTotals,
  } = useExerciseProgressStore();
  const { personalData } = useUserProfileStore();
  const { workoutData, replaceBranchInTrainingPlan, saveMaxValues } =
    useUserWorkoutStore();

  // Local state
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const [maxFWarningPopUpShowable, setMaxFWarningPopUpShowable] =
    useState(true);
  const [weightCalculationPopUpShowable, setWeightCalculationPopUpShowable] =
    useState(true);
  const exerciseStartTimeRef = useRef<number>(Date.now());
  const pauseStartRef = useRef<number>(Date.now());
  const [isSkipped, setIsSkipped] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  // Temporary storage for test workout results, only committed on successful completion
  const [tempMaxValues, setTempMaxValues] = useState<MaxValuesType | null>(
    null,
  );

  const headerTitle = useMemo(() => {
    const type = activeTraining?.type;

    if (!type) {
      return t("training.active.title.plan");
    }

    // Strength test
    if (type === "TEST_WORKOUT") {
      return t("training.active.title.strengthTest");
    }

    // Focus or Prevention training
    if (isSkillTypes(type)) {
      return t(`training.skill.${type}`, {
        defaultValue: isPreventionSkill(type)
          ? t("training.active.title.prevention")
          : t("training.active.title.focus"),
      });
    }

    return t("training.active.title.plan");
  }, [activeTraining?.type, t]);

  const currentExercise = exerciseList?.[activeExerciseIndex];
  const exerciseId = currentExercise?.exerciseId ?? "-1";
  const isPauseExercise = checkIsPauseExercise(exerciseId);
  const currentExerciseData = getExerciseById(exerciseId);

  const nextExerciseIndex = activeExerciseIndex + 1;
  const hasNextExercise = nextExerciseIndex < (exerciseList?.length ?? 0);
  const nextExercise = hasNextExercise
    ? exerciseList?.[nextExerciseIndex]
    : undefined;
  const isNextExercisePause = nextExercise
    ? checkIsPauseExercise(nextExercise.exerciseId)
    : false;
  const nextExerciseData = nextExercise
    ? getExerciseById(nextExercise.exerciseId)
    : undefined;

  const logTrainingEvent = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      if (!activeTraining) return;

      const eventData = {
        type: activeTraining.type,
        ...data,
      };

      if (isPreventionSkill(activeTraining.type)) {
        Logger.logEvent(`prevention_${eventName}`, eventData);
      }
      Logger.logEvent(eventName, eventData);
    },
    [activeTraining],
  );

  // strengthTestMaxValues is passed directly for strength tests to avoid React state batching issues.
  // For non-test workouts (PREV, FOCUS, PLAN), strengthTestMaxValues is undefined and the
  // TEST_WORKOUT check below ensures no max values are saved.
  const saveAndNavigateToSuccess = useCallback(
    (
      aborted: boolean = false,
      strengthTestMaxValues?: MaxValuesType | null,
    ) => {
      try {
        // Record end time
        setTrainingEndTime(Date.now());

        // Log completion/abortion
        if (aborted) {
          logTrainingEvent("training_aborted");
        } else {
          logTrainingEvent("training_finished");
        }

        // Save test results if this is a test workout and not aborted
        if (
          activeTraining?.type === "TEST_WORKOUT" &&
          !aborted &&
          strengthTestMaxValues
        ) {
          Logger.logEvent("saving_max_values", {
            maxValues: strengthTestMaxValues,
          });
          saveMaxValues(strengthTestMaxValues);
          addTestResult(strengthTestMaxValues);
        }

        // Clear temporary test results (committed or discarded)
        setTempMaxValues(null);

        // Navigate to success screen
        router.push({
          pathname: "/training/training-success",
          params: { aborted: aborted.toString() },
        });
      } catch (error) {
        Logger.logError(error as Error);
        Alert.alert(t("common.error"), t("common.error"));
      }
    },
    [
      activeTraining?.type,
      addTestResult,
      saveMaxValues,
      logTrainingEvent,
      router,
      setTrainingEndTime,
      t,
    ],
  );

  const saveBranchData = (
    skill: SkillCode,
    branchId: string,
    exerciseId: string,
  ) => {
    const userExerciseBranch = branchData[branchId];
    if (branchId !== "-1" && !userExerciseBranch) {
      // first time an exercise of this branch was completed => save level
      const newSkillTree = Object.assign(
        getSkillTree(skillTrees, skill, [], true),
        getSkillTree(skillTrees, skill, [], false),
      );
      const newBranch = newSkillTree[branchId];
      if (newBranch) {
        const levels = newBranch.levels;

        let userLevelString: string = WorkoutConstants.LEVELS.ADVANCED;
        if (workoutData) {
          userLevelString =
            getUserTagValue(workoutData.tags, TagGroups.LEVEL) ??
            WorkoutConstants.LEVELS.ADVANCED;
        }
        const userLevel =
          userLevelString === WorkoutConstants.LEVELS.BEGINNER
            ? 1
            : userLevelString === WorkoutConstants.LEVELS.ADVANCED
              ? 2
              : 3;
        let newLevel = -1;
        if (levels[userLevel] && levels[userLevel].exerciseId === exerciseId) {
          newLevel = userLevel;
        } else {
          const match = Object.entries(levels).find(
            ([_, v]) => v.exerciseId === exerciseId,
          );
          if (match && !isNaN(parseInt(match[0]))) {
            newLevel = parseInt(match[0]);
          }
        }
        if (newLevel > 0) {
          setBranchLevel(branchId, newLevel);
          Logger.logEvent("save_initial_branch_data", {
            skill: skill,
            branchId: branchId,
            level: newLevel,
          });
        } else {
          Logger.logEvent("save_initial_branch_data_failed_no_level_found", {
            skill: skill,
            branchId: branchId,
            exerciseId: exerciseId,
          });
        }
      }
    } else {
      Logger.logEvent("save_initial_branch_data_failed_no_branch_found", {
        skill: skill,
        branchId: branchId,
        exerciseId: exerciseId,
      });
    }
  };

  const updateBranchLevel = (
    levelUp: boolean,
    branchId: string,
    exerciseId: string,
    skill: SkillCode,
    ageGroup: string,
  ) => {
    const context: BranchLevelContext = {
      skillTrees,
      branchData,
      equipment,
      gender: personalData.gender,
      exerciseList,
    };

    const planContext: TrainingPlanContext = {
      type: activeTraining?.type ?? "",
      sectionIndex: activeTraining?.sectionIndex,
      weekday: activeTraining?.weekday,
    };

    const result = calculateBranchLevelUpdate(
      { levelUp, branchId, exerciseId, skill, ageGroup },
      context,
      planContext,
    );

    // Log the result
    switch (result.type) {
      case "SAME_BRANCH":
        Logger.logEvent(
          "branch_level_" + (levelUp ? "increased" : "decreased"),
          {
            branchId: result.branchId,
            newBranchLevel: result.newLevel,
          },
        );
        break;
      case "BRANCH_SUBSTITUTION":
        Logger.logEvent("branch_changed_for_new_level", {
          previousBranchId: result.previousBranchId,
          newBranchIds: result.equivalentBranches.map((eb) => eb?.branchId),
        });
        break;
      case "NO_CHANGE":
        if (result.reason === "same_branch_found") {
          Logger.logEvent("branch_not_changed_because_only_found_the_same", {
            branchId: result.branchId,
          });
        } else {
          Logger.logEvent(
            "branch_not_changed_because_no_matching_branch_found",
            { branchId: result.branchId },
          );
        }
        break;
      case "BRANCH_NOT_FOUND":
        Logger.logEvent(
          "Branch with id " + result.branchId + " not found for leveling up",
        );
        break;
    }

    applyBranchLevelUpdate(result, {
      setBranchLevel,
      replaceBranchInTrainingPlan,
    });
  };

  /**
   * saves the user exercise values
   * these values where adjusted in the training generator
   *
   * checks if the branch level needs to increase and changes exercise in training plan
   */
  const saveExerciseAndBranchData = () => {
    // Skip saving for pause exercises
    if (isPauseExercise) {
      Logger.logEvent("pause_exercise_no_data_saved", { exerciseId });
      return;
    }

    const skill = currentExercise?.skill;
    let branchId = currentExercise?.branchId;
    let id = exerciseId;
    let currentExerciseData = getExerciseById(id);

    if (skill && typeof branchId === "string" && !isPauseExercise) {
      saveBranchData(skill, branchId, exerciseId);
    }

    // Save user general data
    const weight = currentExercise?.weight ?? 0;
    const duration = currentExercise?.duration ?? 0;
    const height = currentExercise?.height ?? 0;
    const weightPercentage = currentExercise?.nextWeightPercentage ?? 0;
    const maxFRepetitions = currentExercise?.maxFRepetitions ?? [];
    const reps = currentExercise?.repetition ?? 0;

    if (reps === -1) {
      // Is test exercise, don't save
      Logger.logEvent("test_exercise_no_data_saved", { exerciseId: id });
      return;
    }

    // do not increase exercises values in all workouts
    const type = activeTraining?.type;

    const levelTagValues = getUserTagValue(workoutData.tags, TagGroups.LEVEL);
    const levelTag = isLevelTag(levelTagValues) ? levelTagValues : undefined;
    const lowercaseTag = levelTag?.toLowerCase();
    const userLevel = isTrainingLevel(lowercaseTag) ? lowercaseTag : undefined;

    if (shouldProcessExerciseValues(type, skill)) {
      let doSave = false;
      // check target values after last of all cardio exercises
      if (skill?.includes("CARDIO")) {
        // save data after last cardio in training
        if (
          !isPauseExercise &&
          (!hasNextExercise ||
            isNextExercisePause ||
            !nextExercise?.skill?.includes("CARDIO"))
        ) {
          const mainCardio = findMainCardioExercise(
            exerciseList,
            activeExerciseIndex,
          );
          if (mainCardio) {
            branchId = mainCardio.branchId;
            id = mainCardio.exerciseId;
            currentExerciseData = getExerciseById(id);
            doSave = true;
          }
        }
      }
      // check target values after last set of max exercises
      else if (skill?.includes("MAX")) {
        if (
          currentExercise?.set &&
          currentExercise.set[0] === currentExercise.set[1]
        ) {
          // choose adjustment for maxF by age, userlevel and level of repetitions
          const ageGroup = ageGroupFor(personalData.birthday);

          // get adjustment of exercise
          const exercise = exerciseList?.findLast(
            (item) => item.exerciseId === exerciseId,
          );
          let adjustment = null;
          if (exercise?.feedback) {
            adjustment = exercise?.feedback.difficulty;
          }

          // get maxFRepetitions and maxFWeightPercentage done in this training
          let maxValue = currentExerciseData
            ? getMaxValueForExercise(currentExerciseData, workoutData.maxValues)
            : null;
          // get weightPercentage done in this training
          let weightPercentage =
            typeof maxValue === "number"
              ? getRoundedResultForValueAndStep((weight / maxValue) * 100, 2.5)
              : null;
          const maxFRepetitionsNew = exercise?.maxFRepetitions ?? [];
          const lastMaxFRep = getLastMaxFRep(exercise?.maxFRepetitions);

          // control adjustments
          let increaseWeight = false;
          let decreaseWeight = false;
          let levelUp = false;
          let levelDown = false;
          const genderTag =
            ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
              ? "k"
              : personalData.gender === "MALE"
                ? "m"
                : "w";
          const maxFRepsHard =
            ageGroup !== "CHILD" && levelTag
              ? WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[
                  ageGroup
                ]?.[levelTag]?.HARD
              : null;

          let maximumWeightPercentage =
            ageGroup !== "CHILD" && maxFRepsHard
              ? Math.max(
                  Object.keys(maxFRepsHard)
                    .map(parseInt)
                    .filter((v) => !isNaN(v))
                    .sort((a, b) => b - a)[0],
                )
              : null;
          // set exercise targetValue if entered from webTool
          const targetValue = currentExerciseData?.values?.weight?.targetValue;
          if (targetValue) {
            if (userLevel && targetValue[genderTag]?.[userLevel]) {
              maximumWeightPercentage = Number(
                targetValue[genderTag][userLevel],
              );
            } else if (userLevel && targetValue.default?.[userLevel]) {
              maximumWeightPercentage = Number(targetValue.default[userLevel]);
            }
          }
          let minimumWeightPercentage = levelTag
            ? WorkoutConstants
                .MAX_KRAFT_MINIMAL_WEIGHT_PERCENTAGE_PER_USER_LEVEL[levelTag]
            : null;
          let equipment = getTagValues(
            currentExerciseData?.tags ?? [],
            TagGroups.EQUIPMENT,
          );
          let exerciseDirections = getTagValues(
            currentExerciseData?.tags ?? [],
            TagGroups.EXERCISE_DIRECTION,
          );
          if (
            isInclineBenchPress(equipment, exerciseDirections) &&
            typeof minimumWeightPercentage === "number"
          ) {
            // reduce minimumWeightPercentage for inclined press
            minimumWeightPercentage =
              minimumWeightPercentage -
              WorkoutConstants.MAX_KRAFT_INCLINE_BENCH_WEIGHT_DIFFERENCE;
          }
          // set exercise startValue if entered from webTool
          if (currentExerciseData?.values?.weight?.startValue) {
            if (
              userLevel &&
              currentExerciseData?.values.weight?.startValue?.[genderTag]?.[
                userLevel
              ]
            ) {
              minimumWeightPercentage = Number(
                currentExerciseData?.values.weight.startValue[genderTag][
                  userLevel
                ],
              );
            } else if (
              userLevel &&
              currentExerciseData?.values.weight?.startValue?.default?.[
                userLevel
              ]
            ) {
              minimumWeightPercentage = Number(
                currentExerciseData?.values.weight.startValue.default[
                  userLevel
                ],
              );
            }
          }
          if (
            (typeof weightPercentage === "number" &&
              typeof maximumWeightPercentage === "number" &&
              weightPercentage >= maximumWeightPercentage &&
              lastMaxFRep?.level === "HARD" &&
              adjustment !== "TOO_HARD") ||
            (lastMaxFRep?.level === "MEDIUM" && adjustment === "TOO_EASY")
          ) {
            // No adjustment if max lvl and max weight is already reached
            updateExercise(
              id,
              {
                exerciseId: id,
                skill,
                feedback: { difficulty: null },
              },
              activeTraining?.id,
            );
            levelUp = true;
          } else if (
            typeof weightPercentage === "number" &&
            typeof minimumWeightPercentage === "number" &&
            weightPercentage <= minimumWeightPercentage &&
            adjustment === "TOO_HARD"
          ) {
            // No adjustment if min weight is already too hard -> levelDown
            updateExercise(
              id,
              {
                exerciseId: id,
                skill,
                feedback: { difficulty: null },
              },
              activeTraining?.id,
            );
            levelDown = true;
          } else if (
            typeof weightPercentage === "number" &&
            typeof maximumWeightPercentage === "number" &&
            weightPercentage >= maximumWeightPercentage &&
            lastMaxFRep?.level === "MEDIUM" &&
            adjustment === "TOO_EASY"
          ) {
            // No TOO_EASY adjustment if max lvl and max weight will be reached
            updateExercise(
              id,
              {
                exerciseId: id,
                skill,
                feedback: { difficulty: "SUCCEEDED" },
              },
              activeTraining?.id,
            );
          } else {
            // adjust weight if needed
            if (
              (lastMaxFRep?.level === "HARD" && adjustment !== "TOO_HARD") ||
              (lastMaxFRep?.level === "MEDIUM" && adjustment === "TOO_EASY")
            ) {
              // adjust weight up if jumping over HARD lvl
              increaseWeight = true;
            } else if (adjustment === "TOO_HARD") {
              // adjust only weight down if is TOO_HARD
              decreaseWeight = true;
            }
          }
          let nextWeightPercentage = weightPercentage ?? undefined;
          if (increaseWeight || decreaseWeight) {
            if (increaseWeight && typeof nextWeightPercentage === "number") {
              nextWeightPercentage +=
                WorkoutConstants.MAX_KRAFT_WEIGHT_ADJUSTMENT["SUCCEEDED"];
            } else if (typeof nextWeightPercentage === "number") {
              nextWeightPercentage -=
                WorkoutConstants.MAX_KRAFT_WEIGHT_ADJUSTMENT["TOO_HARD"];
            }
            // minimum weightPercentage for user
            if (
              typeof nextWeightPercentage === "number" &&
              typeof minimumWeightPercentage === "number" &&
              nextWeightPercentage < minimumWeightPercentage
            )
              nextWeightPercentage = minimumWeightPercentage;
            // prevent bigger than maximum
            if (
              typeof nextWeightPercentage === "number" &&
              typeof maximumWeightPercentage === "number" &&
              nextWeightPercentage > maximumWeightPercentage
            )
              nextWeightPercentage = maximumWeightPercentage;
          } else if (typeof branchId === "string" && (levelUp || levelDown)) {
            updateBranchLevel(levelUp, branchId, id, skill, ageGroup);
          }

          let newWeight = weight;
          let newDuration = duration ? duration : undefined;
          let newRepetition = reps ? reps : undefined;
          // set new exercise values
          updateExercise(
            id,
            {
              exerciseId: id,
              skill,
              weight: newWeight,
              nextWeightPercentage,
              maxFRepetitions: maxFRepetitionsNew,
              maxFLevelAdjustment: adjustment,
              duration: newDuration,
              repetition: newRepetition,
              height,
              weightType: currentExercise.weightType,
              branchId,
              set: currentExercise.set,
            },
            activeTraining?.id,
          );
        }
      }
      // check target values after last set of non cardio and max exercise
      else if (
        currentExercise?.set &&
        currentExercise.set[0] === currentExercise.set[1]
      ) {
        doSave = true;
      }

      if (doSave) {
        // do not increase values for pause/support exercises/others
        if (typeof branchId === "string" && skill) {
          // from data/generator/TestIntensity
          let intensity = getIntensityBySkill(skill);

          // go on if exercise data found
          if (currentExerciseData && userLevel) {
            // use child values or gender otherwise
            const ageGroup = ageGroupFor(personalData.birthday);
            const genderTag =
              ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
                ? "k"
                : personalData.gender === "MALE"
                  ? "m"
                  : "w";

            const adjustmentContext: ExerciseAdjustmentContext = {
              userLevel,
              genderTag,
              ageGroup,
              levelTag,
            };

            const adjustmentResult = calculateStandardExerciseAdjustment(
              weight,
              duration,
              reps,
              currentExerciseData,
              adjustmentContext,
              intensity,
            );

            const levelUp = adjustmentResult.type === "LEVEL_UP";
            const levelDown = adjustmentResult.type === "LEVEL_DOWN";
            const increaseWeight = adjustmentResult.type === "INCREASE_WEIGHT";
            const decreaseWeight = adjustmentResult.type === "DECREASE_WEIGHT";
            // Target-based weight progression for weight exercises:
            // - reps/duration hit target but weight below target → increase weight
            // - reps/duration below start but weight above start → decrease weight
            // Feedback is cleared after to prevent double-adjustment in TrainingGenerator.
            // If user is in the "in between" zone (start <= reps < target), neither
            // this block nor levelUp triggers, and feedback is preserved for
            // TrainingGenerator to adjust all values (reps, duration, height, weight).
            if (increaseWeight || decreaseWeight) {
              const adjustment: ExerciseDifficultyType = increaseWeight
                ? "SUCCEEDED"
                : "TOO_HARD";
              const newWeight = calculateNewWeight(
                weight,
                adjustment,
                currentExerciseData,
                intensity,
              );
              const nextWeightPercentage = weightPercentage || undefined;
              const newDuration =
                getResetDuration(
                  currentExerciseData,
                  intensity,
                  genderTag,
                  userLevel,
                ) ??
                (duration || undefined);
              const newRepetition =
                getResetRepetition(
                  currentExerciseData,
                  intensity,
                  genderTag,
                  userLevel,
                ) ??
                (reps || undefined);

              // set new exercise values
              updateExercise(
                id,
                {
                  exerciseId: id,
                  skill,
                  weight: newWeight,
                  nextWeightPercentage,
                  maxFRepetitions,
                  duration: newDuration,
                  repetition: newRepetition,
                  height,
                  weightType: currentExercise?.weightType,
                  branchId,
                  set: currentExercise?.set,
                },
                activeTraining?.id,
              );

              // set user exercise difficulty to null, so its not adjusted in next training
              updateExercise(
                id,
                {
                  exerciseId: id,
                  skill,
                  feedback: { difficulty: null },
                },
                activeTraining?.id,
              );
              Logger.logEvent(
                "exercise_weight_" +
                  (increaseWeight ? "increased" : "decreased"),
                {
                  exerciseId: id,
                },
              );
            } else if (levelUp || levelDown) {
              updateBranchLevel(levelUp, branchId, id, skill, ageGroup);
            } else {
              // "In between" zone: user didn't hit targets, didn't fall below start.
              // No level or weight change here. Feedback is preserved so TrainingGenerator
              // can adjust all values (reps, duration, height, weight) based on feedback.
              let maxValue = getMaxValueForExercise(
                currentExerciseData,
                workoutData.maxValues,
              );
              let weightPercentage =
                typeof maxValue === "number"
                  ? (weight / maxValue) * 100
                  : undefined;

              updateExercise(
                id,
                {
                  exerciseId: id,
                  skill,
                  weight,
                  nextWeightPercentage: weightPercentage,
                  maxFRepetitions,
                  duration,
                  repetition: reps,
                  height,
                  weightType: currentExercise?.weightType,
                  branchId,
                  set: currentExercise?.set,
                },
                activeTraining?.id,
              );
            }
          }
        }
      }
    }

    // Update cumulative exercise totals
    updateUserExerciseTotals(id, weight, duration, reps, height);

    // save global meta data
    Logger.logEvent("exercise_completed", { exerciseId: id });
  };

  // Strength test only: calculates and stores max values based on reps entered.
  // Returns the updated maxValues to pass directly to saveAndNavigateToSuccess
  // (avoids React state batching issue with setTempMaxValues).
  const saveRepsInput = (repsValue: number): MaxValuesType | null => {
    const directions = WorkoutConstants.TEST_EXERCISES_DIRECTIONS[exerciseId];
    let weight = currentExercise?.weight;
    // add ten percent weight if test exercise used dumbbells
    const isDumbbellExercise = getTagValues(
      currentExerciseData?.tags ?? [],
      TagGroups.EQUIPMENT,
    ).some((eq) => eq === "DUMBBELL");

    if (weight && directions) {
      if (isDumbbellExercise) {
        // double for weight is only one KH
        // add 10% to get value for LH
        weight = 2 * weight * 1.1;
      }

      const maxValue = maxWeightByEpley(weight, repsValue);

      // calculate max values for different settings
      const result = calculateAdjustedMaxValues(maxValue);

      // logging data
      const exerciseName = WorkoutConstants.TEST_EXERCISES[exerciseId];
      const age = ageGroupFor(personalData.birthday);
      const gender = personalData.gender;
      const level = getUserTagValue(workoutData.tags, TagGroups.LEVEL);
      Logger.logEvent("test_repitition_value_saved_" + exerciseName, {
        value: repsValue,
        age: age,
        gender: gender,
        level: level,
      });

      // save results to temporary state (committed on successful completion)
      const baseMaxValues = tempMaxValues ?? workoutData.maxValues;
      const updatedMaxValues = applyMaxValueToDirections(
        baseMaxValues,
        directions,
        result,
      );
      setTempMaxValues(updatedMaxValues);
      return updatedMaxValues;
    } else {
      Logger.logEvent(
        "no exercise direction found for test exercise with id ",
        exerciseId,
      );
      return null;
    }
  };

  const handlePainAlert = () => {
    const userPains = getUserTagValues(workoutData.tags, TagGroups.PAIN);
    if (userPains.length > 0) {
      Alert.alert(
        t("training.active.strengthTestAlert.title"),
        t("training.active.strengthTestAlert.message"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              setMaxFWarningPopUpShowable(false);
            },
          },
        ],
      );
    }
  };

  const handleBarbellWeightAlert = () => {
    Alert.alert(
      t("training.active.weightCalculationAlert.title"),
      t("training.active.weightCalculationAlert.message"),
      [
        {
          text: t("common.ok"),
          onPress: () => {
            setWeightCalculationPopUpShowable(false);
          },
        },
      ],
    );
  };

  // strengthTestMaxValues only provided for strength test's last exercise
  const advanceToNextExercise = (
    strengthTestMaxValues?: MaxValuesType | null,
  ) => {
    if (!exerciseList) return;

    // save exercise data
    saveExerciseAndBranchData();

    if (isPauseExercise) {
      // add time in pause to training stats
      const pauseDuration = Date.now() - pauseStartRef.current;
      addPauseTime(pauseDuration);

      if (
        maxFWarningPopUpShowable &&
        nextExercise?.weightType === "weightFMax"
      ) {
        handlePainAlert();
      }

      const isNextExerciseWithBarbell = getTagValues(
        nextExerciseData?.tags ?? [],
        TagGroups.EQUIPMENT,
      ).some((item) => item.includes("BARBELL"));

      if (
        weightCalculationPopUpShowable &&
        activeTraining?.type === "TEST_WORKOUT" &&
        isNextExerciseWithBarbell
      ) {
        handleBarbellWeightAlert();
      }
    } else if (currentExercise?.skill) {
      // Add exercise time to skill (analytics) -> addTrainingSkillTime
      const exerciseDuration = Date.now() - exerciseStartTimeRef.current;
      const focusArea = mapSkillCodeToFocusArea(currentExercise.skill);
      if (focusArea) {
        addSkillTime(focusArea, exerciseDuration);
      }
    }

    if (activeExerciseIndex < exerciseList.length - 1) {
      setActiveExerciseIndex((prev) => prev + 1);

      if (isNextExercisePause) {
        // set pause timer to new start
        pauseStartRef.current = Date.now();
      } else {
        exerciseStartTimeRef.current = Date.now();
      }
    } else {
      // Training complete
      saveAndNavigateToSuccess(false, strengthTestMaxValues);
    }
  };

  const handleAbortTraining = useCallback(() => {
    Alert.alert(
      t("training.active.abort.question"),
      t("training.active.abort.explanation"),
      [
        {
          text: t("common.yes"),
          onPress: () => {
            setIsAborted(true);
            saveAndNavigateToSuccess(true);
          },
        },
        {
          text: t("common.no"),
        },
      ],
    );
  }, [saveAndNavigateToSuccess, t]);

  const handleExerciseSkipped = () => {
    setIsSkipped(true);
    setExerciseSkipped(exerciseId);
    if (currentExercise?.skill) {
      updateExercise(
        exerciseId,
        {
          exerciseId,
          skill: currentExercise.skill,
          skipped: true,
          branchId: currentExercise.branchId,
          set: currentExercise.set,
        },
        activeTraining?.id,
      );
    }
    Logger.logEvent("exercise_skipped", {
      exerciseId,
    });
    advanceToNextExercise();
  };

  useEffect(() => {
    setIsSkipped(false);
  }, [exerciseId]);

  const handleFeedback = (category: "TOO_EASY" | "TOO_HARD" | "SUCCEEDED") => {
    if (!currentExercise) return;

    updateExercise(
      exerciseId,
      {
        exerciseId,
        skill: currentExercise.skill,
        feedback: { difficulty: category },
      },
      activeTraining?.id,
    );
    setExerciseFeedback(exerciseId, category);

    if (category === "SUCCEEDED")
      Logger.logEvent("exercise_completed_success", {
        exerciseId: exerciseId,
      });
    if (category === "TOO_EASY")
      Logger.logEvent("exercise_completed_easy", {
        exerciseId: exerciseId,
      });
    if (category === "TOO_HARD")
      Logger.logEvent("exercise_completed_hard", {
        exerciseId: exerciseId,
      });
  };

  const handlePauseToggled = (wasPaused: boolean) => {
    if (wasPaused) {
      // Resume: add pause duration to tracking
      const pauseDuration = Date.now() - pauseStartRef.current;
      exerciseStartTimeRef.current += pauseDuration;
    } else {
      // Pause: mark start of pause
      pauseStartRef.current = Date.now();
    }
  };

  // Handle back button - prevent accidental exit
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          handleAbortTraining();
          return true;
        },
      );

      return () => subscription.remove();
    }, [handleAbortTraining]),
  );

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      return () => {
        setIsScreenFocused(false);
      };
    }, []),
  );

  // Log training started
  useEffect(() => {
    logTrainingEvent("training_started");
    exerciseStartTimeRef.current = Date.now();
  }, [logTrainingEvent]);

  if (!exerciseList || exerciseList.length === 0) {
    return (
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="l"
        backgroundColor="white"
      >
        <Text variant="title">{t("common.loading")}</Text>
      </Box>
    );
  }

  const progress = activeExerciseIndex / exerciseList.length;
  const isTestExercise = currentExercise?.repetition === -1;
  const isCardioExercise = currentExercise?.skill?.includes("CARDIO") ?? false;
  const isLastInSet = currentExercise?.set?.[0] === currentExercise?.set?.[1];

  const name = isPauseExercise
    ? (nextExerciseData?.displayName ?? nextExerciseData?.name)
    : (currentExerciseData?.displayName ?? currentExerciseData?.name);

  const video = isPauseExercise
    ? nextExerciseData?.video
    : currentExerciseData?.video;

  // if plan workout check skill.
  // if short training check workout type
  let isFeedbackSkill = false;
  if (activeTraining?.type === "PLAN" && currentExercise) {
    isFeedbackSkill =
      WorkoutConstants.NO_INCREASE_SKILL_TYPE.indexOf(
        currentExercise?.skill,
      ) === -1;
  } else if (activeTraining?.type) {
    isFeedbackSkill =
      WorkoutConstants.NO_INCREASE_WORKOUT_PLAN_TYPE.indexOf(
        activeTraining.type,
      ) === -1;
  }

  const handleShowExerciseInformation = () => {
    const id = isPauseExercise ? nextExercise?.exerciseId : exerciseId;

    if (!id || id === "-1") {
      return;
    }

    router.navigate({
      pathname: "/training/exercise-information",
      params: {
        exerciseId: id,
      },
    });
  };

  const renderWeightOrHeight = () => {
    if (!currentExercise || !currentExerciseData) {
      return null;
    }

    const weight = currentExercise?.weight;
    const height = currentExercise?.height;

    // Weight information (truthy check filters out NaN, undefined, null, 0)
    if (weight) {
      const currentExerciseEquipment = getTagValues(
        currentExerciseData.tags,
        TagGroups.EQUIPMENT,
      );
      const isDumbbellExercise = currentExerciseEquipment.includes(
        WorkoutConstants.EQUIPMENT.DUMBBELL,
      );

      const exerciseWeight = deriveWeightForExercise(
        weight,
        currentExercise.weightType,
        currentExerciseData,
        workoutData.maxValues,
      );

      return (
        <>
          <Text variant="largeTitle">
            {isDumbbellExercise ? t("training.active.2x") : null}
            {exerciseWeight}
          </Text>
          <Text variant="small" color="darkGrey1">
            {t("training.active.weightIn")}
          </Text>
        </>
      );
    } else if (typeof height === "number") {
      return (
        <>
          <Text variant="largeTitle">{height}</Text>
          <Text variant="small" color="darkGrey1">
            {t("training.active.cmHigh")}
          </Text>
        </>
      );
    } else {
      return <Text textAlign="center">{t("training.active.noWeights")}</Text>;
    }
  };

  const renderHeartRate = () => {
    if (!currentExercise || !currentExerciseData) {
      return null;
    }
    const [cardioSkill] = getTagValues(
      currentExerciseData.tags,
      TagGroups.SKILL,
    ).filter((skill) => skill.includes("CARDIO") && skill !== "CARDIO");

    if (typeof cardioSkill === "undefined") {
      return null;
    }

    const heartRateInterval = heartRateBySkillAndBirthday(
      cardioSkill,
      personalData.birthday,
    );

    if (typeof heartRateInterval === "undefined") {
      return null;
    }

    return (
      <>
        <Text variant="largeTitle">
          {`${heartRateInterval.low} - ${heartRateInterval.high}`}
        </Text>
        <Text variant="small" color="darkGrey1">
          {t("training.active.heartRateInterval")}
        </Text>
      </>
    );
  };

  const isCountdownActive =
    isScreenFocused &&
    !isAborted &&
    !videoIsPlaying &&
    !isFullScreen &&
    !isSkipped;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableBox
              key="exercise_information"
              onPress={handleShowExerciseInformation}
              minWidth={36}
              minHeight={36}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Ionicon
                name="information-circle"
                size={28}
                color={colors.black}
              />
            </TouchableBox>
          ),
          headerRight: () => (
            <TouchableBox
              onPress={handleAbortTraining}
              key={"abort_training"}
              minWidth={36}
              minHeight={36}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Ionicon name="close-circle" size={28} color={colors.black} />
            </TouchableBox>
          ),
        }}
      />
      <Box
        flex={1}
        style={{
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: colors.white }}
          // Ensures input and save button remain visible
          bottomOffset={TRAINING_INPUT_OFFSET}
          keyboardShouldPersistTaps="handled"
        >
          <Box flex={1} backgroundColor="white" justifyContent="flex-start">
            {/* Progress bar */}
            <Box height={4} backgroundColor="lightGrey1">
              <Box
                height="100%"
                backgroundColor="primary"
                width={`${progress * 100}%`}
              />
            </Box>

            {/* Video/Exercise container */}
            <Box backgroundColor="lightGrey2">
              {!!video && (
                <VideoPlayer
                  title={name ?? ""}
                  source={video}
                  setIsFullScreen={setIsFullScreen}
                  setIsVideoPlaying={setVideoIsPlaying}
                  disabled={isAborted || !isScreenFocused}
                />
              )}
            </Box>

            {/* Exercise information */}
            {currentExercise && (
              <Box
                paddingVertical="m"
                borderBottomWidth={1}
                borderBottomColor="lightGrey2"
              >
                {/* Sets */}
                <Box flexDirection="row" minHeight={75}>
                  <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    borderRightWidth={1}
                    borderRightColor="lightGrey2"
                    paddingHorizontal="s"
                  >
                    {currentExercise?.set && (
                      <Box alignItems="center">
                        <Text variant="largeTitle" textAlign="center">
                          {t("training.active.set", {
                            current: currentExercise.set?.[0],
                            total: currentExercise.set?.[1],
                          })}
                        </Text>
                        <Text variant="small" color="darkGrey1">
                          {t("training.active.sets", {
                            count: currentExercise.set?.[1],
                          })}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Reps / Duration */}
                  <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    borderRightWidth={1}
                    borderRightColor="lightGrey2"
                    paddingHorizontal="s"
                    gap="m"
                  >
                    {typeof currentExercise.duration === "number" && (
                      <Box alignItems="center">
                        <Text variant="largeTitle">
                          {currentExercise.duration}
                        </Text>
                        <Text variant="small" color="darkGrey1">
                          sec
                        </Text>
                      </Box>
                    )}
                    {!isPauseExercise &&
                      typeof currentExercise.repetition === "number" && (
                        <Box alignItems="center">
                          <Text variant="largeTitle">
                            {currentExercise.repetition === -1
                              ? t("training.active.maxReps")
                              : currentExercise.repetition}
                          </Text>
                          <Text variant="small" color="darkGrey1">
                            {t("training.active.repetitions")}
                          </Text>
                        </Box>
                      )}
                  </Box>

                  {/* Heart Rate / Weight / Height  */}
                  <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    paddingHorizontal="s"
                  >
                    {isCardioExercise
                      ? renderHeartRate()
                      : renderWeightOrHeight()}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Training Navigation or Fallback Controls */}
            {currentExercise && (
              <TrainingNavigation
                exerciseId={exerciseId}
                nextExerciseId={nextExercise?.exerciseId}
                duration={currentExercise.duration || 0}
                next={advanceToNextExercise}
                feedback={handleFeedback}
                isCountdownActive={isCountdownActive}
                isFirstDurationInTraining={activeExerciseIndex === 0}
                isLastInSet={isLastInSet}
                isFeedbackSkill={isFeedbackSkill}
                isCardioExercise={isCardioExercise}
                isLastCardioExercise={isCardioExercise && !hasNextExercise}
                isTest={isTestExercise}
                onSubmitReps={saveRepsInput}
                pauseToggled={handlePauseToggled}
              />
            )}

            {/* Avoids content being hidden behind TrainingFooter */}
            <Box height={FOOTER_HEIGHT} />
          </Box>
        </KeyboardAwareScrollView>
        {/* Skip button & next exercise preview */}
        <TrainingFooter
          isSkipHidden={
            isTestExercise && typeof currentExercise.duration === "undefined"
          }
          nextExerciseName={
            nextExerciseData?.displayName ?? nextExerciseData?.name
          }
          onSkipPress={handleExerciseSkipped}
        />
      </Box>
    </>
  );
};

export default TrainingActive;
