import { TagGroups } from "@/constants/tagGroups";
import { isLevelTag, WorkoutConstants } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
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
  calculateStandardExerciseAdjustment,
  type ExerciseAdjustmentContext,
  shouldProcessExerciseValues,
} from "@/features/training/utils/exerciseDataUtils";
import { getWorkingSetMaxFReps } from "@/features/training/utils/maxFRepetitionsUtils";
import { calculateMaxStrengthAdjustment } from "@/features/training/utils/maxStrengthAdjustment";
import {
  calculateWeightStep,
  getLowestPermittedWeight,
  getResetDuration,
  getResetRepetition,
  getTargetWeight,
  getWeightType,
} from "@/features/training/utils/weightAdjustmentUtils";
import {
  getSkillTree,
  resolveBranchLevel,
} from "@/features/training/utils/skillTreeUtils";
import {
  applyMaxValueToDirections,
  calculateAdjustedMaxValues,
  getMaxValueForExercise,
  maxWeightByEpley,
} from "@/features/training/utils/workoutUtils";
import { isTrainingLevel } from "@/schemas/common.schema";
import { Logger } from "@/services/Logger";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { getTagValues, getUserTagValue } from "@/utils/tagUtils";

type FeedbackCategory = "TOO_EASY" | "TOO_HARD" | "SUCCEEDED";

/**
 * Persists exercise/branch progression, strength-test reps, feedback, and
 * skip state for a single `exerciseList` entry identified by array index.
 *
 * Shared by the sequential (training-active) and list-view (training-list)
 * screens so completion can be triggered per-exercise, in or out of order,
 * without duplicating the underlying weight/level adjustment logic.
 */
