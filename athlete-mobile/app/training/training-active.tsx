import { AwesomeIcon } from "@/common/AwesomeIcon";
import { TagGroups } from "@/constants/tagGroups";
import {
  ExerciseDifficultyType,
  isLevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { TrainingNavigation } from "@/features/training/TrainingNavigation";
import { getIntensityBySkill } from "@/features/training/generators/TrainingGenerator";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import { SkillType } from "@/features/training/models/Training";
import { isTrainingLevel } from "@/features/training/models/TrainingLevel";
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
import {
  getSkillTree,
  mapSkillToFocusArea,
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
import { Logger } from "@/services/Logger";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useExercisesStore } from "@/store/exercisesStore";
import { useSkillTreesStore } from "@/store/skillTreesStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTheme } from "@/theme/theme";
import { getTagValues } from "@/utils/tagUtils";
import { VideoPlayer } from "@/video/VideoPlayer";
import { useKeepAwake } from "expo-keep-awake";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { skillTrees } = useSkillTreesStore();
  const { branchData, setBranchLevel, updateExercise, addTestResult } =
    useExerciseProgressStore();
  const { getExerciseById } = useExercisesStore();
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

  // Temporary storage for test workout results, only committed on successful completion
  const [tempMaxValues, setTempMaxValues] = useState<MaxValuesType | null>(
    null,
  );

  // Track test input focus to hide bottom bar
  const [isTestInputFocused, setIsTestInputFocused] = useState(false);

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

      if (activeTraining.type.includes("PREV")) {
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
    skill: SkillType,
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
          userLevelString = getTagValues(workoutData.tags, TagGroups.LEVEL)[0];
        }
        const userLevel =
          userLevelString === WorkoutConstants.LEVELS.BEGINNER
            ? 1
            : userLevelString === WorkoutConstants.LEVELS.ADVANCED
              ? 2
              : 3;
        let newLevel = -1;
        if (levels[userLevel] && levels[userLevel].id === exerciseId) {
          newLevel = userLevel;
        } else {
          const match = Object.entries(levels).find(
            ([_, v]) => v.id === exerciseId,
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
    skill: SkillType,
    ageGroup: string,
  ) => {
    const context: BranchLevelContext = {
      skillTrees,
      branchData,
      equipment,
      gender: workoutData.gender,
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
          newBranchIds: result.equivalentBranches.map(
            (eb) => eb?.exerciseBranchId,
          ),
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

    const levelTagValues = getTagValues(workoutData.tags, TagGroups.LEVEL)[0];
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
          const ageGroup = ageGroupFor(workoutData.birthday);

          // get adjustment of exercise
          const exercise = exerciseList?.find(
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
          let maxFRepetitionsNew = exercise?.maxFRepetitions ?? [];

          // control adjustments
          let increaseWeight = false;
          let decreaseWeight = false;
          let levelUp = false;
          let levelDown = false;
          const genderTag =
            ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
              ? "k"
              : workoutData.gender === "MALE"
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
          const targetValue = currentExerciseData?.values.weight?.targetValue;
          if (targetValue) {
            if (userLevel && targetValue[genderTag]?.[userLevel]) {
              maximumWeightPercentage = parseFloat(
                targetValue[genderTag][userLevel],
              );
            } else if (userLevel && targetValue.default?.[userLevel]) {
              maximumWeightPercentage = parseFloat(
                targetValue.default[userLevel],
              );
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
          if (currentExerciseData?.values.weight?.startValue) {
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
              maxFRepetitionsNew[maxFRepetitionsNew.length - 1].level ===
                "HARD" &&
              adjustment !== "TOO_HARD") ||
            (maxFRepetitionsNew[maxFRepetitionsNew.length - 1].level ===
              "MEDIUM" &&
              adjustment === "TOO_EASY")
          ) {
            // No adjustment if max lvl and max weight is already reached
            updateExercise(id, {
              exerciseId: id,
              skill,
              feedback: { difficulty: null },
            });
            levelUp = true;
          } else if (
            typeof weightPercentage === "number" &&
            typeof minimumWeightPercentage === "number" &&
            weightPercentage <= minimumWeightPercentage &&
            adjustment === "TOO_HARD"
          ) {
            // No adjustment if min weight is already too hard -> levelDown
            updateExercise(id, {
              exerciseId: id,
              skill,
              feedback: { difficulty: null },
            });
            levelDown = true;
          } else if (
            typeof weightPercentage === "number" &&
            typeof maximumWeightPercentage === "number" &&
            weightPercentage >= maximumWeightPercentage &&
            maxFRepetitionsNew[maxFRepetitionsNew.length - 1].level ===
              "MEDIUM" &&
            adjustment === "TOO_EASY"
          ) {
            // No TOO_EASY adjustment if max lvl and max weight will be reached
            updateExercise(id, {
              exerciseId: id,
              skill,
              feedback: { difficulty: "SUCCEEDED" },
            });
          } else {
            // adjust weight if needed
            if (
              (maxFRepetitionsNew[maxFRepetitionsNew.length - 1].level ===
                "HARD" &&
                adjustment !== "TOO_HARD") ||
              (maxFRepetitionsNew[maxFRepetitionsNew.length - 1].level ===
                "MEDIUM" &&
                adjustment === "TOO_EASY")
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
          updateExercise(id, {
            exerciseId: id,
            skill,
            weight: newWeight,
            nextWeightPercentage,
            maxFRepetitions: maxFRepetitionsNew,
            duration: newDuration,
            repetition: newRepetition,
            height,
            weightType: currentExercise.weightType,
          });
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
            const ageGroup = ageGroupFor(workoutData.birthday);
            const genderTag =
              ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
                ? "k"
                : workoutData.gender === "MALE"
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
              updateExercise(id, {
                exerciseId: id,
                skill,
                weight: newWeight,
                nextWeightPercentage,
                maxFRepetitions,
                duration: newDuration,
                repetition: newRepetition,
                height,
                weightType: currentExercise?.weightType,
              });

              // set user exercise difficulty to null, so its not adjusted in next training
              updateExercise(id, {
                exerciseId: id,
                skill,
                feedback: { difficulty: null },
              });
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

              updateExercise(id, {
                exerciseId: id,
                skill,
                weight,
                nextWeightPercentage: weightPercentage,
                maxFRepetitions,
                duration,
                repetition: reps,
                height,
                weightType: currentExercise?.weightType,
              });
            }
          }
        }
      }
    }

    // TODO: add completed totals in scope of:
    // https://github.com/sports-athletics/sports-athletic/issues/203
    // setProgressBefore(
    //     exerciseId,
    //     weight,
    //     duration,
    //     reps,
    //     height
    // );

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
      const age = ageGroupFor(workoutData.birthday);
      const gender = workoutData.gender;
      const level = getTagValues(workoutData.tags, TagGroups.LEVEL)[0];
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
    const userPains = getTagValues(workoutData.tags, TagGroups.PAIN);
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

    // Reset test input state for next exercise
    setIsTestInputFocused(false);

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
      const focusArea = mapSkillToFocusArea(currentExercise.skill);
      if (focusArea) {
        addSkillTime(focusArea, exerciseDuration);
      }
    }

    if (activeExerciseIndex < exerciseList.length - 1) {
      setActiveExerciseIndex((prev) => prev + 1);

      if (isPauseExercise) {
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
    setExerciseSkipped(exerciseId);
    Logger.logEvent("exercise_skipped", {
      exerciseId,
    });
    advanceToNextExercise();
  };

  const handleFeedback = (category: "TOO_EASY" | "TOO_HARD" | "SUCCEEDED") => {
    if (!currentExercise) return;

    updateExercise(exerciseId, {
      exerciseId,
      skill: currentExercise.skill,
      feedback: { difficulty: category },
    });
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

    advanceToNextExercise();
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

  const nextDisplayName = t("training.active.nextExercise", {
    exerciseName: hasNextExercise
      ? (nextExerciseData?.displayName ?? nextExerciseData?.name)
      : t("training.active.finished"),
  });

  const video = isPauseExercise
    ? nextExerciseData?.video
    : currentExerciseData?.video;

  const isExerciseInformationVisible =
    typeof exerciseId === "string" && !isPauseExercise;

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
    if (!isExerciseInformationVisible) return;

    router.navigate({
      pathname: "/training/exercise-information",
      params: {
        exerciseId,
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
      workoutData.birthday,
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Box
          flex={1}
          style={{
            paddingBottom: insets.bottom,
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }}
        >
          <Stack.Screen options={{ headerShown: false }} />
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
                />
              )}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                marginHorizontal="m"
                marginVertical="s"
                flexDirection="row"
                justifyContent="space-between"
              >
                {isExerciseInformationVisible ? (
                  <TouchableBox
                    key="exercise_information"
                    onPress={handleShowExerciseInformation}
                  >
                    <AwesomeIcon
                      name="info-circle"
                      size={24}
                      color={colors.white}
                    />
                  </TouchableBox>
                ) : (
                  <Box />
                )}

                <TouchableBox
                  onPress={handleAbortTraining}
                  key={"abort_training"}
                >
                  <AwesomeIcon
                    name="times-circle"
                    size={24}
                    color={colors.white}
                  />
                </TouchableBox>
              </Box>
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
                duration={currentExercise.duration || 0}
                next={advanceToNextExercise}
                skip={handleExerciseSkipped}
                isPause={isPauseExercise}
                hasNextExercise={hasNextExercise}
                isNextExercisePause={isNextExercisePause}
                feedback={handleFeedback}
                isCountdownActive={
                  !isAborted && !videoIsPlaying && !isFullScreen
                }
                isFirstDurationInTraining={activeExerciseIndex === 0}
                isLastInSet={isLastInSet}
                isFeedbackSkill={isFeedbackSkill}
                isCardioExercise={isCardioExercise}
                isLastCardioExercise={isCardioExercise && !hasNextExercise}
                isTest={isTestExercise}
                onSubmitReps={saveRepsInput}
                pauseToggled={handlePauseToggled}
                onTestInputFocusChange={setIsTestInputFocused}
                isTestInputFocused={isTestInputFocused}
              />
            )}

            {/* Next exercise preview - hidden when test input focused */}
            {!isTestInputFocused && (
              <Box padding="m" backgroundColor="lightGrey1" borderRadius="m">
                <Text marginBottom="xs" fontWeight="bold">
                  {nextDisplayName}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default TrainingActive;