export function useExerciseCompletion() {
  const {
    exerciseList,
    activeTraining,
    equipment,
    tempMaxValues,
    setTempMaxValues,
    setExerciseSkipped,
    setExerciseFeedback,
  } = useTrainingStore();
  const skillTrees = getAllSkillTrees();
  const {
    branchData,
    setBranchLevel,
    updateExercise,
    resetExercise,
    updateUserExerciseTotals,
  } = useExerciseProgressStore();
  const { personalData } = useUserProfileStore();
  const { workoutData, replaceBranchInTrainingPlan } = useUserWorkoutStore();

  const getFitnessLevel = (): string =>
    (workoutData && getUserTagValue(workoutData.tags, TagGroups.LEVEL)) ??
    WorkoutConstants.LEVELS.ADVANCED;

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
        const entryLevel = resolveBranchLevel(newBranch, getFitnessLevel());
        let newLevel = -1;
        if (
          entryLevel !== null &&
          levels[entryLevel].exerciseId === exerciseId
        ) {
          newLevel = entryLevel;
        } else {
          const match = Object.entries(levels).find(
            ([_, v]) => v.exerciseId === exerciseId,
          );
          if (match && !isNaN(parseInt(match[0]))) {
            newLevel = parseInt(match[0]);
          }
        }
        if (newLevel > 0) {
          setBranchLevel(branchId, newLevel, exerciseId);
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

  /** Returns true when the athlete moves off `exerciseId`. */
  const updateBranchLevel = (
    levelUp: boolean,
    branchId: string,
    exerciseId: string,
    skill: SkillCode,
    ageGroup: string,
  ): boolean => {
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
      {
        levelUp,
        branchId,
        exerciseId,
        skill,
        ageGroup,
        userLevel: getFitnessLevel(),
      },
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

    return (
      result.type === "BRANCH_SUBSTITUTION" ||
      (result.type === "SAME_BRANCH" && result.exerciseId !== exerciseId)
    );
  };

  /**
   * Saves the user exercise values for the exercise at `index`.
   * These values were adjusted in the training generator.
   *
   * Checks if the branch level needs to increase and changes exercise in training plan.
   */
  const saveExerciseAndBranchData = (index: number) => {
    // Feedback given in the same tick is not yet in the rendered list.
    const latestExerciseList = useTrainingStore.getState().exerciseList;
    const currentExercise = latestExerciseList?.[index];
    const exerciseId = currentExercise?.exerciseId ?? "-1";
    const isPauseExercise = checkIsPauseExercise(exerciseId);

    // Skip saving for pause exercises
    if (isPauseExercise) {
      Logger.logEvent("pause_exercise_no_data_saved", { exerciseId });
      return;
    }

    const skill = currentExercise?.skill;
    const branchId = currentExercise?.branchId;
    const id = exerciseId;
    const currentExerciseData = getExerciseById(id);

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
      // check target values after last set of max exercises
      if (skill?.includes("MAX")) {
        if (
          currentExercise?.set &&
          currentExercise.set[0] === currentExercise.set[1]
        ) {
          // choose adjustment for maxF by age, userlevel and level of repetitions
          const ageGroup = ageGroupFor(personalData.birthday);

          // get adjustment of exercise
          const exercise = latestExerciseList?.findLast(
            (item) => item.exerciseId === exerciseId,
          );
          let adjustment = null;
          if (exercise?.feedback) {
            adjustment = exercise?.feedback.difficulty;
          }

          const {
            maxFRepetitions: maxFRepetitionsNew,
            levelUp,
            levelDown,
            feedbackOverride,
          } = calculateMaxStrengthAdjustment({
            adjustment,
            userExerciseData: exercise && {
              ...exercise,
              maxFRepetitions: getWorkingSetMaxFReps(
                latestExerciseList ?? [],
                exerciseId,
              ),
            },
            ageGroup,
            levelTag,
          });

          const leftExercise =
            typeof branchId === "string" &&
            (levelUp || levelDown) &&
            updateBranchLevel(levelUp, branchId, id, skill, ageGroup);

          if (leftExercise) {
            // A later return to this exercise starts from its start values.
            resetExercise(id, { skill, branchId }, activeTraining?.id);
          } else if (feedbackOverride) {
            // The level change found no other exercise: keep the sets, but
            // the feedback must not move them a step.
            updateExercise(
              id,
              {
                exerciseId: id,
                skill,
                feedback: feedbackOverride,
              },
              activeTraining?.id,
            );
          }

          if (!leftExercise) {
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
          let intensity = getIntensityBySkill(skill, currentExerciseData);

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

            const maxValue = getMaxValueForExercise(
              currentExerciseData,
              workoutData.maxValues,
            );
            const adjustmentContext: ExerciseAdjustmentContext = {
              userLevel,
              genderTag,
              ageGroup,
              levelTag,
              maxValue,
            };

            const feedback = currentExercise?.feedback?.difficulty ?? null;
            const adjustmentResult = calculateStandardExerciseAdjustment(
              weight,
              duration,
              reps,
              currentExerciseData,
              adjustmentContext,
              intensity,
              feedback,
            );

            const levelUp = adjustmentResult.type === "LEVEL_UP";
            const levelDown = adjustmentResult.type === "LEVEL_DOWN";
            const increaseWeight = adjustmentResult.type === "INCREASE_WEIGHT";
            const decreaseWeight = adjustmentResult.type === "DECREASE_WEIGHT";
            // Weight changes at a performed boundary clear the feedback, so
            // TrainingGenerator does not apply it a second time. Only a weight
            // increase resets reps/duration to the start value.
            if (increaseWeight || decreaseWeight) {
              const weightType = getWeightType(currentExerciseData, intensity);
              const newWeight = calculateWeightStep(
                weight,
                increaseWeight ? "INCREASE" : "DECREASE",
                currentExerciseData,
                {
                  weightType,
                  targetWeight: getTargetWeight(
                    intensity,
                    currentExerciseData,
                    adjustmentContext,
                  ),
                  lowestWeight: getLowestPermittedWeight(
                    intensity,
                    weightType,
                    currentExerciseData,
                    adjustmentContext,
                  ),
                  maxValue,
                },
              );
              const nextWeightPercentage = weightPercentage || undefined;
              const newDuration =
                (increaseWeight
                  ? getResetDuration(
                      currentExerciseData,
                      intensity,
                      genderTag,
                      userLevel,
                    )
                  : undefined) ??
                (duration || undefined);
              const newRepetition =
                (increaseWeight
                  ? getResetRepetition(
                      currentExerciseData,
                      intensity,
                      genderTag,
                      userLevel,
                    )
                  : undefined) ??
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
              if (updateBranchLevel(levelUp, branchId, id, skill, ageGroup)) {
                // A later return to this exercise starts from its start values.
                resetExercise(id, { skill, branchId }, activeTraining?.id);
              } else {
                // No other exercise found: keep the values, but the feedback
                // must not trigger a second level change.
                updateExercise(
                  id,
                  {
                    exerciseId: id,
                    skill,
                    weight,
                    maxFRepetitions,
                    duration,
                    repetition: reps,
                    height,
                    weightType: currentExercise?.weightType,
                    branchId,
                    set: currentExercise?.set,
                    feedback: { difficulty: null },
                  },
                  activeTraining?.id,
                );
              }
            } else {
              // No boundary change: feedback is preserved so TrainingGenerator
              // applies the ladder step or the weight step on the next generation.
              // Without feedback the stored one from an earlier session is dropped.
              if (feedback === null) {
                updateExercise(
                  id,
                  { exerciseId: id, skill, feedback: { difficulty: null } },
                  activeTraining?.id,
                );
              }
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
  // Returns the updated maxValues to pass directly to finishTraining
  // (avoids React state batching issue with setTempMaxValues).
  const saveRepsInput = (
    index: number,
    repsValue: number,
  ): MaxValuesType | null => {
    const currentExercise = exerciseList?.[index];
    const exerciseId = currentExercise?.exerciseId ?? "-1";
    const currentExerciseData = getExerciseById(exerciseId);

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

  const handleFeedback = (index: number, category: FeedbackCategory) => {
    const currentExercise = exerciseList?.[index];
    const exerciseId = currentExercise?.exerciseId ?? "-1";
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

  const handleExerciseSkipped = (index: number) => {
    const currentExercise = exerciseList?.[index];
    const exerciseId = currentExercise?.exerciseId ?? "-1";

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
  };

  return {
    saveExerciseAndBranchData,
    saveRepsInput,
    handleFeedback,
    handleExerciseSkipped,
  };
}
