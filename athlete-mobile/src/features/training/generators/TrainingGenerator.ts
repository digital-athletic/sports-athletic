import { TagGroups } from "@/constants/tagGroups";
import {
  WorkoutConstants,
  type SkillTypes,
} from "@/constants/workoutConstants";
import type {
  BranchExerciseReference,
  BranchSelectionResult,
  ExerciseBranchType,
  ExercisePair,
  SkillBranchList,
  SuperSetBranchSelectionResult,
} from "@/features/training/models/ExerciseBranch";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import {
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TemporalDataType } from "@/features/training/models/TemporalData";
import type { TrainingType } from "@/features/training/models/Training";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { UserTrainingType } from "@/features/training/models/UserTraining";
import { getSectionForDate } from "@/features/training/trainingUtils";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import {
  type BufferTable,
  getMaxStrengthRepetitions,
  getNextMaxStrengthSetStates,
} from "@/features/training/utils/maxStrengthLadder";
import { extendSectionsForMissedWeeks } from "@/features/training/utils/trainingSectionUtils";
import {
  filterByAge,
  filterByGender,
  filterByRegion,
  filterBySoreness,
} from "@/features/training/utils/branchFilterUtils";
import {
  equipmentForExerciseExists,
  filterByEquipment,
  hasWeights,
} from "@/features/training/utils/equipmentUtils";
import {
  areaToRegion,
  getAreasFor,
  getOpposingExerciseDirection,
} from "@/features/training/utils/exerciseUtils";
import {
  getBlocksFromPains,
  getPreventionsFromPains,
} from "@/features/training/utils/painUtils";
import { getRegionsForPreventionSkills } from "@/features/training/utils/preventionUtils";
import {
  getNextTypeFiltered,
  getSkillTree,
  getUserExerciseFromBranch,
  resolveBranchExerciseId,
} from "@/features/training/utils/skillTreeUtils";
import {
  isBigMuscleExercise,
  pickSupersetPartner,
} from "@/features/training/utils/supersetPairingUtils";
import { trainsSameRegionAndPrimaryMuscle } from "@/features/training/utils/exerciseBlockUtils";
import { orderExerciseUnits } from "@/features/training/utils/exerciseOrderUtils";
import type { GeneratorError } from "./GeneratorError";
import { isTrainingLevel } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import {
  ExerciseLevelsSchema,
  SetListEntrySchema,
  SkillBranchesSchema,
  type AdjustmentConfig,
  type CardioBranchReference,
  type CardioExercisePair,
  type DifficultyFeedbackType,
  type ExerciseBranchEntry,
  type ExerciseStartValues,
  type ExerciseValuesConfig,
  type ExerciseValuesData,
  type FeedbackAdjustment,
  type FilterResult,
  type GenderLevelValueMap,
  type MaxTrainingRepsEntry,
  type MaxTrainingWeightsResult,
  type SkillBranchData,
  type SkillCode,
  type SkillWithLength,
  type StartValuesResult,
  type TestWorkoutsStartValuesType,
  type UserExerciseDataMapType,
} from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import { Logger } from "@/services/Logger";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import { cloneWithValidation } from "@/utils/cloneWithValidation";
import { getTagValue, getTagValues, getUserTagValues } from "@/utils/tagUtils";

// Intensity
import { IntensityBAS } from "../../../../assets/data/generator/intensity/BAS";
import { IntensityCARDIO_1_LAKTAT } from "../../../../assets/data/generator/intensity/CARDIO_1_LAKTAT";
import { IntensityCARDIO_1_SHORT } from "../../../../assets/data/generator/intensity/CARDIO_1_SHORT";
import { IntensityCARDIO_2 } from "../../../../assets/data/generator/intensity/CARDIO_2";
import { IntensityCARDIO_3 } from "../../../../assets/data/generator/intensity/CARDIO_3";
import { IntensityDEFAULT } from "../../../../assets/data/generator/intensity/DEFAULT";
import { IntensityDEFAULT_KG } from "../../../../assets/data/generator/intensity/DEFAULTKG";
import {
  IntensityGKS,
  IntensityGKS_KG,
} from "../../../../assets/data/generator/intensity/GKS";
import { IntensityPREV } from "../../../../assets/data/generator/intensity/PREV";
import { IntensitySA } from "../../../../assets/data/generator/intensity/SA";
import { IntensitySA_KG } from "../../../../assets/data/generator/intensity/SAKG";
import { IntensitySK } from "../../../../assets/data/generator/intensity/SK";
import { IntensitySK_KG } from "../../../../assets/data/generator/intensity/SKKG";
import { IntensitySWR_2 } from "../../../../assets/data/generator/intensity/SWR2";
import { IntensitySWR_2_KG } from "../../../../assets/data/generator/intensity/SWR2KG";

// Pause

// Test workouts
import TEST_WORKOUTS from "../../../../assets/data/generator/TEST_WORKOUTS";
import TEST_WORKOUTS_START_VALUES from "../../../../assets/data/generator/TEST_WORKOUTS_START_VALUES";
import TEST_WORKOUTS_WU_REGION from "../../../../assets/data/generator/TEST_WORKOUTS_WU_REGION";
import {
  isPauseExercise,
  PAUSE_EXERCISE_ID,
  PLACEHOLDER_BRANCH_ID,
} from "../models/IdTypes";
import { createExerciseMap } from "../utils/exerciseAccessor";
import {
  getTemporalData,
  getTemporalTags,
  getUserBirthday,
  getUserGender,
  requireTrainingPlan,
  requireWorkoutData,
} from "../utils/userDataUtils";
import {
  calculateWeightStep,
  getLowestPermittedWeight,
} from "../utils/weightAdjustmentUtils";
import {
  deriveWeightForExercise,
  getExerciseStartValue,
  getExerciseTargetValue,
  getMaxValueForExercise,
  getUserLevel,
  roundWeightValue,
} from "../utils/workoutUtils";
import { computeWarmupWeights, WARMUP_REST_SECONDS } from "./warmupDerivation";

export default class TrainingGenerator {
  static DEBUG = false;

  /**
   * Main entry point for generating workout exercise lists.
   * Routes to appropriate generator based on training type: TEST_WORKOUT for max tests,
   * short workouts (MOB, WU, CD, BR, etc.) or full PLAN workouts.
   */
  generateTraining = (
    type: TrainingType,
    user: UserType,
    place: string,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    weekday: number,
    equipment: string[],
    givenSection: number | undefined,
    daysSinceLastWorkout: number,
    userExerciseData: {
      exerciseData: Record<string, UserExerciseDataType | undefined>;
      branchData: Record<string, UserExerciseBranchDataType | undefined>;
    },
  ): GeneratedSetListEntry[] => {
    if (type === "TEST_WORKOUT") {
      // Validate user has completed anamnesis
      requireWorkoutData(user);

      const tempTags = getTemporalTags(user);
      const areas = getAreasFor(tempTags);

      if (areas.length > 0) {
        // no test workout with muscle soreness
        throw {
          type: "TOO_MUCH_SORENESS",
          subtype: "TEST_WORKOUT",
          params: [],
        };
      }

      // return weight test workout
      const testSetList = this.getTestSetList(
        user,
        exercises,
        skillTrees,
        userExerciseData,
      );
      testSetList.pop(); // remove last pause
      return testSetList;
    }
    if (type !== "PLAN") {
      // is short workout
      return this.generateShortWorkout(
        type,
        user,
        place,
        exercises,
        skillTrees,
        equipment,
        userExerciseData,
      );
    }
    return this.generatePlanWorkout(
      type,
      user,
      place,
      exercises,
      skillTrees,
      weekday,
      equipment,
      givenSection,
      daysSinceLastWorkout,
      userExerciseData,
    );
  };

  /**
   * Generates exercise lists for short workout types (WU, MOB, BR, CD, BAS, GKS, PREV*).
   * Filters available branches by pain, equipment, age, and gender,
   * then builds exercise pairs with appropriate sets and durations.
   */
  generateShortWorkout = (
    type: TrainingType,
    user: UserType,
    place: string,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    equipment: string[],
    userExerciseData: {
      exerciseData: Record<string, UserExerciseDataType | undefined>;
      branchData: Record<string, UserExerciseBranchDataType | undefined>;
    },
  ): GeneratedSetListEntry[] => {
    // Create exercise lookup map for type-safe access
    const exerciseMap = createExerciseMap(exercises);

    // get skill tree
    const HAS_WEIGHTS = hasWeights(equipment);
    const skillTree = getSkillTree(skillTrees, type, [], HAS_WEIGHTS, true);

    if (TrainingGenerator.DEBUG) {
      console.log("generate short training for " + type);
      console.log("HAS_WEIGHTS", HAS_WEIGHTS);
      console.log("skillTree", skillTree);
    }

    // check foam roller (Faszienrolle) equipment if chosen type is BR
    if (
      type === "BR" &&
      !equipment.includes("FOAM_ROLLER") &&
      !equipment.includes("FOAM_BALL")
    ) {
      throw {
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: ["FOAM_ROLLER", "FOAM_BALL"],
      };
    }

    // get branches matching
    // prevention tag
    let preventionFiltered: SkillTreeType = skillTree;
    let prev: string | undefined;
    if (type.indexOf("PREV") > -1) {
      switch (type) {
        case "PREVSHOULDER":
          prev = "SHOULDER";
          break;
        case "PREVKNEE":
          prev = "KNEE_HIP";
          break;
        case "PREVWRIST":
          prev = "WRIST_ELBOW";
          break;
        case "PREVANKLE":
          prev = "ANKLE";
          break;
        case "PREVSPINE":
          prev = "SPINE";
          break;
        default:
          prev = "SHOULDER";
          break;
      }

      const specificPrevention: SkillTreeType = {};
      for (const id in skillTree) {
        let preventions = getTagValues(
          skillTree[id].tags,
          TagGroups.PREVENTION,
        );
        if (preventions.indexOf(prev) > -1) {
          specificPrevention[id] = skillTree[id];
        }
      }
      preventionFiltered = specificPrevention;

      if (Object.keys(preventionFiltered).length === 0) {
        throw {
          type: "NO_EXERCISES",
          subtype: "SKILL_TREE",
          params: [prev],
        };
      }

      // Add special warm up
      let skillTreeWUSPEZ = getSkillTree(
        skillTrees,
        "WUSPEZIAL",
        [type],
        HAS_WEIGHTS,
      );
      preventionFiltered = { ...preventionFiltered, ...skillTreeWUSPEZ };
    }

    if (TrainingGenerator.DEBUG) {
      console.log("prevention filtered", preventionFiltered);
    }

    // pain
    const userPains: string[] = user.workoutData?.tags
      ? getUserTagValues(user.workoutData.tags, TagGroups.PAIN)
      : [];
    const painData: string[] = getBlocksFromPains(userPains);

    const painFiltered: SkillTreeType = {};
    const painList: string[] = [];
    for (const id in preventionFiltered) {
      const entry = preventionFiltered[id];
      const blocked = getTagValues(entry.tags, TagGroups.BLOCK);

      let isBlocked = false;
      for (let p = 0; p < painData.length; p++) {
        if (blocked.indexOf(painData[p]) > -1) {
          isBlocked = true;
          painList.push(painData[p]);
          break;
        }
      }
      if (!isBlocked) painFiltered[id] = entry;
    }

    if (TrainingGenerator.DEBUG) {
      console.log("pain filtered", painFiltered);
    }

    if (Object.keys(painFiltered).length === 0) {
      throw {
        type: "NO_EXERCISES",
        subtype: "PAIN",
        params: painList,
      };
    }

    // Get temporal data with proper Date handling
    const temporalData = getTemporalData(user);

    // focus and prevention trainings ignore muscle soreness
    const equipmentFilterResult = filterByEquipment(painFiltered, equipment);
    const equipmentFiltered = equipmentFilterResult.keep;

    if (TrainingGenerator.DEBUG) {
      console.log("equipment filtered", equipmentFiltered);
    }

    if (Object.keys(equipmentFiltered).length === 0) {
      throw {
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: equipmentFilterResult.missingEquipment || [],
      };
    }

    // age
    const ageGroup = ageGroupFor(getUserBirthday(user));
    let ageFiltered = filterByAge(equipmentFiltered, ageGroup).keep;

    if (TrainingGenerator.DEBUG) {
      console.log("age filtered", ageFiltered);
    }

    if (Object.keys(ageFiltered).length === 0) {
      throw { type: "NO_EXERCISES", subtype: "AGE", params: [] };
    }

    // gender
    const userGender = getUserGender(user) ?? "FEMALE";
    const genderFiltered = filterByGender(ageFiltered, userGender).keep;

    if (TrainingGenerator.DEBUG) {
      console.log("gender filtered", genderFiltered);
    }

    if (Object.keys(genderFiltered).length === 0) {
      throw { type: "NO_EXERCISES", subtype: "GENDER", params: [] };
    }

    // Build exercise list
    let branches: Record<string, BranchExerciseReference[]> = { main: [] };
    let branchesIds: string[] = [];

    const userLevel = getUserLevel(user);

    const resolveExerciseId = (
      branches: SkillTreeType,
      branchId: string,
    ): string | null =>
      branches[branchId]
        ? resolveBranchExerciseId(
            branches[branchId],
            userLevel,
            userExerciseData.branchData[branchId],
          )
        : null;

    // Branches without a resolvable exercise count as blocked and are never drawn;
    // neither a branch nor a resolved exercise repeats
    const getResolvedBranches = (
      branches: SkillTreeType,
      usedBranchIds: string[],
    ): { branchId: string; exerciseId: string }[] => {
      const usedExerciseIds = usedBranchIds.map((branchId) =>
        resolveExerciseId(genderFiltered, branchId),
      );
      return Object.keys(branches).flatMap((branchId) => {
        if (usedBranchIds.indexOf(branchId) > -1) return [];
        const exerciseId = resolveExerciseId(branches, branchId);
        return exerciseId && !usedExerciseIds.includes(exerciseId)
          ? [{ branchId, exerciseId }]
          : [];
      });
    };

    const getBranchAndId = (
      branches: SkillTreeType,
      usedBranchIds: string[],
    ): BranchSelectionResult | null => {
      const candidates = getResolvedBranches(branches, usedBranchIds);
      if (candidates.length === 0) return null;
      const { branchId: id, exerciseId } =
        candidates[Math.floor(Math.random() * candidates.length)];
      const branch = {
        branchId: id,
        branchTags: branches[id].tags,
        exerciseId,
      };
      return { branch, branchId: id };
    };

    const getSuperSetPairBranchAndId = (
      branches: SkillTreeType,
      usedBranchIds: string[],
    ): SuperSetBranchSelectionResult | null => {
      const candidates = getResolvedBranches(branches, usedBranchIds);
      if (candidates.length === 0) return null;
      const branchKeys = candidates.map((candidate) => candidate.branchId);
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      const id = picked.branchId;
      const exerciseId = picked.exerciseId;
      const branch = {
        branchId: id,
        branchTags: branches[id].tags,
        exerciseId: exerciseId,
      };
      let fillUpBranchAndId: BranchSelectionResult | undefined = undefined;
      // a both sided exercise seeks a both sided partner and trains alone without one
      const exercise = exerciseMap.get(exerciseId);
      if (exercise?.tags.includes("SIDE_BOTH")) {
        // searching for oppositeDirection exercise
        let oppositeDirection = "noDirection";
        const directionType = getTagValue(
          exercise.tags,
          TagGroups.EXERCISE_DIRECTION,
        );
        if (directionType) {
          oppositeDirection = getOpposingExerciseDirection(directionType);
          if (oppositeDirection === "") {
            oppositeDirection = "noDirection";
          }
        }
        usedBranchIds.push(id);
        for (let k = 0; k < branchKeys.length; k++) {
          const secondBranch: SkillTreeType = {};
          secondBranch[branchKeys[k]] = branches[branchKeys[k]];
          const result = getBranchAndId(secondBranch, usedBranchIds);
          if (result !== null) {
            const resultExercise = exerciseMap.get(result.branch.exerciseId);
            if (resultExercise?.tags.includes("SIDE_BOTH")) {
              fillUpBranchAndId = result;
              if (resultExercise.tags.includes(oppositeDirection)) break;
            }
          }
        }
      }
      return { branch, branchId: id, fillUpBranchAndId };
    };

    let duration = 0;
    let setsPerExercise = 2;
    let isShortTraining = false; // does map to following skills, not all short trainings like prev and stability
    if (["WU", "MOB", "BR", "CD"].indexOf(type) > -1) {
      isShortTraining = true;
      // set these short trainings to 10 slots, 1 set, 60 secs, 10 secs pause
      const numOfSlots = 10;
      let slots = 0;
      setsPerExercise = 1;
      while (slots < numOfSlots) {
        let result = getBranchAndId(genderFiltered, branchesIds);
        // end if no more branches
        if (result === null) break;
        branchesIds.push(result.branchId);
        // one sided exercises fill two slots, left and right
        let side = getTagValues(result.branch.branchTags, TagGroups.SIDE);
        const branchSlots = side.indexOf("ONE") > -1 ? 2 : 1;
        if (slots + branchSlots > numOfSlots) continue;

        branches.main.push(result.branch);
        slots += branchSlots;
      }
    } else if (["BAS", "GKS"].indexOf(type) > -1) {
      // stability with weights: 4 from any region; bodyweight: 3 upper body plus 2 full body
      let regions =
        type === "GKS" && !HAS_WEIGHTS
          ? [
              { tags: ["REGION_UPPER_BODY"], count: 3 },
              { tags: ["REGION_FULL_BODY"], count: 2 },
            ]
          : [{ tags: [], count: 4 }];
      for (let region of regions) {
        for (let i = 0; i < region.count; i++) {
          const regionFiltered = filterByRegion(
            genderFiltered,
            getTagValues(region.tags, TagGroups.REGION),
          ).keep;
          let result =
            getBranchAndId(regionFiltered, branchesIds) ??
            getBranchAndId(genderFiltered, branchesIds);
          // end if no more branches
          if (result === null) break;
          let side = getTagValues(result.branch.branchTags, TagGroups.SIDE);
          // do not use again
          branchesIds.push(result.branchId);

          if (side.indexOf("ONE") > -1) {
            if (i === region.count - 1) {
              i--;
              // do not use one sided exercises as last because it would be one too many
              continue;
            }
            // one sided exercises used left and right, so we need one branch less
            i++;
          }

          branches.main.push(result.branch);
        }
      }
    } else if (type.indexOf("PREV") > -1) {
      // set PREV short trainings to 3 WUSPEZ (1 set, 10 secs pause) + 6 PREV (3x2 superSets, 2 sets, 30 secs pause)
      let sets: {
        skill: string;
        count: number;
        skills: string[];
      }[] = [
        {
          skill: "WUSPEZIAL",
          count: 3,
          skills: ["WU", "WARM_UP", "WARM_UP_SPECIAL"],
        },
        {
          skill: "main",
          count: 3, // results in one super set pair each 3 => 6
          skills: ["PREVENTION"],
        },
      ];
      for (let set of sets) {
        // filter Object by skill of this set
        // Note: prev is guaranteed to be defined here since we're in type.indexOf("PREV") > -1 block
        const filteredBranches = Object.keys(
          genderFiltered,
        ).reduce<SkillTreeType>((acc, branchKey) => {
          const skillTags = getTagValues(
            genderFiltered[branchKey].tags,
            TagGroups.SKILL,
          );
          const prevTags = getTagValues(
            genderFiltered[branchKey].tags,
            TagGroups.PREVENTION,
          );
          if (
            skillTags.some((st) => set.skills.includes(st)) &&
            prevTags.includes(prev!)
          ) {
            acc[branchKey] = genderFiltered[branchKey];
          }
          return acc;
        }, {});

        const isMainSkill = set.skill === "main";
        for (let i = 0; i < set.count; i++) {
          if (isMainSkill) {
            const result = getSuperSetPairBranchAndId(
              filteredBranches,
              branchesIds,
            );
            // end if no more branches
            if (result === null) break;
            // set branches for main skill ordered WEIGHTS last
            const hasWeights =
              result.branch.branchTags.includes("EQ_TYPE_WEIGHTS");
            if (hasWeights) {
              branches.main.unshift(result.branch);
              branchesIds.unshift(result.branchId);
              // add fill up branch for BOTH_SIDE
              if (result.fillUpBranchAndId?.branch) {
                branches.main.unshift(result.fillUpBranchAndId.branch);
                branchesIds.unshift(result.fillUpBranchAndId.branch.branchId);
              }
            } else {
              branches.main.push(result.branch);
              branchesIds.push(result.branchId);
              // add fill up branch for BOTH_SIDE
              if (result.fillUpBranchAndId?.branch) {
                branches.main.push(result.fillUpBranchAndId.branch);
                branchesIds.push(result.fillUpBranchAndId.branch.branchId);
              }
            }
          } else {
            const result = getBranchAndId(filteredBranches, branchesIds);
            // end if no more branches
            if (result === null) break;
            // set branches for secondary sets skill
            if (!branches[set.skill]) {
              branches[set.skill] = [];
            }
            branches[set.skill].push(result.branch);
            branchesIds.push(result.branchId);
          }
        }
      }
    } else {
      // otherwise add till reaching 15 mins
      while (duration < 15 * 60) {
        let result = getBranchAndId(genderFiltered, branchesIds);
        // end if no more branches
        if (result === null) break;
        branches.main.push(result.branch);
        branchesIds.push(result.branchId);

        //calc length
        let exDur = setsPerExercise * 60; // TODO is 60 sec a good guess?
        let pauseDur = setsPerExercise * 15; // TODO is 15 sec a good guess for pause
        duration += exDur;
        duration += pauseDur;
      }
    }

    if (TrainingGenerator.DEBUG) {
      console.log("branches selected", branches);
    }

    let prevs = type.indexOf("PREV") > -1 ? [type] : [];
    let exerciseTime = type.indexOf("PREV") > -1 ? 30 : 15;
    let exercisePairs: ExercisePair[] = this.getExercisePairs(
      type,
      branches.main,
      exercises,
      userPains,
      prevs,
      isShortTraining,
    );
    // delete single PREV sets and add them up to Super sets
    if (type.indexOf("PREV") > -1) {
      let singlePairIndex = exercisePairs.findIndex((e) => !e.second);
      while (singlePairIndex !== -1) {
        let secondSinglePair: BranchExerciseReference | undefined;
        let secondSinglePairIndex = -1;
        for (let i = 0; i < exercisePairs.length; i++) {
          if (!exercisePairs[i].second && i !== singlePairIndex) {
            secondSinglePair = exercisePairs[i].first;
            secondSinglePairIndex = i;
          }
        }
        if (secondSinglePairIndex !== -1 && secondSinglePair) {
          exercisePairs[singlePairIndex].second = secondSinglePair;
          exercisePairs.splice(secondSinglePairIndex, 1);
        }
        let nextSinglePairIndex = exercisePairs.findIndex((e) => !e.second);
        singlePairIndex =
          nextSinglePairIndex !== singlePairIndex ? nextSinglePairIndex : -1;
      }
    }

    let exerciseList = this.getSetListFromExercisePairs(
      exercisePairs,
      { skill: type as SkillCode, length: exerciseTime },
      skillTrees,
      user,
      place,
      equipment,
      exercises,
      setsPerExercise,
      temporalData,
      userExerciseData.exerciseData,
      isShortTraining,
      true,
    );
    dropTrailingPause(exerciseList);

    // handle PREV special warm-up
    if (type.indexOf("PREV") > -1) {
      setsPerExercise = 1;
      let exercisePairsWU: ExercisePair[] = this.getExercisePairs(
        "WUSPEZIAL",
        branches["WUSPEZIAL"],
        exercises,
        userPains,
        [type],
        isShortTraining,
      );

      let exerciseListWU = this.getSetListFromExercisePairs(
        exercisePairsWU,
        {
          skill: "WUSPEZIAL",
          length: 4,
        },
        skillTrees,
        user,
        place,
        equipment,
        exercises,
        setsPerExercise,
        temporalData,
        userExerciseData.exerciseData,
        isShortTraining,
      );
      exerciseList = exerciseListWU.concat(exerciseList);
    }

    if (TrainingGenerator.DEBUG) {
      console.log("final short training list", exerciseList);
    }

    return exerciseList;
  };

  /**
   * Generates exercise lists for full training plan workouts.
   * Handles section selection based on date, applies all filters (soreness, equipment, level),
   * replaces blocked exercises, and builds the complete set list with proper ordering.
   */
  generatePlanWorkout = (
    type: TrainingType,
    user: UserType,
    place: string,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    weekday: number,
    equipment: string[],
    givenSection: number | undefined,
    daysSinceLastWorkout: number,
    userExerciseData: {
      exerciseData: Record<string, UserExerciseDataType | undefined>;
      branchData: Record<string, UserExerciseBranchDataType | undefined>;
    },
  ): GeneratedSetListEntry[] => {
    // Validate user has completed anamnesis
    requireWorkoutData(user);

    const userLevel = getUserLevel(user);

    // Get temporal data with proper Date handling
    const temporalData: TemporalDataType[] = getTemporalData(user);

    // Validate training plan exists
    const trainingPlan = requireTrainingPlan(user);

    //select current section => max start date of those with start date before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use a local variable for sections to avoid mutating frozen store objects
    let sections = trainingPlan.sections;

    if (TrainingGenerator.DEBUG)
      console.log("NO training for " + daysSinceLastWorkout + " days");
    if (daysSinceLastWorkout > 21) {
      if (TrainingGenerator.DEBUG) console.log("NEUEN PLAN GENERIEREN");
    } else if (daysSinceLastWorkout > 7) {
      // Extend section start dates when user has missed multiple weeks
      const { sections: extendedSections, additionalWeeks } =
        extendSectionsForMissedWeeks(sections, daysSinceLastWorkout);

      if (TrainingGenerator.DEBUG)
        console.log(`Extending plan sections by ${additionalWeeks} weeks`);

      sections = extendedSections;
    }

    let currSec;
    if (givenSection) {
      currSec = sections[givenSection];
    } else {
      currSec = getSectionForDate(
        sections as Parameters<typeof getSectionForDate>[0],
        today.getTime(),
      );
    }

    if (TrainingGenerator.DEBUG) console.log("CURRENT SECTION:", currSec);

    // Cast trainings - schema type differs from UserTrainingType model due to skills property typing
    const trainings = currSec.trainings as UserTrainingType[];

    //get training for current weekday -- there should be only one
    let currTraining: UserTrainingType | undefined = trainings.filter(
      (training) => {
        return training.weekday === weekday;
      },
    )[0];
    // This should never happen
    if (typeof currTraining === "undefined") {
      // use first training in list
      currTraining = trainings[0];
    }

    if (TrainingGenerator.DEBUG) {
      console.log("TRAINING INPUT", currTraining);
    }

    // Shallow copy lengths to avoid mutating frozen store objects (immer)
    const lengths = { ...currTraining.lengths };

    // if no test needed => build training
    let exerciseBranches = cloneWithValidation(
      currTraining.skills,
      SkillBranchesSchema,
      "currTraining.skills",
    );

    /** DEV for specific exercises

     console.log(exerciseBranches);
     exerciseBranches = {
            PREV: [
                {
                    branchId: "152",
                    tags: [
                        "PREVENTION_SHOULDER",
                        "SKILL_COOL_DOWN",
                        "SKILL_MOBILITY",
                        "EQ_TYPE_KG",
                        "SIDE_ONE",
                        "MUSCLE_INVOLVEMENT_ISOLATED",
                        "REGION_UPPER_BODY",
                        "EXERCISE_DIRECTION_LOWER_BODY",
                        "SEASON_PHASE_PREPARATORY",
                        "SEASON_PHASE_COMPETITION",
                        "SEASON_PHASE_PAUSE",
                        "PLACE_HALL",
                        "PLACE_STUDIO",
                        "PLACE_HOME",
                        "PLACE_OUTSIDE",
                        "MUSCLE_SHOULDER",
                        "MUSCLE_SCAPULAR_STABILIZER_REAR",
                        "MUSCLE_SECONDARY_SCAPULAR_STABILIZER_FRONT",
                        "MUSCLE_SECONDARY_LOWER_BACK",
                        "MUSCLE_SECONDARY_GLUTES",
                        "MUSCLE_SECONDARY_OUTER_THIGH",
                        "PAIN_SHOULDER",
                        "PAIN_SPINE",
                        "SIDE_LEFT"
                    ],
                    exercises: {
                        "1": { id: 126 },
                        "2": { id: 126 },
                        "3": { id: 126 }
                    }
                }
            ]
        };
     */

    let firstUnfilledSkillError: GeneratorError | undefined;
    for (const skill of Object.keys(exerciseBranches) as SkillTypes[]) {
      let replace: string[] = [];
      let branches = exerciseBranches[skill]!.reduce<
        Record<string, ExerciseBranchEntry>
      >((acc, entry) => {
        if (entry.branchId) {
          acc[entry.branchId] = entry;
        }
        return acc;
      }, {});
      let sorenessFiltered = filterBySoreness(branches, temporalData, skill);
      replace = replace.concat(sorenessFiltered.replace);
      let equipmentFiltered = filterByEquipment(
        sorenessFiltered.keep,
        equipment,
      );
      replace = replace.concat(equipmentFiltered.replace);
      let levelFiltered = filterByUserLevel(
        equipmentFiltered.keep,
        user,
        exercises,
        userExerciseData.branchData,
      );

      replace = replace.concat(levelFiltered.replace);

      // A skill that cannot be filled frees its time; the session gets shorter
      const unfilledSkillError: GeneratorError = {
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: equipmentFiltered.missingEquipment || [],
      };
      if (
        Object.keys(levelFiltered.keep).length === 0 &&
        replace.length === 0
      ) {
        firstUnfilledSkillError ??= unfilledSkillError;
        exerciseBranches[skill] = [];
        continue;
      }

      let keep = Object.keys(levelFiltered.keep).map((id) => {
        return {
          tags: levelFiltered.keep[id].tags,
          exercises: levelFiltered.keep[id].exercises,
          branchId: id,
        };
      });

      if (replace.length > 0) {
        if (TrainingGenerator.DEBUG) {
          console.log("Replacement needed " + skill, replace);
          console.log("Keep others", keep);
        }

        if (skill.indexOf("CARDIO") > -1) {
          // replace with zone 5 cardio
          const cardioFiveBranches = skillTrees["CARDIO_5"];
          const cardioReplacement = cardioFiveBranches?.["576"];
          if (!cardioReplacement) {
            throw {
              type: "NO_EXERCISES",
              subtype: "CARDIO_5_MISSING",
              params: [],
            };
          }

          // replace existing cardio skill with cardio 5
          exerciseBranches[skill] = [];
          const cardioLength = lengths[skill] ?? 0;
          const cardioSkill = "CARDIO_5" satisfies SkillTypes;
          lengths[cardioSkill] = Math.min(cardioLength, 20); // max 20 minutes of replacemnet cardio

          // Resolve the exercise for user level (CARDIO_5 is added mid-loop
          // and won't be processed by the exercise selection step below)
          const cardioExercise = getUserExerciseFromBranch(
            {
              levels: cardioReplacement.levels as Record<
                number,
                { exerciseId: string }
              >,
              tags: cardioReplacement.tags,
            },
            userLevel,
            exercises,
            userExerciseData.branchData["576"] ?? null,
          );
          exerciseBranches[cardioSkill] = [
            {
              branchId: "576",
              branchTags: cardioExercise
                ? cardioExercise.tags
                : cardioReplacement.tags,
              exerciseId: cardioExercise?.id ?? "-1",
            },
          ];
          // a blocked CARDIO_5 replaced itself with the resolved run above
          if (skill === cardioSkill) continue;
        } else {
          const PAINS = getUserTagValues(
            user.workoutData?.tags,
            TagGroups.PAIN,
          );
          const prevSkills = getPreventionsFromPains(PAINS);
          // make sure to replace ALL exercises for WUSPEZ and PREV
          if (skill.indexOf("PREV") !== -1 || skill === "WUSPEZIAL") {
            for (let i = 0; i < keep.length; i++) {
              let temp = replace[0];
              replace.push(temp);
            }
            keep = [];
          }
          let replacement = this.replaceExerciseBranches(
            skill,
            replace,
            temporalData,
            equipment,
            user,
            exercises,
            skillTrees,
            Object.keys(keep).map(
              (index) => keep[parseInt(index, 10)].branchId,
            ),
            prevSkills,
            userExerciseData,
            false,
          );
          if (
            replacement.length === 0 &&
            keep.length === 0 &&
            skill.indexOf("PREV") === -1 &&
            skill !== "WUSPEZIAL"
          ) {
            firstUnfilledSkillError ??= unfilledSkillError;
          }
          // Change used skill from former prevention to new PREV skill if needed
          if (skill.indexOf("PREV") !== -1 && replacement.length !== 0) {
            let prevRegion = getRegionsForPreventionSkills([skill]);
            // check if prevention region is still the same
            let regionReplacement = replacement.filter((r) =>
              getTagValues(r.tags, TagGroups.PREVENTION).some((p) =>
                prevRegion.includes(p),
              ),
            );
            const prevSkillsSecondary = prevSkills.filter((s) => s !== skill);
            if (regionReplacement.length === 0) {
              // change to new PREV skill
              let otherPrevSkill: SkillTypes = skill;
              for (let p = 0; p < prevSkillsSecondary.length; p++) {
                let secondaryPrevRegion = getRegionsForPreventionSkills([
                  prevSkillsSecondary[p],
                ]);
                let secondaryRegionReplacement = replacement.filter((r) =>
                  getTagValues(r.tags, TagGroups.PREVENTION).some((p) =>
                    secondaryPrevRegion.includes(p),
                  ),
                );
                if (secondaryRegionReplacement.length === replacement.length) {
                  otherPrevSkill = prevSkillsSecondary[p] as SkillTypes;
                  break;
                }
              }
              // Check if skill already has branches (not null/undefined AND has content)
              if (exerciseBranches[otherPrevSkill]?.length > 0) {
                exerciseBranches[otherPrevSkill] =
                  exerciseBranches[otherPrevSkill]!.concat(replacement);
                lengths[otherPrevSkill] =
                  (lengths[otherPrevSkill] ?? 0) + (lengths[skill] ?? 0);
              } else {
                exerciseBranches[otherPrevSkill] = replacement;
                lengths[otherPrevSkill] = lengths[skill] ?? 0;
              }
              // select exercise for updated userLevel
              exerciseBranches[otherPrevSkill] = exerciseBranches[
                otherPrevSkill
              ]!.map((branchData) => {
                if (branchData && branchData.branchId) {
                  const branchId = branchData.branchId;
                  const levels =
                    branchData.exercises ?? branchData.levels ?? {};
                  const branchTags = branchData.tags ?? [];
                  const exercise = getUserExerciseFromBranch(
                    {
                      levels: levels as Record<number, { exerciseId: string }>,
                      tags: branchTags,
                    },
                    userLevel,
                    exercises,
                    userExerciseData.branchData[branchId] ?? null,
                  );
                  return {
                    branchId,
                    branchTags: exercise ? exercise.tags : branchTags,
                    exerciseId: exercise?.id ?? "-1",
                  };
                }
                return null;
              }).filter(
                (item): item is NonNullable<typeof item> => item !== null,
              );
              replacement = [];
            }
          }

          if (TrainingGenerator.DEBUG) {
            console.log("replacement", replacement);
            console.log("skillTrees", skillTrees);
          }
          if (
            (skill.indexOf("PREV") !== -1 || skill === "WUSPEZIAL") &&
            replacement.length === 0
          ) {
            exerciseBranches[skill] = [];
          } else {
            exerciseBranches[skill] = keep.concat(replacement);
          }
        }
      }

      //for each exerciseBranch select exercise for updated userLevel
      exerciseBranches[skill] = exerciseBranches[skill]!.map((branchData) => {
        if (branchData && branchData.branchId) {
          const branchId = branchData.branchId;
          const levels = branchData.exercises ?? branchData.levels ?? {};
          const branchTags = branchData.tags ?? [];
          const exercise = getUserExerciseFromBranch(
            {
              levels: levels as Record<number, { exerciseId: string }>,
              tags: branchTags,
            },
            userLevel,
            exercises,
            userExerciseData.branchData[branchId] ?? null,
          );
          return {
            branchId,
            branchTags: exercise ? exercise.tags : branchTags,
            exerciseId: exercise?.id ?? "-1",
          };
        }
        return null;
      }).filter((item): item is NonNullable<typeof item> => item !== null);
    }

    const sorted = (Object.keys(exerciseBranches) as SkillTypes[])
      .sort((a, b) => {
        return (
          WorkoutConstants.SECTION_ORDER.indexOf(a) -
          WorkoutConstants.SECTION_ORDER.indexOf(b)
        );
      })
      .map((skillKey) => {
        const branchArray = exerciseBranches[skillKey];
        if (branchArray && branchArray.length > 0) {
          // add to sorted if not null/empty
          return {
            skill: skillKey,
            length: lengths[skillKey] ?? 0,
            branches: branchArray as BranchExerciseReference[],
          };
        }
        return undefined;
      })
      .filter(
        (item): item is SkillBranchList & { length: number } =>
          item !== undefined,
      );
    let setList = this.createSetList(
      sorted,
      exercises,
      skillTrees,
      user,
      place,
      equipment,
      userExerciseData ? userExerciseData.exerciseData : null,
    );

    if (TrainingGenerator.DEBUG) {
      console.log("FINAL SET LIST:", setList);
    }

    if (setList.length === 0 && firstUnfilledSkillError) {
      throw firstUnfilledSkillError;
    }

    return setList;
  };

  /**
   * Replaces exercise branches that are blocked by constraints (soreness, equipment, level).
   * Finds suitable replacement branches from the skill tree while respecting region balance
   * and avoiding already-used branches.
   */
  replaceExerciseBranches = (
    skill: string,
    replace: string[],
    temporalData: TemporalDataType[],
    equipment: string[],
    user: UserType,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    usedBranchIds: string[],
    prevSkills: string[],
    userExerciseData: UserExerciseDataMapType,
    isShortWorkout: boolean,
  ): ExerciseBranchType[] => {
    const replacement: ExerciseBranchType[] = [];
    // no weights for kids
    requireWorkoutData(user);
    const ageGroup = ageGroupFor(getUserBirthday(user));
    const HAS_WEIGHTS =
      ageGroup !== WorkoutConstants.AGE_GROUPS.CHILD && hasWeights(equipment);

    let skillTree = getSkillTree(
      skillTrees,
      skill,
      prevSkills,
      HAS_WEIGHTS,
      isShortWorkout,
      temporalData,
      replace.length,
    );
    if (Object.keys(skillTree).length !== 0) {
      const allBranches: Record<string, SkillBranchData> = {};
      // rewrite data format of branches for filter methods
      for (const id in skillTree) {
        const exercisesMap: Record<string, { exerciseId: string }> = {};
        for (const lvlKey in skillTree[id].levels) {
          const levelData = skillTree[id].levels[lvlKey];
          const exerciseId = levelData.exerciseId;
          exercisesMap[lvlKey] = {
            exerciseId,
          };
        }
        allBranches[id] = {
          tags: skillTree[id].tags,
          exercises: exercisesMap,
          branchId: id,
        };
      }
      let filteredBranches = filterBySoreness(
        allBranches,
        temporalData,
        skill,
      ).keep;
      filteredBranches = filterByEquipment(filteredBranches, equipment).keep;
      filteredBranches = filterByUserLevel(
        filteredBranches,
        user,
        exercises,
        userExerciseData.branchData,
      ).keep;
      filteredBranches = filterByAge(filteredBranches, ageGroup).keep;
      filteredBranches = filterByGender(
        filteredBranches,
        getUserGender(user) ?? "FEMALE",
      ).keep;

      const userLevel = getUserLevel(user);
      const resolveExerciseId = (branchId: string): string | null =>
        resolveBranchExerciseId(
          skillTree[branchId],
          userLevel,
          userExerciseData.branchData[branchId],
        );

      const usedExerciseIds = new Set<string>();
      for (const branchId of usedBranchIds) {
        const exerciseId = skillTree[branchId]
          ? resolveExerciseId(branchId)
          : null;
        if (exerciseId) {
          usedExerciseIds.add(exerciseId);
        }
      }

      let possibleBranches = Object.keys(filteredBranches).filter(
        (branchId) => usedBranchIds.indexOf(branchId) === -1,
      );
      // A candidate resolving to an exercise the skill already holds drops out
      const isUnusedExercise = (branchId: string): boolean => {
        const exerciseId = resolveExerciseId(branchId);
        return exerciseId === null || !usedExerciseIds.has(exerciseId);
      };
      const maxCountPerRegion = userLevel === "PROFESSIONAL" ? 6 : 5;
      const branchesByRegion: Record<string, number> = {
        LOWER_BODY: 0,
        UPPER_BODY: 0,
        CORE: 0,
        FULL_BODY: 0,
      };
      for (const branchId of usedBranchIds) {
        if (skillTree[branchId]) {
          const branch = skillTree[branchId];
          const regions = getTagValues(branch.tags, TagGroups.REGION);
          const side = getTagValues(branch.tags, TagGroups.SIDE)[0];
          for (let i = 0; i < regions.length; i++) {
            const count = side === "ONE" ? 2 : 1;
            branchesByRegion[regions[i]] =
              (branchesByRegion[regions[i]] ?? 0) + count;
          }
        }
      }

      for (let i = 0; i < replace.length; i++) {
        possibleBranches = possibleBranches.filter(isUnusedExercise);
        if (possibleBranches.length < 1) {
          // skip for now
          //TODO discuss possible alternatives to skipping
          if (TrainingGenerator.DEBUG)
            console.log(
              "ERROR no exercise left for " +
                skill +
                " without constraints: soreness " +
                temporalData +
                " equipment " +
                equipment,
            );
        } else {
          // regions to find replacement for (each replace[i] is a single region string)
          const regionToReplace = replace[i];
          let regionBranches = possibleBranches.filter((branchId) => {
            let branchRegions = getTagValues(
              skillTree[branchId].tags,
              TagGroups.REGION,
            );
            return branchRegions.includes(regionToReplace);
          });
          if (regionBranches.length === 0) {
            // Try less-used regions
            let arrayOfLessUsedRegions = Object.keys(branchesByRegion).sort(
              (a, b) => branchesByRegion[a] - branchesByRegion[b],
            );
            for (let l = 0; l < arrayOfLessUsedRegions.length; l++) {
              if (
                branchesByRegion[arrayOfLessUsedRegions[l]] >= maxCountPerRegion
              ) {
                break;
              }
              let candidatesForRegion = possibleBranches.filter((branchId) => {
                let branchRegions = getTagValues(
                  skillTree[branchId].tags,
                  TagGroups.REGION,
                );
                return branchRegions.some(
                  (region) => region === arrayOfLessUsedRegions[l],
                );
              });
              if (
                maxCountPerRegion -
                  branchesByRegion[arrayOfLessUsedRegions[l]] ===
                1
              ) {
                // only one more ex allowed for this region
                candidatesForRegion = candidatesForRegion.filter((branchId) => {
                  const branchSide = getTagValues(
                    skillTree[branchId].tags,
                    TagGroups.SIDE,
                  );
                  return branchSide.indexOf("ONE") === -1;
                });
              }
              if (candidatesForRegion.length > 0) {
                regionBranches = candidatesForRegion;
                break;
              }
            }
          }
          if (regionBranches.length === 0) {
            // can not add more branches
            if (
              (skill.indexOf("PREV") !== -1 || skill === "WUSPEZIAL") &&
              replacement.length < replace.length
            ) {
              return [];
            } else {
              return replacement;
            }
          }
          //choose random id of possible ones and avoid choosing it again
          let randomId =
            regionBranches[Math.floor(Math.random() * regionBranches.length)];
          const branchId = possibleBranches.splice(
            possibleBranches.indexOf(randomId),
            1,
          )[0];
          const { tags, levels: constLevels } = skillTree[branchId];
          const levels = cloneWithValidation(
            constLevels,
            ExerciseLevelsSchema,
            "constLevels",
          );

          const exerciseLevels: { [level: number]: { exerciseId: string } } =
            {};
          for (const levelKey in levels) {
            const level = Number(levelKey);
            const levelData = levels[levelKey];
            exerciseLevels[level] = {
              exerciseId: levelData.exerciseId,
            };
          }
          const resolvedId = resolveExerciseId(branchId);
          if (resolvedId) {
            usedExerciseIds.add(resolvedId);
          }
          const countChosen =
            getTagValues(tags, TagGroups.SIDE).indexOf("ONE") > -1 ? 2 : 1;
          const regionChosen = getTagValues(tags, TagGroups.REGION)[0];
          branchesByRegion[regionChosen] =
            (branchesByRegion[regionChosen] ?? 0) + countChosen;
          replacement.push({
            tags: tags,
            exercises: exerciseLevels,
            branchId: branchId,
          });
        }
      }
      if (
        (skill.indexOf("PREV") !== -1 || skill === "WUSPEZIAL") &&
        replacement.length < replace.length
      ) {
        return [];
      } else {
        return replacement;
      }
    } else {
      return [];
    }
  };

  /**
   * Converts exercise pairs into a detailed set list with timing and repetitions.
   * Handles special cases for CARDIO intervals, MAX training with support exercises,
   * and standard superset/single-set patterns with appropriate pause durations.
   */
  getSetListFromExercisePairs = (
    exercisePairs: ExercisePair[],
    skill: { skill: SkillCode; length: number },
    skillTrees: { [skillName: string]: SkillTreeType },
    user: UserType,
    place: string,
    equipment: string[],
    exercises: ExerciseType[],
    setsPerExercise: number,
    temporalData: TemporalDataType[],
    userExerciseData: Record<string, UserExerciseDataType | undefined> | null,
    isShortTraining: boolean = false,
    isFocusWorkout: boolean = false,
  ): GeneratedSetListEntry[] => {
    // Create exercise map for O(1) lookup by ID
    const exerciseMap = createExerciseMap(exercises);
    if (TrainingGenerator.DEBUG) {
      console.log("Get set list with exercises: ", exercises);
      console.log("and exercisePairs: ", exercisePairs);
    }
    if (skill.skill.indexOf("CARDIO") > -1) {
      const CARDIO_5 = skillTrees["CARDIO_5"];
      const CARDIO_4 = skillTrees["CARDIO_4"];
      let pauseExercise = CARDIO_5[Object.keys(CARDIO_5)[0]];
      let pauseExerciseId =
        pauseExercise.levels[Number(Object.keys(pauseExercise.levels)[0])]
          .exerciseId;
      let fillExercise = CARDIO_4[Object.keys(CARDIO_4)[0]];
      let fillExerciseId =
        fillExercise.levels[Number(Object.keys(fillExercise.levels)[0])]
          .exerciseId;
      let intervalLength = 120;
      let pauseLength = 60;
      let startRepetition = 3;
      switch (skill.skill) {
        case "CARDIO_5":
        case "CARDIO_4":
          let length = skill.length;
          const tempTags = temporalData.map((element) => element.tag);
          let areas = getAreasFor(tempTags);
          if (areas.indexOf("lowerBody") > -1) {
            // max 20 minutes if lowerBody soreness
            length = Math.min(length, 20);
          }
          // run given time
          return [
            {
              branchId: exercisePairs[0].first.branchId,
              exerciseId: exercisePairs[0].first.exerciseId,
              set: [1, 1],
              skill: skill.skill,
              duration: length * 60, // skill.length is minutes, make seconds
            },
          ];
        case "CARDIO_3":
          break;
        case "CARDIO_2":
          intervalLength = 60;
          pauseLength = 60;
          startRepetition = 3;
          break;
        case "CARDIO_1_LAKTAT":
          intervalLength = 30;
          pauseLength = 240;
          startRepetition = 2;
          break;
        case "CARDIO_1_SHORT":
          intervalLength = 10;
          pauseLength = 80;
          startRepetition = 3;
          break;
        default:
          break;
      }
      // run WU(4) intervals with pause(5) and fill up at the end(4)
      let timeRemaining = skill.length * 60; // skill.length is minutes, get seconds
      const result: GeneratedSetListEntry[] = [];
      const firstExercise = exerciseMap.get(exercisePairs[0].first.exerciseId);
      if (!firstExercise) return result;
      // Cardio has no feedback progression yet: always the authored start count.
      const exercise = this.getExerciseStartValues(
        skill.skill,
        exercisePairs[0].first,
        user,
        firstExercise,
        null,
        isShortTraining,
      );
      const intervalTime = intervalLength + pauseLength;
      const repetition = Math.min(
        exercise.repetition ?? startRepetition,
        Math.floor(timeRemaining / intervalTime),
      );
      for (let i = 0; i < repetition; i++) {
        // add intervall and running pause
        result.push({
          branchId: exercisePairs[0].first.branchId,
          exerciseId: exercisePairs[0].first.exerciseId,
          set: [i + 1, repetition],
          skill: skill.skill,
          duration: intervalLength,
        });
        result.push({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: pauseExerciseId,
          set: [i + 1, repetition],
          skill: skill.skill,
          duration: pauseLength,
        });
        timeRemaining -= intervalTime;
      }
      const warmUpLength = Math.min(timeRemaining, 5 * 60);
      if (warmUpLength > 0) {
        // add warm-up of up to 5 min at start
        result.unshift({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: fillExerciseId,
          set: [1, 1],
          skill: skill.skill,
          duration: warmUpLength,
        });
        timeRemaining -= warmUpLength;
      }
      if (timeRemaining >= 60) {
        // fill the remaining time when at least a minute is left
        result.push({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: fillExerciseId,
          set: [1, 1],
          skill: skill.skill,
          duration: timeRemaining,
        });
      }
      return result;
    } else if (skill.skill.indexOf("MAX") > -1) {
      const workoutData = requireWorkoutData(user);
      const gender = getUserGender(user);
      const ageGroup = ageGroupFor(getUserBirthday(user));
      const genderTag =
        ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
          ? "k"
          : gender === "MALE"
            ? "m"
            : "w";

      // build max training with 2 warm up and 2/3 training sets filled with support exercises
      const setList: GeneratedSetListEntry[] = [];
      const maxValues: MaxValuesType =
        workoutData.maxValues ?? DEFAULT_MAX_VALUES;
      // a support exercise appears at most once per skill
      const usedSupExercisesIds: string[] = [];

      // distribute weight/kg of support exercises by age and place
      let weightPercentage = 0.3; // child is default
      if (ageGroup !== WorkoutConstants.AGE_GROUPS.CHILD) {
        if (place === "STUDIO") {
          weightPercentage = 0.6;
        } else {
          weightPercentage = 0.5;
        }
      }
      let weightSupExUsed = 0;
      let kgSupExUsed = 0;

      // build set for each exercise
      for (let ep = 0; ep < exercisePairs.length; ep++) {
        // no superset, there is only first
        const first = exercisePairs[ep].first;
        const exercise = exerciseMap.get(first.exerciseId);
        if (!exercise) continue;
        // set with ex - pause -sup1 -pause -sup2 -pause
        let maxTrainingWeights = this.getMaxTrainingWeights(
          exercise,
          user,
          userExerciseData,
        );
        let trainingReps = this.getMaxTrainingReps(user, maxTrainingWeights);
        const workingWeights = maxTrainingWeights.trainingWeights.map(
          (weightPercentage) =>
            deriveWeightForExercise(
              weightPercentage,
              "weightFMax",
              exercise,
              maxValues,
            ) ?? 0,
        );
        const warmUpWeights = computeWarmupWeights(workingWeights[0], exercise);
        let trainingWeights = warmUpWeights.concat(workingWeights);
        // get soreness areas for filtering support ex
        const soreRegions = getAreasFor(
          temporalData.map((element) => element.tag),
        ).map(areaToRegion);
        const mainLiftMuscles = getTagValues(exercise.tags, TagGroups.MUSCLE);
        const supportExercises = exercises.filter(
          (e) =>
            getTagValues(e.tags, TagGroups.SKILL).indexOf("SUPPORT") > -1 &&
            getTagValues(e.tags, TagGroups.SIDE).indexOf("RIGHT") === -1 &&
            !getTagValues(e.tags, TagGroups.REGION).some((region) =>
              soreRegions.includes(region),
            ) &&
            !getTagValues(e.tags, TagGroups.MUSCLE).some((muscle) =>
              mainLiftMuscles.includes(muscle),
            ) &&
            e.displayName &&
            e.displayName.length > 0 &&
            equipmentForExerciseExists(e, equipment),
        );

        // build warm up
        // warm up scheme: ex - 60s pause, per warm up weight
        warmUpWeights.forEach((_, w) => {
          setList.push({
            branchId: first.branchId,
            exerciseId: first.exerciseId,
            tags: first.branchTags,
            set: [w + 1, trainingWeights.length],
            skill: skill.skill,
            weight: trainingWeights[w],
            repetition: trainingReps[w].repetitions,
            repetitionMAX: trainingReps[w],
          });
          setList.push({
            branchId: PLACEHOLDER_BRANCH_ID,
            exerciseId: PAUSE_EXERCISE_ID,
            set: [w + 1, trainingWeights.length],
            skill: skill.skill,
            duration: WARMUP_REST_SECONDS,
          });
        });
        // build training
        // training scheme: ex - 30s pause - 8rep/30s supEx - 60s pause - 8rep/30s supEx - 30s (Pro 90s) pause
        const supportExerciseDuration = 30;
        const supportExerciseRepetition = 8;
        const isPro =
          getUserLevel(user) === WorkoutConstants.LEVELS.PROFESSIONAL;
        const finalSupportRest = isPro ? 90 : 30;
        const emptyBreakRest = isPro ? 240 : 180;

        for (
          let trainingSet = warmUpWeights.length;
          trainingSet < trainingWeights.length;
          trainingSet++
        ) {
          const isLastSet = trainingSet === trainingWeights.length - 1;
          const pauseOf = (duration: number): GeneratedSetListEntry => ({
            branchId: PLACEHOLDER_BRANCH_ID,
            exerciseId: PAUSE_EXERCISE_ID,
            set: [trainingSet + 1, trainingWeights.length],
            skill: skill.skill,
            duration,
          });
          setList.push({
            branchId: first.branchId,
            exerciseId: first.exerciseId,
            tags: first.branchTags,
            set: [trainingSet + 1, trainingWeights.length],
            skill: skill.skill,
            weight: trainingWeights[trainingSet],
            repetition: trainingReps[trainingSet].repetitions,
            repetitionMAX: trainingReps[trainingSet],
          });
          if (isLastSet) {
            setList.push(pauseOf(120));
          } else {
            const unusedSupExercises = supportExercises.filter(
              (ex) => usedSupExercisesIds.indexOf(ex.id) === -1,
            );
            if (unusedSupExercises.length === 0) {
              setList.push(pauseOf(emptyBreakRest));
              continue;
            }

            // check if weight or kg is to be used
            let nextType: "kg" | "weight" = "weight";
            const supExUsedYet = weightSupExUsed + kgSupExUsed;
            if (supExUsedYet > 0) {
              const currentWeightPercentage = weightSupExUsed / supExUsedYet;
              if (currentWeightPercentage > weightPercentage) {
                nextType = "kg";
              }
            }
            let nextTypeSupExercises = getNextTypeFiltered(
              nextType,
              unusedSupExercises,
            );
            if (nextTypeSupExercises.length === 0) {
              // use other type
              nextType = nextType === "kg" ? "weight" : "kg";
              nextTypeSupExercises = getNextTypeFiltered(
                nextType,
                unusedSupExercises,
              );
            }
            if (nextType === "kg") {
              kgSupExUsed++;
            } else {
              weightSupExUsed++;
            }

            if (nextTypeSupExercises.length === 0) {
              if (TrainingGenerator.DEBUG) {
                console.log("No sup exercises for any type found");
              }
              nextTypeSupExercises = unusedSupExercises;
            }

            const supExercise =
              nextTypeSupExercises[
                Math.floor(Math.random() * nextTypeSupExercises.length)
              ];
            usedSupExercisesIds.push(supExercise.id);
            let supWeight: number = -1;
            if (
              getTagValues(supExercise.tags, TagGroups.EQ_TYPE).indexOf(
                "WEIGHTS",
              ) > -1 &&
              supExercise.values &&
              supExercise.values.weight
            ) {
              const supUserLevel = getUserLevel(user);
              supWeight =
                getValueByGenderAndLevel(
                  supExercise.values.weight.startValue as GenderLevelValueMap,
                  genderTag,
                  supUserLevel.toLowerCase(),
                ) ?? -1;
            }
            let supExerciseEntryFirst: GeneratedSetListEntry = {
              branchId: PLACEHOLDER_BRANCH_ID,
              exerciseId: supExercise.id,
              tags: supExercise.tags,
              set: [trainingSet + 1, trainingWeights.length] as [
                number,
                number,
              ],
              skill: skill.skill,
              duration: supportExerciseDuration,
              weight: supWeight > -1 ? supWeight : undefined,
            };
            if (supExercise.isAdvanceByReps) {
              supExerciseEntryFirst = {
                branchId: PLACEHOLDER_BRANCH_ID,
                exerciseId: supExercise.id,
                tags: supExercise.tags,
                set: [trainingSet + 1, trainingWeights.length] as [
                  number,
                  number,
                ],
                skill: skill.skill,
                repetition: supportExerciseRepetition,
                weight: supWeight > -1 ? supWeight : undefined,
              };
            }
            let supExerciseEntrySecond: GeneratedSetListEntry =
              supExerciseEntryFirst;
            if (
              supExercise.tags.indexOf("SIDE_ONE") > -1 &&
              supExercise.otherSideExerciseId
            ) {
              // use other side
              supExerciseEntrySecond = {
                branchId: PLACEHOLDER_BRANCH_ID,
                exerciseId: supExercise.otherSideExerciseId,
                tags: supExercise.tags,
                set: [trainingSet + 1, trainingWeights.length] as [
                  number,
                  number,
                ],
                skill: skill.skill,
                duration: supportExerciseDuration,
                weight: supWeight > -1 ? supWeight : undefined,
              };
              if (supExercise.isAdvanceByReps) {
                supExerciseEntrySecond = {
                  branchId: PLACEHOLDER_BRANCH_ID,
                  exerciseId: supExercise.otherSideExerciseId,
                  tags: supExercise.tags,
                  set: [trainingSet + 1, trainingWeights.length] as [
                    number,
                    number,
                  ],
                  skill: skill.skill,
                  repetition: supportExerciseRepetition,
                  weight: supWeight > -1 ? supWeight : undefined,
                };
              }
            }
            setList.push(
              pauseOf(30),
              supExerciseEntryFirst,
              pauseOf(60),
              supExerciseEntrySecond,
              pauseOf(finalSupportRest),
            );
          }
        }
      }
      return setList;
    } else {
      // default case
      const setList: GeneratedSetListEntry[] = [];
      for (let i = 0; i < exercisePairs.length; i++) {
        const firstExerciseId = exercisePairs[i].first.exerciseId;
        const firstExerciseData = exerciseMap.get(firstExerciseId);
        if (!firstExerciseData || firstExerciseId === "-1") {
          // no exercises found for this pair
          if (TrainingGenerator.DEBUG)
            console.error("NO EXERCISES IN PAIR: ", exercisePairs[i]);
          continue;
        }
        const firstRef = exercisePairs[i].first;
        if (!firstExerciseData) {
          if (TrainingGenerator.DEBUG)
            console.log("NO EXERCISE ENTRY FOR ID: ", firstRef.exerciseId);
        }

        // add data
        const first = this.getExerciseStartValues(
          skill.skill,
          firstRef,
          user,
          firstExerciseData,
          userExerciseData,
          isShortTraining,
        );
        // calc pause
        const inSetPauseLength = this.getInSetPauseBySkill(skill.skill);
        const singleRestLength = this.getSingleExerciseRestBySkill(skill.skill);
        const afterSetPauseLength =
          (isFocusWorkout
            ? this.getFocusAfterSetPause(skill.skill)
            : undefined) ?? this.getAfterSetPauseBySkill(skill.skill);
        const nextPair = exercisePairs
          .slice(i + 1)
          .find((pair) => isBuildablePair(pair, exerciseMap));
        const closingPauseLength =
          nextPair &&
          trainsSameRegionAndPrimaryMuscle(exercisePairs[i], nextPair)
            ? singleRestLength
            : afterSetPauseLength;

        let second: ReturnType<typeof this.getExerciseStartValues> | undefined;
        const secondPair = exercisePairs[i].second;
        if (secondPair && secondPair.exerciseId) {
          if (secondPair.exerciseId === "-1") {
            // no exercises found for this pair
            if (TrainingGenerator.DEBUG)
              console.error("NO SECOND EXERCISES IN PAIR: ", exercisePairs[i]);
            continue;
          }
          const secondRef = secondPair;
          const secondExerciseData = exerciseMap.get(secondRef.exerciseId);
          if (!secondExerciseData) {
            if (TrainingGenerator.DEBUG)
              console.log("NO EXERCISE ENTRY FOR: ", secondRef);
          }

          // add data
          second = this.getExerciseStartValues(
            skill.skill,
            secondRef,
            user,
            secondExerciseData!,
            userExerciseData,
            isShortTraining,
          );
        } else {
          if (
            TrainingGenerator.DEBUG &&
            secondPair &&
            typeof secondPair.exerciseId === "undefined"
          )
            console.error("NO EXERCISE ID DEFINED IN SECOND: ", secondPair);
        }
        let set: [number, number] = [0, 0];
        let j = 1;
        let setsToBuild = setsPerExercise;

        if (skill.skill.indexOf("SWR") > -1 || skill.skill.indexOf("SK") > -1) {
          let firstEqType = getTagValues(first.tags, TagGroups.EQ_TYPE);
          let secondEqType = second
            ? getTagValues(second.tags, TagGroups.EQ_TYPE)
            : [];
          if (
            firstEqType.indexOf("WEIGHTS") > -1 ||
            secondEqType.indexOf("WEIGHTS") > -1
          ) {
            // build one additional set for warm-up
            setsToBuild++;
            const isExplosivePower = skill.skill.indexOf("SK") > -1;
            let warmUpWeightFactor = isExplosivePower ? 0.65 : 0.7;
            let warmUpPauseDuration = second
              ? inSetPauseLength
              : isExplosivePower
                ? singleRestLength
                : 60;

            // add warm-up set
            set = [j, setsToBuild];
            let firstWarmUp = cloneWithValidation(
              first,
              SetListEntrySchema,
              "first",
            ) as ExerciseStartValues;
            if (firstWarmUp.weight !== undefined) {
              firstWarmUp.weight = firstWarmUp.weight * warmUpWeightFactor;
            }
            firstWarmUp.repetition = isExplosivePower
              ? 8
              : firstWarmUp.repetition;
            setList.push({
              branchId: firstWarmUp.branchId,
              exerciseId: firstWarmUp.exerciseId,
              tags: firstWarmUp.tags,
              set: set,
              skill: skill.skill,
              duration: firstWarmUp.duration,
              repetition: firstWarmUp.repetition,
              weight: firstWarmUp.weight,
              height: firstWarmUp.height,
              weightType: firstWarmUp.weightType,
            });
            setList.push({
              branchId: PLACEHOLDER_BRANCH_ID,
              exerciseId: "999999",
              set: set,
              skill: skill.skill,
              duration: warmUpPauseDuration,
            });
            if (second) {
              let secondWarmUp = cloneWithValidation(
                second,
                SetListEntrySchema,
                "second",
              ) as ExerciseStartValues;
              if (secondWarmUp.weight) {
                // reduce weight for warmup set
                secondWarmUp.weight = secondWarmUp.weight * warmUpWeightFactor;
              }
              secondWarmUp.repetition = isExplosivePower
                ? 8
                : secondWarmUp.repetition;
              // add second exercise to set anyway
              setList.push({
                branchId: secondWarmUp.branchId,
                exerciseId: secondWarmUp.exerciseId,
                tags: secondWarmUp.tags,
                set: set,
                skill: skill.skill,
                duration: secondWarmUp.duration,
                repetition: secondWarmUp.repetition,
                weight: secondWarmUp.weight,
                height: secondWarmUp.height,
                weightType: secondWarmUp.weightType,
              });
              setList.push({
                branchId: PLACEHOLDER_BRANCH_ID,
                exerciseId: "999999",
                set: set,
                skill: skill.skill,
                duration: warmUpPauseDuration,
              });
            }
            // increase set count
            j++;
          }
        }

        for (; j <= setsToBuild; j++) {
          set = [j, setsToBuild];
          // the in-set pause only runs inside a superset pair
          const roundRest = second ? inSetPauseLength : singleRestLength;
          const pauseLength =
            j === setsToBuild ? closingPauseLength : roundRest;

          setList.push({
            ...first,
            set: set,
            skill: skill.skill,
          });
          setList.push({
            branchId: PLACEHOLDER_BRANCH_ID,
            exerciseId: "999999",
            set: set,
            skill: skill.skill,
            duration: second ? inSetPauseLength : pauseLength,
          });
          if (second) {
            setList.push({
              ...second,
              set: set,
              skill: skill.skill,
            });
            setList.push({
              branchId: PLACEHOLDER_BRANCH_ID,
              exerciseId: "999999",
              set: set,
              skill: skill.skill,
              duration: pauseLength,
            });
          }
        }
      }
      return setList;
    }
  };

  /**
   * Returns the number of sets to perform for each exercise based on skill type.
   * Most skills use 2 sets, while warm-up/cardio use 1 set and MAX training uses 4 sets.
   */
  getSetCountBySkill = (skill: string, level: string): number => {
    let result;
    switch (skill) {
      case "CARDIO_1_SHORT":
        result = 10;
        break;
      case "CARDIO_1_LAKTAT":
        result = 4;
        break;
      case "CARDIO_2":
        result = 8;
        break;
      case "CARDIO_3":
        result = 6;
        break;
      case "CARDIO_4":
      case "CARDIO_5":
      case "WU":
      case "WUSKSA":
      case "WUSPEZIAL":
      case "CD":
      case "MOB":
      case "BR":
        result = 1;
        break;
      case "MAX":
      case "MAX_KRAFT":
        // do not use yet
        if (false && level === WorkoutConstants.LEVELS.PROFESSIONAL) {
        } else result = 4;
        break;
      case "SA":
      case "SAKG":
      case "SK":
      case "SKKG":
      case "SWR1":
      case "SWR2":
      case "SWR1KG":
      case "SWR2KG":
        // do not use yet
        if (false && level === WorkoutConstants.LEVELS.PROFESSIONAL) {
        } else result = 2;
        break;
      case "BAS":
      case "GKS":
      case "GKSKG":
      case "PREV":
      case "PREVSHOULDER":
      case "PREVKNEE":
      case "PREVWRIST":
      case "PREVANKLE":
      case "PREVSPINE":
      case "STABILITY":
      default:
        result = 2;
        break;
    }
    return result;
  };

  createSetList = (
    skillList: SkillBranchList[],
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    user: UserType,
    place: string,
    equipment: string[],
    userExerciseData: Record<string, UserExerciseDataType | undefined> | null,
  ): GeneratedSetListEntry[] => {
    if (TrainingGenerator.DEBUG) console.log("skillList: ", skillList);
    const userLevel = getUserLevel(user);
    const PAINS = getUserTagValues(user.workoutData?.tags, TagGroups.PAIN);

    let setList: GeneratedSetListEntry[] = [];

    if (TrainingGenerator.DEBUG) console.log("exercises: ", exercises);
    for (let i = 0; i < skillList.length; i++) {
      if (typeof skillList[i] === "undefined") continue;
      let setsPerExercise = this.getSetCountBySkill(
        skillList[i].skill,
        userLevel,
      );
      let branches: BranchExerciseReference[] = skillList[i].branches;
      // build super sets
      let exercisePairs: ExercisePair[] = [];

      if (skillList[i].skill.indexOf("CARDIO") > -1) {
        exercisePairs = [
          {
            first: branches[Math.floor(Math.random() * branches.length)],
          },
        ];
      } else {
        let prevs = skillList
          .filter((e) => e && e.skill.indexOf("PREV") > -1)
          .map((prev) => prev.skill);
        exercisePairs = orderExerciseUnits(
          this.getExercisePairs(
            skillList[i].skill,
            branches,
            exercises,
            PAINS,
            prevs,
          ),
          skillList[i].skill.indexOf("MAX") > -1,
        );
      }

      setList.push(
        ...this.getSetListFromExercisePairs(
          exercisePairs,
          {
            skill: skillList[i].skill as SkillCode,
            length: skillList[i].length ?? 0,
          },
          skillTrees,
          user,
          place,
          equipment,
          exercises,
          setsPerExercise,
          (user.temporalData ?? []) as TemporalDataType[],
          userExerciseData,
        ),
      );
    }
    dropTrailingPause(setList);
    return setList;
  };

  /**
   * Creates exercise pairs specifically for cardio training types.
   * Returns the appropriate branch selection for different cardio intensities
   * (CARDIO_1 through CARDIO_5) with their interval patterns.
   */
  getCardioExercisePairs = (
    skill: SkillWithLength,
    branches: CardioBranchReference[],
    _exercises: ExerciseType[],
    _pains: string[],
    _isShortTraining: boolean = false,
  ): CardioExercisePair[] => {
    const exercisePairs: CardioExercisePair[] = [];
    switch (skill.skill) {
      case "CARDIO_5":
      case "CARDIO_4":
        // use the one given branch
        return [
          {
            first: branches[0],
          },
        ];
      case "CARDIO_3":
      case "CARDIO_2":
      case "CARDIO_1_SHORT":
      case "CARDIO_1_LAKTAT":
        // run intervalls with cardio5 pause and cardio 4 wu 5min and and fill till end
        break;
      default:
        break;
    }
    return exercisePairs;
  };

  getExercisePairs = (
    skill: string,
    branches: BranchExerciseReference[],
    exercises: ExerciseType[],
    pains: string[],
    thisDayPrevs: string[],
    isShortTraining: boolean = false,
  ): ExercisePair[] => {
    if (TrainingGenerator.DEBUG) {
      console.log("Get exercise pairs for skill", skill);
      console.log("with branches", branches);
      console.log("and pains", pains);
    }

    if (!branches || branches.length === 0) {
      if (TrainingGenerator.DEBUG) {
        console.error("NO BRANCHES LEFT FOR", skill);
      }
      return [];
    }

    const isSuperset = this.isSuperset(skill, isShortTraining);
    let exercisePairs: ExercisePair[] = [];
    let bigMuscleExercises: BranchExerciseReference[] = [];
    let smallMuscleExercises: BranchExerciseReference[] = [];
    // sort branches into big and small muscle branches
    for (let b = 0; b < branches.length; b++) {
      if (isBigMuscleExercise(branches[b])) {
        bigMuscleExercises.push(branches[b]);
      } else {
        smallMuscleExercises.push(branches[b]);
      }
    }

    // if set use only pain side in prevention
    let prevSides: string[] = [];
    let regionPains: string[] = [];
    let prevRegions: string[] = [];
    if (skill.indexOf("PREV") > -1) {
      prevRegions = getRegionsForPreventionSkills([skill]);
      //filter for pains matching given skill
      regionPains = pains.filter((pain) => {
        for (let reg = 0; reg < prevRegions.length; reg++) {
          if (pain.indexOf(prevRegions[reg]) > -1) return true;
        }
        return false;
      });
    }

    if (regionPains.length > 0) {
      for (let pain = 0; pain < regionPains.length; pain++) {
        if (
          regionPains[pain].indexOf("LEFT") > -1 &&
          prevSides.indexOf("LEFT") === -1
        )
          prevSides.push("LEFT");
        if (
          regionPains[pain].indexOf("RIGHT") > -1 &&
          prevSides.indexOf("RIGHT") === -1
        )
          prevSides.push("RIGHT");
        if (
          regionPains[pain].indexOf("LEFT") === -1 &&
          regionPains[pain].indexOf("RIGHT") === -1 &&
          prevSides.indexOf("BOTH") === -1
        )
          prevSides.push("BOTH");
      }

      if (TrainingGenerator.DEBUG) {
        console.log("find exercises for prev regions", prevRegions);
        console.log("prev sides", prevSides);
      }
    }

    // if found use only side depending pains
    if (prevSides.length > 0) {
      // filter side big
      bigMuscleExercises = filterExercisesBySides(
        bigMuscleExercises,
        exercises,
        prevSides,
      ) as BranchExerciseReference[];
      // filter side small
      smallMuscleExercises = filterExercisesBySides(
        smallMuscleExercises,
        exercises,
        prevSides,
      ) as BranchExerciseReference[];

      // build exercise pairs
      while (bigMuscleExercises.length > 0) {
        const first = bigMuscleExercises.pop();
        if (!first) continue;
        const pair: ExercisePair = { first };
        if (bigMuscleExercises.length > 0) {
          pair.second = bigMuscleExercises.pop();
        } else if (smallMuscleExercises.length > 0) {
          pair.second = smallMuscleExercises.pop();
        }
        exercisePairs.push(pair);
      }
      while (smallMuscleExercises.length > 0) {
        const first = smallMuscleExercises.pop();
        if (!first) continue;
        const pair: ExercisePair = { first };
        if (smallMuscleExercises.length > 0) {
          pair.second = smallMuscleExercises.pop();
        }
        exercisePairs.push(pair);
      }
      return exercisePairs;
    }
    // if no side depending pains use default pair building
    if (TrainingGenerator.DEBUG && skill.indexOf("PREV") > -1) {
      console.log("Use default exercise pairing for PREV", skill);
    }

    // big muscle exercises lead first; a lead missing from the catalog is
    // dropped only in the big group, as before
    const leadGroups = [
      { leads: bigMuscleExercises, requireCatalogEntry: true },
      { leads: smallMuscleExercises, requireCatalogEntry: false },
    ];
    for (const { leads, requireCatalogEntry } of leadGroups) {
      while (leads.length > 0) {
        const first = leads.pop();

        // safety check here because sometimes exerciseId is not set ?!?
        if (
          !first ||
          typeof first.exerciseId === "undefined" ||
          first.exerciseId === null
        )
          continue;

        const pair: ExercisePair = { first };
        const exercise = exercises.find(
          (entry) => entry.id === first.exerciseId,
        );
        if (!exercise && requireCatalogEntry) {
          Logger.logEvent("exercise_data_in_pair_not_found", first);
          continue;
        }
        const sides = getTagValues(first.branchTags, TagGroups.SIDE);

        if (sides.indexOf("ONE") > -1 && exercise?.otherSideExerciseId) {
          // use other side in superset
          pair.second = {
            branchId: first.branchId,
            branchTags: first.branchTags,
            exerciseId: exercise.otherSideExerciseId,
          };
        } else if (isSuperset) {
          const partner = pickSupersetPartner(
            first,
            [...bigMuscleExercises, ...smallMuscleExercises],
            getOpposingMuscles(
              getTagValues(first.branchTags, TagGroups.MUSCLE),
            ),
          );
          if (partner) {
            const pool = bigMuscleExercises.includes(partner)
              ? bigMuscleExercises
              : smallMuscleExercises;
            pool.splice(pool.indexOf(partner), 1);
            pair.second = partner;
          }
        }
        exercisePairs.push(pair);
      }
    }

    //TODO Equipment Kombinationen Prios beachten
    //TODO Wechsel zwischen Regions in Supersatz möglich
    //TODO siehe Excel-Sheet "Aufbau der Trainingseinheiten 1" Tabelle Nr. 2 bis Ende
    return exercisePairs;
  };

  /**
   * Determines if a skill type should use superset pairing (two exercises alternating).
   * Short training versions have different rules - some skills like BAS become supersets
   * while MAX and cardio skills never use supersets regardless of training length.
   */
  isSuperset = (skill: string, shortTraining: boolean = false): boolean => {
    if (shortTraining) {
      switch (skill) {
        case "CARDIO_1_SHORT":
        case "CARDIO_1_LAKTAT":
        case "CARDIO_2":
        case "CARDIO_3":
        case "CARDIO_4":
        case "CARDIO_5":
        case "GKSKG":
        case "SAS":
        case "GKS":
        case "WU":
        case "CD":
        case "MOB":
        case "BR":
        case "MAX":
        case "MAX_KRAFT":
        case "WUSPEZIAL":
          return false;
        case "BAS":
        case "PREV":
        case "PREVSHOULDER":
        case "PREVKNEE":
        case "PREVWRIST":
        case "PREVANKLE":
        case "PREVSPINE":
        case "SA":
        case "SAKG":
        case "SK":
        case "SKKG":
        case "SWR1":
        case "SWR2":
        case "SWR1KG":
        case "SWR2KG":
        case "STABILITY":
        default:
          return true;
      }
    }
    switch (skill) {
      case "CARDIO_1_SHORT":
      case "CARDIO_1_LAKTAT":
      case "CARDIO_2":
      case "CARDIO_3":
      case "CARDIO_4":
      case "CARDIO_5":
      case "GKSKG":
      case "SAS":
      case "GKS":
      case "MAX":
      case "MAX_KRAFT":
        return false;
      case "WU":
      case "CD":
      case "MOB":
      case "BR":
      case "BAS":
      case "PREV":
      case "PREVSHOULDER":
      case "PREVKNEE":
      case "PREVWRIST":
      case "PREVANKLE":
      case "PREVSPINE":
      case "SA":
      case "SAKG":
      case "SK":
      case "SKKG":
      case "SWR1":
      case "SWR2":
      case "SWR1KG":
      case "SWR2KG":
      case "STABILITY":
      default:
        return true;
    }
  };

  /**
   * Returns the pause duration (in seconds) between sets within a superset.
   * Different skill types have different recovery needs: cardio intervals use longer pauses,
   * strength skills use moderate pauses, and warm-up/mobility use minimal pauses.
   */
  getInSetPauseBySkill = (skill: string): number => {
    let pause: number;
    switch (skill) {
      case "CARDIO_1_SHORT":
        pause = 50;
        break;
      case "CARDIO_1_LAKTAT":
        pause = 8 * 30;
        break;
      case "CARDIO_2":
      case "CARDIO_3":
      case "SK":
      case "SKKG":
      case "PLYO":
        pause = 60;
        break;
      case "SWR1":
      case "SWR2":
      case "SWR1KG":
      case "SWR2KG":
      case "BAS":
      case "STABILITY":
      case "PREV":
      case "PREVSHOULDER":
      case "PREVKNEE":
      case "PREVWRIST":
      case "PREVANKLE":
      case "PREVSPINE":
        pause = 30;
        break;
      case "GKS":
      case "GKSKG":
        pause = 45;
        break;
      case "SA":
      case "SAKG":
        pause = 75;
        break;
      case "WUSKSA":
        pause = 30;
        break;
      case "WU":
      case "WUSPEZIAL":
      case "CARDIO_4":
      case "CARDIO_5":
      case "CD":
      case "MOB":
      case "BR":
      case "MAX":
      case "MAX_KRAFT":
      default:
        pause = 10;
        break;
    }
    return pause;
  };

  /**
   * Returns the pause duration (in seconds) after completing all sets of an exercise.
   * This is the rest period before moving to the next exercise pair.
   * MAX has the longest recovery (3 min), while warm-up skills use minimal rest.
   */
  getAfterSetPauseBySkill = (skill: string): number => {
    let pause: number;
    switch (skill) {
      case "CARDIO_1_SHORT":
        pause = 50;
        break;
      case "CARDIO_1_LAKTAT":
        pause = 8 * 30;
        break;
      case "CARDIO_2":
      case "CARDIO_3":
      case "SWR1":
      case "SWR2":
      case "SWR1KG":
      case "SWR2KG":
      case "BAS":
      case "STABILITY":
      case "PREV":
      case "PREVSHOULDER":
      case "PREVKNEE":
      case "PREVWRIST":
      case "PREVANKLE":
      case "PREVSPINE":
        pause = 60;
        break;
      case "GKS":
      case "GKSKG":
      case "SK":
      case "SKKG":
      case "PLYO":
        pause = 60;
        break;
      case "SA":
      case "SAKG":
        pause = 75;
        break;
      case "MAX":
      case "MAX_KRAFT":
        pause = 3 * 60;
        break;
      case "WUSKSA":
      case "WU":
        pause = 30;
        break;
      case "WUSPEZIAL":
      case "CARDIO_4":
      case "CARDIO_5":
      case "CD":
      case "MOB":
      case "BR":
      default:
        pause = 10;
        break;
    }
    return pause;
  };

  /**
   * Returns the rest (in seconds) between the sets of an exercise without a
   * superset partner.
   */
  getSingleExerciseRestBySkill = (skill: string): number =>
    SINGLE_EXERCISE_REST_BY_SKILL[skill] ?? 10;

  /**
   * Returns the fixed rest (in seconds) closing an exercise block in a focus
   * workout, or undefined when the focus workout uses the skill's after-set pause.
   */
  getFocusAfterSetPause = (skill: string): number | undefined =>
    FOCUS_AFTER_SET_PAUSE_BY_SKILL[skill];

  /**
   * Returns the default number of repetitions for a skill type.
   * Cardio skills use 3 reps (intervals), while most strength and
   * mobility skills default to 8 reps per set.
   */
  getRepetitionDefaultBySkill = (skillName: string): number => {
    let repetitions: number;
    switch (skillName) {
      case "CARDIO_1_SHORT":
      case "CARDIO_1_LAKTAT":
      case "CARDIO_2":
      case "CARDIO_3":
      case "CARDIO_4":
      case "CARDIO_5":
        repetitions = 3;
        break;
      case "WU":
      case "CD":
      case "MOB":
      case "BR":
      case "BAS":
      case "GKS":
      case "GKSKG":
      case "MAX":
      case "MAX_KRAFT":
      case "PREV":
      case "PREVSHOULDER":
      case "PREVKNEE":
      case "PREVWRIST":
      case "PREVANKLE":
      case "PREVSPINE":
      case "SA":
      case "SAKG":
      case "SK":
      case "SKKG":
      case "SWR1":
      case "SWR2":
      case "SWR1KG":
      case "SWR2KG":
      case "STABILITY":
      default:
        repetitions = 8;
        break;
    }
    return repetitions;
  };

  /**
   * Returns the default exercise duration (in seconds) for a skill type.
   * Cardio skills have varying durations based on intensity level,
   * while most other skills default to 30 seconds per exercise.
   */
  getDurationDefaultBySkill = (skillName: string): number => {
    let duration: number;
    switch (skillName) {
      case "CARDIO_1_SHORT":
        duration = 10;
        break;
      case "CARDIO_1_LAKTAT":
        duration = 30;
        break;
      case "CARDIO_2":
        duration = 60;
        break;
      case "CARDIO_3":
        duration = 120;
        break;
      case "CARDIO_4":
        duration = 30 * 60;
        break;
      case "CARDIO_5":
        duration = 10 * 60;
        break;
      case "WU":
      case "CD":
      case "MOB":
      case "BR":
      case "BAS":
      case "GKS":
      case "GKSKG":
      case "MAX":
      case "MAX_KRAFT":
      case "PREV":
      case "PREVSHOULDER":
      case "PREVKNEE":
      case "PREVWRIST":
      case "PREVANKLE":
      case "PREVSPINE":
      case "SA":
      case "SAKG":
      case "SK":
      case "SKKG":
      case "SWR1":
      case "SWR2":
      case "SWR1KG":
      case "SWR2KG":
      case "STABILITY":
      default:
        duration = 30;
        break;
    }
    return duration;
  };

  /**
   * Determines the starting values (weight, reps, duration, height) for an exercise.
   * Priority order: user's previous exercise data > exercise-specific defaults >
   * skill-based defaults. Applies difficulty adjustments based on user feedback.
   */
  getExerciseStartValues = (
    skillName: string,
    skill: BranchExerciseReference,
    user: UserType,
    exercise: ExerciseType,
    userExerciseData: Record<string, UserExerciseDataType | undefined> | null,
    isShortTraining = false,
  ): ExerciseStartValues => {
    if (isShortTraining) {
      return {
        tags: skill.branchTags,
        exerciseId: skill.exerciseId,
        branchId: skill.branchId,
        duration: 60,
        height: undefined,
        repetition: undefined,
        weight: undefined,
        weightType: "weightAbsolute",
      };
    }

    // use child values or gender otherwise
    const userGender: GenderTag =
      ageGroupFor(getUserBirthday(user)) === WorkoutConstants.AGE_GROUPS.CHILD
        ? "k"
        : getUserGender(user) === "MALE"
          ? "m"
          : "w";
    const userLevel = getUserLevel(user).toLowerCase();

    // Init result
    const data: ExerciseStartValues = {
      tags: skill.branchTags,
      exerciseId: skill.exerciseId,
      branchId: skill.branchId,
      duration:
        exercise && exercise.isAdvanceByDuration
          ? this.getDurationDefaultBySkill(skillName)
          : undefined,
      height: undefined,
      repetition:
        exercise && exercise.isAdvanceByReps
          ? this.getRepetitionDefaultBySkill(skillName)
          : undefined,
      weight: undefined,
      weightType: "weightAbsolute",
    };

    const userExercise = userExerciseData
      ? (userExerciseData[skill.exerciseId] ?? null)
      : null;

    // from data/generator/TestIntensity
    let intensity: IntensityData | null = getIntensityBySkill(
      skillName as SkillCode,
      exercise,
    );

    let exerciseValues = this.getExerciseValues(
      userExercise,
      exercise,
      intensity,
      userGender,
      userLevel,
      user.workoutData?.maxValues ?? DEFAULT_MAX_VALUES,
    );
    let isNewDifficultySet = false;
    let difficultyFeedback: DifficultyFeedbackType | null = null;
    if (userExercise) {
      if (userExercise.feedback?.difficulty) {
        isNewDifficultySet = true;
      }
    }

    if (
      WorkoutConstants.NO_INCREASE_SKILL_TYPE.indexOf(skillName) === -1 &&
      userExercise &&
      isNewDifficultySet
    ) {
      if (userExercise.feedback?.difficulty) {
        difficultyFeedback = userExercise.feedback
          .difficulty as DifficultyFeedbackType;
      }
      if (difficultyFeedback) {
        // adjustment is necessary
        exerciseValues = this.adjustExerciseValues(
          exerciseValues,
          userExercise,
          exercise,
          intensity,
          userGender,
          userLevel,
          difficultyFeedback,
          user.workoutData?.maxValues ?? DEFAULT_MAX_VALUES,
        );
      }
    }
    if (exerciseValues.duration) data.duration = exerciseValues.duration;
    if (exerciseValues.height) data.height = exerciseValues.height;
    if (exerciseValues.repetition) data.repetition = exerciseValues.repetition;
    if (exerciseValues.weight) data.weight = exerciseValues.weight;
    if (
      exerciseValues.weightType === "weightAbsolute" ||
      exerciseValues.weightType === "weightFMax"
    ) {
      data.weightType = exerciseValues.weightType;
    }

    return data;
  };

  /**
   * Checks if an object is undefined or an empty object ({}).
   * Used for validation before processing exercise or user data.
   */
  isEmptyOrUndefined = (obj: object | null | undefined): boolean => {
    if (typeof obj === "undefined" || obj === null) {
      return true;
    } else if (Object.keys(obj).length === 0 && obj.constructor === Object) {
      return true;
    }
    return false;
  };

  /**
   * Generates the exercise list for a max strength test workout.
   * Includes warm-up exercises followed by test exercises with progressively
   * increasing weights (40%, 60%, 85%, 100% of calculated test weight).
   */
  getTestSetList = (
    user: UserType,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    userExerciseData: {
      exerciseData: Record<string, UserExerciseDataType | undefined>;
      branchData: Record<string, UserExerciseBranchDataType | undefined>;
    },
  ): GeneratedSetListEntry[] => {
    const workoutData = requireWorkoutData(user);
    const gender = getUserGender(user);
    const userLevelTags = getUserTagValues(workoutData.tags, TagGroups.LEVEL);
    const userLevel = userLevelTags[0] || WorkoutConstants.LEVELS.BEGINNER;
    // 5 min warm up to start
    let wuBranches = getSkillTree(skillTrees, "WU", [], true);
    let wuRegions = TEST_WORKOUTS_WU_REGION;
    const allBranchIds = Object.keys(wuBranches);
    let usedBranches: string[] = [];
    let wuSetList: GeneratedSetListEntry[] = [];
    wuRegions.forEach((region) => {
      for (
        let i = 0;
        i < region.count && usedBranches.length < allBranchIds.length;
        i++
      ) {
        let unusedBranches = allBranchIds.filter((branchId) => {
          return usedBranches.indexOf(branchId) === -1;
        });

        let possibleBranches = unusedBranches.filter((branchId) => {
          if (region.tags.length === 0) return true;
          let branchRegionTags = getTagValues(
            wuBranches[branchId].tags,
            TagGroups.REGION,
          );
          // has region tag and is in region
          return (
            branchRegionTags.length > 0 &&
            region.tags.some(
              (regionTag) => branchRegionTags.indexOf(regionTag) > -1,
            )
          );
        });

        if (possibleBranches.length === 0) {
          // take any if none matches region
          possibleBranches = unusedBranches;
        }

        let selectedBranchId =
          possibleBranches[Math.floor(Math.random() * possibleBranches.length)];
        let userLevelExercise = getUserExerciseFromBranch(
          wuBranches[selectedBranchId],
          userLevel,
          exercises,
          userExerciseData.branchData[selectedBranchId] ?? null,
        );
        usedBranches.push(selectedBranchId);
        if (userLevelExercise) {
          const entry: GeneratedSetListEntry = {
            branchId: selectedBranchId,
            exerciseId: userLevelExercise.id,
            set: [1, 1],
            skill: "WU",
          };
          const exerciseById = exercises.find((e) => e.id === entry.exerciseId);
          const branchRef: BranchExerciseReference = {
            branchId: entry.branchId,
            branchTags: [],
            exerciseId: entry.exerciseId,
          };
          const startValue = this.getExerciseStartValues(
            WorkoutConstants.SKILL_TYPES.WU,
            branchRef,
            user,
            exerciseById!,
            userExerciseData.exerciseData,
            true,
          );
          if (startValue.duration) entry.duration = startValue.duration;
          if (startValue.height) entry.height = startValue.height;
          if (startValue.repetition) entry.repetition = startValue.repetition;
          if (startValue.weight) entry.weight = startValue.weight;
          if (startValue.weightType) entry.weightType = startValue.weightType;

          wuSetList.push(entry);
          wuSetList.push({
            branchId: PLACEHOLDER_BRANCH_ID,
            exerciseId: PAUSE_EXERCISE_ID,
            set: [1, 1],
            duration: 10,
            skill: "WU",
          });
        } else {
          i--;
        }
      }
    });
    // make last pause duration 30sec
    wuSetList[wuSetList.length - 1].duration = 30;

    const testWorkout = TEST_WORKOUTS[userLevel as keyof typeof TEST_WORKOUTS];
    if (!testWorkout) {
      throw new Error(`Invalid userLevel for TEST_WORKOUT: ${userLevel}`);
    }

    let sortedExerciseIds: readonly string[] = testWorkout.default;
    const genderKey = gender === "MALE" ? "m" : "w";
    const genderSpecificExercises =
      testWorkout[genderKey as keyof typeof testWorkout];
    if (genderSpecificExercises) {
      // use gender specific if exists
      sortedExerciseIds = genderSpecificExercises as readonly string[];
    }
    const sortedExercises = exercises
      .filter((entry) => {
        return sortedExerciseIds.indexOf(entry.id) > -1;
      })
      .sort((a, b) => {
        if (sortedExerciseIds.indexOf(a.id) > sortedExerciseIds.indexOf(b.id))
          return -1;
        return 1;
      });

    let setList: GeneratedSetListEntry[] = wuSetList;

    const skill = "TEST";

    // build single lists to concat afterwards
    const singleExerciseLists = sortedExerciseIds.reduce<
      Record<string, GeneratedSetListEntry[]>
    >((acc, entry) => {
      acc[entry] = [];
      return acc;
    }, {});

    // Warmup + test set protocol (Tabelle 2)
    const setProtocol = [
      { percentage: 0.4, repetitions: 6, pauseSeconds: 60 },
      { percentage: 0.6, repetitions: 4, pauseSeconds: 60 },
      { percentage: 0.85, repetitions: 2, pauseSeconds: 120 },
      { percentage: 1, repetitions: -1, pauseSeconds: 180 },
    ];
    const totalSets = setProtocol.length;

    // build 3 warm-up sets + one test set
    for (let setIndex = 0; setIndex < setProtocol.length; setIndex++) {
      const { percentage, repetitions, pauseSeconds } = setProtocol[setIndex];
      const setNumber = setIndex + 1;

      for (let i = 0; i < sortedExercises.length; i++) {
        const entry = this.getTestSetExercise(
          gender,
          userLevel,
          sortedExercises[i],
          workoutData.maxValues ?? DEFAULT_MAX_VALUES,
          TEST_WORKOUTS_START_VALUES,
          percentage,
          repetitions,
          setNumber,
          skill as SkillCode,
          i,
        );

        // Update set tuple to reflect 4 total sets
        entry.set = [setNumber, totalSets];

        singleExerciseLists[sortedExercises[i].id].push(entry);

        const actualPause = pauseSeconds;

        singleExerciseLists[sortedExercises[i].id].push({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: PAUSE_EXERCISE_ID,
          set: [setNumber, totalSets],
          duration: actualPause,
          skill: skill as SkillCode,
        });
      }
    }
    sortedExerciseIds.forEach((entry) => {
      setList = setList.concat(singleExerciseLists[entry]);
    });

    return setList;
  };

  /**
   * Creates a single test set entry with calculated weight based on percentage.
   * Uses either the user's previous max value or default start values,
   * adjusting weight by the specified percentage for warm-up or test sets.
   */
  getTestSetExercise = (
    userGender: "MALE" | "FEMALE",
    userLevel: string,
    sortedExercise: ExerciseType,
    maxValues: MaxValuesType,
    startValues: TestWorkoutsStartValuesType,
    percentage: number,
    repetitions: number,
    set: number,
    skill: SkillCode,
    _num: number,
  ): GeneratedSetListEntry => {
    const gender = userGender === "MALE" ? "m" : "w";
    let level: "beginner" | "advanced" | "professional";
    switch (userLevel) {
      case WorkoutConstants.LEVELS.BEGINNER:
        level = "beginner";
        break;
      case WorkoutConstants.LEVELS.ADVANCED:
        level = "advanced";
        break;
      case WorkoutConstants.LEVELS.PROFESSIONAL:
        level = "professional";
        break;
      default:
        if (TrainingGenerator.DEBUG)
          console.log("User level for test not found");
        level = "beginner";
        break;
    }
    const exerciseStartValues = startValues[sortedExercise.id];
    const genderWeights = exerciseStartValues?.[gender];
    let testSetLoad = genderWeights?.[level] ?? 0;
    // use previous max value if set
    const maxValue = getMaxValueForExercise(sortedExercise, maxValues);
    if (maxValue) {
      // Use experience-level-based percentage of last 1RM
      // Beginner: 75%, Advanced: 80%, Professional: 85%
      let maxValuePercentage: number;
      switch (userLevel) {
        case WorkoutConstants.LEVELS.PROFESSIONAL:
          maxValuePercentage = 0.85;
          break;
        case WorkoutConstants.LEVELS.ADVANCED:
          maxValuePercentage = 0.8;
          break;
        case WorkoutConstants.LEVELS.BEGINNER:
        default:
          maxValuePercentage = 0.75;
          break;
      }
      testSetLoad = maxValue * maxValuePercentage;
    }
    // ramp up loads refer to the rounded test set load
    const roundedTestSetLoad = roundWeightValue(testSetLoad, sortedExercise);

    return {
      branchId: PLACEHOLDER_BRANCH_ID,
      exerciseId: sortedExercise.id,
      set: [set, 4] as [number, number],
      weight: roundWeightValue(roundedTestSetLoad * percentage, sortedExercise),
      repetition: repetitions,
      skill: skill,
    };
  };

  /**
   * Retrieves adjustment values for exercise progression based on intensity config.
   * Returns how much to increase/decrease duration, reps, height, or weight
   * based on user feedback (SUCCEEDED, TOO_EASY, TOO_HARD) and user level.
   */
  getAdjustmentByUserData = (
    intensity: IntensityData | null,
    userGender: GenderTag,
    userLevel: string,
  ): AdjustmentConfig => {
    // init
    let adjustment: AdjustmentConfig = {
      duration: {
        SUCCEEDED: 5,
        TOO_EASY: 10,
        TOO_HARD: -5,
      },
      height: {
        SUCCEEDED: 5,
        TOO_EASY: 10,
        TOO_HARD: -5,
      },
      repetition: {
        SUCCEEDED: 2,
        TOO_EASY: 4,
        TOO_HARD: -2,
      },
      weightFMax: {
        SUCCEEDED: 2.5,
        TOO_EASY: 5,
        TOO_HARD: -2.5,
      },
      weightAbsolute: {
        SUCCEEDED: 1,
        TOO_EASY: 2,
        TOO_HARD: -1,
      },
    };
    if (intensity) {
      const adjust: {
        [skill: string]: {
          [gender: string]: {
            [level: string]: { [feedback: string]: number };
          };
        };
      } = intensity.adjustment as {
        [skill: string]: {
          [gender: string]: {
            [level: string]: { [feedback: string]: number };
          };
        };
      };
      const skillAdjustments: Partial<AdjustmentConfig> = {};

      // Helper to get adjustment value with proper fallback
      const getAdjustmentValue = (
        adjustObj:
          | {
              [gender: string]: {
                [level: string]: { [feedback: string]: number };
              };
            }
          | undefined,
      ): FeedbackAdjustment | undefined => {
        if (!adjustObj) return undefined;
        // by gender and level first
        if (adjustObj[userGender]?.[userLevel]) {
          return adjustObj[userGender][userLevel] as FeedbackAdjustment;
        }
        // default by level
        if (adjustObj.default?.[userLevel]) {
          return adjustObj.default[userLevel] as FeedbackAdjustment;
        }
        // default
        if (adjustObj.default?.default) {
          return adjustObj.default.default as FeedbackAdjustment;
        }
        return undefined;
      };

      // Duration
      skillAdjustments.duration = getAdjustmentValue(adjust.duration);
      // Height
      skillAdjustments.height = getAdjustmentValue(adjust.height);
      // Repetition
      skillAdjustments.repetition = getAdjustmentValue(adjust.repetition);
      // Weight absolute
      skillAdjustments.weightAbsolute = getAdjustmentValue(
        adjust.weightAbsolute,
      );
      // Weight F max
      skillAdjustments.weightFMax = getAdjustmentValue(adjust.weightFMax);

      // finally set adjustments
      adjustment = skillAdjustments as AdjustmentConfig;
    }
    return adjustment;
  };

  /**
   * Applies one feedback event to the exercise values. Weighted exercises
   * change only the weight on TOO_HARD and only reps/duration otherwise;
   * reps/duration stay within the resolved start and target values.
   */
  adjustExerciseValues = (
    dataInput: ExerciseValuesData,
    userExercise: UserExerciseDataType | null,
    exercise: ExerciseType,
    intensity: IntensityData | null,
    userGender: GenderTag,
    userLevel: string,
    difficultyFeedback: DifficultyFeedbackType,
    maxValues: MaxValuesType = DEFAULT_MAX_VALUES,
  ): ExerciseValuesData => {
    const boundaries = { intensity, exercise, userLevel, userGender };
    // Height stays fixed: automatic height progression is not implemented.
    // Positive feedback at the performed rep/duration target raises the weight
    // in useExerciseCompletion and clears the feedback, so only TOO_HARD
    // changes the weight here.
    if (
      difficultyFeedback === "TOO_HARD" &&
      hasWeightValue(exercise, dataInput)
    ) {
      return {
        ...dataInput,
        weight: stepWeightDown(dataInput, boundaries, maxValues),
      };
    }
    return stepRepsAndDuration(
      dataInput,
      this.getAdjustmentByUserData(intensity, userGender, userLevel),
      difficultyFeedback,
      boundaries,
    );
  };

  /**
   * Retrieves current exercise values from multiple sources.
   * Priority: user's saved data > exercise-specific config > skill intensity defaults.
   * Handles weight type detection (absolute vs F-max percentage).
   */
  getExerciseValues = (
    userExercise: UserExerciseDataType | null,
    exercise: ExerciseType,
    intensity: IntensityData | null,
    userGender: GenderTag,
    userLevel: string,
    maxValues: MaxValuesType,
  ): ExerciseValuesData => {
    const EQ_TYPES = getTagValues(exercise.tags, TagGroups.EQ_TYPE);
    const data: ExerciseValuesData = {
      weightType: "weightAbsolute",
    };

    // default by skill
    if (intensity) {
      // use default skill data for new exercise
      const startValue = intensity.startValue as unknown as {
        [skill: string]:
          | { [gender: string]: { [level: string]: number } | undefined }
          | undefined;
      };
      // Same precedence as getExerciseStartValue: gender and level first.
      const intensityStart = (valueName: string) => {
        const values = startValue[valueName];
        const value =
          values?.[userGender]?.[userLevel] ||
          values?.[userGender]?.default ||
          values?.default?.[userLevel] ||
          values?.default?.default;
        return value ? +value : undefined;
      };

      if (exercise.isAdvanceByDuration) {
        data.duration = intensityStart("duration");
      }
      if (exercise.isAdvanceByReps) {
        data.repetition = intensityStart("repetition");
      }
      if (EQ_TYPES.indexOf("WEIGHTS") > -1) {
        data.weight = intensityStart("weight");
        if (intensity.startValue.weight?.type?.type === "weightFMax") {
          data.weightType = "weightFMax";
        }
      }
      if (
        exercise.isJump &&
        hasJumpBox(getTagValues(exercise.tags, TagGroups.EQUIPMENT))
      ) {
        data.height = intensityStart("height");
      }
    }

    // default by exercise
    if (exercise && exercise.values) {
      // look for specifics in exercise
      let startValues: {
        repetition?: number;
        duration?: number;
        weight?: number;
        height?: number;
      } = getStartValues(
        exercise.values as unknown as ExerciseValuesConfig,
        userGender,
        userLevel,
      );

      const exerciseWeightType = exercise.values.weight?.startValue?.type?.type;
      const intensityWeightType = intensity?.startValue?.weight?.type?.type;
      let isWeightFMaxExercise =
        exerciseWeightType === "weightFMax" ||
        (!exerciseWeightType && intensityWeightType === "weightFMax");
      const usesAuthoredRange = !intensity?.overridesExerciseRepsAndDuration;

      if (
        usesAuthoredRange &&
        exercise.isAdvanceByReps &&
        startValues.repetition
      ) {
        data.repetition = startValues.repetition; // not ternary could overwrite
      }
      if (
        usesAuthoredRange &&
        exercise.isAdvanceByDuration &&
        startValues.duration
      ) {
        data.duration = startValues.duration; // not ternary could overwrite
      }
      // check for EQ_TYPE_ tag
      // TODO adjust filter for med balls o.ä.
      if (EQ_TYPES.indexOf("WEIGHTS") > -1 && startValues.weight) {
        if (isWeightFMaxExercise) {
          data.weightType = "weightFMax";
        } else {
          data.weightType = "weightAbsolute";
        }
        data.weight = startValues.weight;
      }
      // check for jump
      let equip = getTagValues(exercise.tags, TagGroups.EQUIPMENT);
      if (exercise.isJump && startValues.height && hasJumpBox(equip)) {
        data.height = startValues.height;
      }
    }

    // values by user exercise data
    if (userExercise) {
      // use userExerciseData
      if (exercise.isAdvanceByDuration && userExercise.duration) {
        data.duration = userExercise.duration;
      }
      if (exercise.isAdvanceByReps && userExercise.repetition) {
        data.repetition = userExercise.repetition;
      }
      if (exercise.isJump && userExercise.height) {
        data.height = userExercise.height;
      }
      if (userExercise.weight) {
        data.weight = userExercise.weight;
      }
      const exerciseWeightType =
        exercise.values?.weight?.startValue?.type?.type;
      const intensityWeightType = intensity?.startValue?.weight?.type?.type;
      if (
        exerciseWeightType === "weightFMax" ||
        (!exerciseWeightType && intensityWeightType === "weightFMax")
      ) {
        data.weightType = "weightFMax";
      } else {
        data.weightType = "weightAbsolute";
      }
    }

    // Stored hypertrophy values may predate the config start and target.
    if (intensity?.overridesExerciseRepsAndDuration) {
      for (const valueName of ["repetition", "duration"] as const) {
        const value = data[valueName];
        if (typeof value === "number") {
          data[valueName] = clampToBoundaries(value, valueName, {
            intensity,
            exercise,
            userLevel,
            userGender,
          });
        }
      }
    }

    if (
      TrainingGenerator.DEBUG &&
      typeof data.repetition !== "number" &&
      typeof data.duration !== "number"
    ) {
      console.log("NO REPETITION OR DURATION");
      console.log("data: ", data);
      console.log("exercise: ", exercise);
      console.log("intensity: ", intensity);
    }
    return data;
  };

  private getMaxStrengthBufferTable = (user: UserType): BufferTable => {
    const ageReps =
      WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[
        ageGroupFor(getUserBirthday(user))
      ];
    return ageReps?.[getUserLevel(user)] ?? {};
  };

  /**
   * Weight percentage and buffer of every max strength working set. Each set
   * follows its own ladder between its starting and maximum weight.
   */
  getMaxTrainingWeights = (
    exercise: ExerciseType,
    user: UserType,
    userExercisesData: Record<string, UserExerciseDataType | undefined> | null,
  ): MaxTrainingWeightsResult => {
    const states = getNextMaxStrengthSetStates(
      this.getMaxStrengthBufferTable(user),
      getUserLevel(user),
      userExercisesData?.[exercise.id],
    );
    return {
      trainingWeights: states.map((state) => state.weightPercentage),
      levels: states.map((state) => state.level),
    };
  };

  /**
   * Repetitions of the warm-up sets followed by those of each working set.
   * Working set entries record the buffer actually used and their weight
   * percentage, so the next session continues each set's own ladder.
   */
  getMaxTrainingReps = (
    user: UserType,
    { trainingWeights, levels }: MaxTrainingWeightsResult,
  ): MaxTrainingRepsEntry[] => {
    const table = this.getMaxStrengthBufferTable(user);
    const workingReps = trainingWeights.map((weightPercentage, i) => ({
      ...getMaxStrengthRepetitions(table, weightPercentage, levels[i]),
      weightPercentage,
    }));
    return [...WorkoutConstants.MAX_KRAFT_REPETITIONS_WARMUP, ...workingReps];
  };
}

TrainingGenerator.DEBUG = false;

interface BoundaryContext {
  intensity: IntensityData | null;
  exercise: ExerciseType;
  userLevel: string;
  userGender: GenderTag;
}

// Keeps reps/duration within the resolved start and target values.
const clampToBoundaries = (
  value: number,
  valueName: "duration" | "repetition",
  { intensity, exercise, userLevel, userGender }: BoundaryContext,
): number => {
  if (!intensity || !isTrainingLevel(userLevel)) return value;
  const start = getExerciseStartValue(
    intensity,
    exercise,
    valueName,
    userLevel,
    userGender,
  );
  const target = getExerciseTargetValue(
    intensity,
    exercise,
    valueName,
    userLevel,
    userGender,
  );
  let clamped = value;
  if (typeof target === "number") clamped = Math.min(clamped, target);
  if (typeof start === "number") clamped = Math.max(clamped, start);
  return clamped;
};

const hasWeightValue = (
  exercise: ExerciseType,
  data: ExerciseValuesData,
): data is ExerciseValuesData & { weight: number } =>
  getTagValues(exercise.tags, TagGroups.EQ_TYPE).includes("WEIGHTS") &&
  typeof data.weight === "number";

// One weight step down, not below the lowest permitted load.
const stepWeightDown = (
  data: ExerciseValuesData & { weight: number },
  { intensity, exercise, userLevel, userGender }: BoundaryContext,
  maxValues: MaxValuesType,
): number => {
  const weightType =
    data.weightType === "weightFMax" ? "weightFMax" : "weightAbsolute";
  return calculateWeightStep(data.weight, "DECREASE", exercise, {
    weightType,
    lowestWeight: intensity
      ? getLowestPermittedWeight(intensity, weightType, exercise, {
          userLevel: isTrainingLevel(userLevel) ? userLevel : undefined,
          genderTag: userGender,
        })
      : undefined,
    maxValue: getMaxValueForExercise(exercise, maxValues),
  });
};

// Reps/duration take one feedback step within their start and target values.
const stepRepsAndDuration = (
  data: ExerciseValuesData,
  adjustment: AdjustmentConfig,
  feedback: DifficultyFeedbackType,
  boundaries: BoundaryContext,
): ExerciseValuesData => {
  const { exercise } = boundaries;
  const advances = {
    duration: exercise.isAdvanceByDuration,
    repetition: exercise.isAdvanceByReps,
  };
  const result = { ...data };
  for (const valueName of ["duration", "repetition"] as const) {
    const value = result[valueName];
    const step = adjustment[valueName];
    if (advances[valueName] && value && step) {
      result[valueName] = clampToBoundaries(
        value + step[feedback],
        valueName,
        boundaries,
      );
    }
  }
  return result;
};

// Cardio blocks end without a pause, so only a trailing pause is removed.
const SINGLE_EXERCISE_REST_BY_SKILL: Record<string, number> = {
  SWR1: 90,
  SWR2: 90,
  SWR1KG: 90,
  SWR2KG: 90,
  GKS: 90,
  GKSKG: 90,
  BAS: 60,
  STABILITY: 60,
  PREV: 60,
  PREVSHOULDER: 60,
  PREVKNEE: 60,
  PREVWRIST: 60,
  PREVANKLE: 60,
  PREVSPINE: 60,
  SK: 180,
  SKKG: 180,
  SA: 180,
  SAKG: 180,
  PLYO: 180,
  WUSKSA: 30,
};

const FOCUS_AFTER_SET_PAUSE_BY_SKILL: Record<string, number> = {
  WU: 10,
  CD: 10,
  MOB: 10,
  BR: 10,
  BAS: 30,
  GKS: 45,
  GKSKG: 45,
};

// Mirrors the skip checks of the default set list builder
const isBuildablePair = (
  pair: ExercisePair,
  exerciseMap: Map<string, ExerciseType>,
): boolean =>
  pair.first.exerciseId !== "-1" &&
  exerciseMap.has(pair.first.exerciseId) &&
  pair.second?.exerciseId !== "-1";

const dropTrailingPause = (setList: GeneratedSetListEntry[]) => {
  const last = setList.at(-1);
  if (last && isPauseExercise(last.exerciseId)) setList.pop();
};

const hasJumpBox = (equipment: string[]) => {
  const { BOX_LOW, BOX_HIGH } = WorkoutConstants.EQUIPMENT;
  return equipment.some((eq) => eq === BOX_LOW || eq === BOX_HIGH);
};

const getOpposingMuscles = (muscles: string[]): string[] => {
  const agonists = [
    ["CHEST"],
    ["QUADRICEPS"],
    ["RECTUS_ABDOMINIS"],
    ["SHOULDER"],
  ];
  const antagonists = [
    ["LATISSIMUS", "NECK", "UPPER_BACK"],
    ["GLUTES"],
    ["LOWER_BACK"],
    ["LATISSIMUS"],
  ];
  const agonistsPrio2 = [
    ["BICEPS"],
    ["WRIST_EXTENSOR"],
    ["SHOULDER_FRONT"],
    ["CALF"],
    ["INNER_THIGH"],
    ["SCAPULAR_STABILIZER_FRONT"],
    ["HIP_EXTERNAL_ROTATOR"],
    ["NECK_FRONT"],
  ];
  const antagonistsPrio2 = [
    ["TRICEPS"],
    ["WRIST_FLEXOR"],
    ["SHOULDER_REAR"],
    ["ANKLE", "SHIN"],
    ["OUTER_THIGH"],
    ["SCAPULAR_STABILIZER_REAR"],
    ["HIP_INTERNAL_ROTATOR"],
    ["NECK_REAR"],
  ];

  const result: string[] = [];

  const addMuscles = (list: string[][], index: number) => {
    if (index > -1) {
      result.push(...list[index]);
      return true;
    }
    return false;
  };

  for (let i = 0; i < muscles.length; i++) {
    let index = agonists.findIndex((group) => group.indexOf(muscles[i]) > -1);
    if (addMuscles(antagonists, index)) continue;

    index = antagonists.findIndex((group) => group.indexOf(muscles[i]) > -1);
    if (addMuscles(agonists, index)) continue;

    index = agonistsPrio2.findIndex((group) => group.indexOf(muscles[i]) > -1);
    if (addMuscles(antagonistsPrio2, index)) continue;

    index = antagonistsPrio2.findIndex(
      (group) => group.indexOf(muscles[i]) > -1,
    );
    addMuscles(agonistsPrio2, index);
  }

  return result;
};

const filterExercisesBySides = (
  exercises: { branchTags: string[]; exerciseId: string }[],
  exerciseData: ExerciseType[],
  prevSides: string[],
) => {
  return exercises.filter((entry, index, arr) => {
    const exercise = exerciseData.filter((ex) => ex.id === entry.exerciseId)[0];
    if (!exercise) {
      return false;
    }
    const sideTags = getTagValues(exercise.tags, TagGroups.SIDE);
    if (sideTags.some((tag) => tag === "BOTH")) {
      return true;
    }
    if (sideTags.some((tag) => prevSides.indexOf(tag) > -1)) {
      return true;
    }
    if (exercise.otherSideExerciseId) {
      const otherSideExercise = exerciseData.filter(
        (ex) => ex.id === exercise.otherSideExerciseId,
      )[0];
      if (!otherSideExercise) {
        return false;
      }
      const otherSideTags = getTagValues(
        otherSideExercise.tags,
        TagGroups.SIDE,
      );
      if (otherSideTags.some((tag) => prevSides.indexOf(tag) > -1)) {
        arr[index].exerciseId = otherSideExercise.id;
        return true;
      }
    }
    return false;
  });
};

/**
 * Filters exercise branches by user level, keeping only branches that have
 * exercises available at the user's current level. Returns branches to keep
 * and region tags of branches that need replacement.
 */
const filterByUserLevel = (
  branches: Record<string, SkillBranchData>,
  user: UserType,
  exercises: ExerciseType[],
  userBranchData: Record<string, UserExerciseBranchDataType | undefined> | null,
): FilterResult => {
  if (!user || !user.workoutData) {
    return { keep: branches, replace: [] };
  }
  const userLevelTags = getUserTagValues(
    user.workoutData.tags,
    TagGroups.LEVEL,
  );
  const userLevel = userLevelTags[0] || WorkoutConstants.LEVELS.BEGINNER;
  const keep: Record<string, SkillBranchData> = {};
  let replace: string[] = [];

  for (const id in branches) {
    if (!Object.prototype.hasOwnProperty.call(branches, id)) continue;
    const branchData = branches[id];
    const branchTags = branchData.tags ?? [];
    const levelSource = branchData.exercises
      ? branchData.exercises
      : branchData.levels;
    const exercise = getUserExerciseFromBranch(
      {
        tags: branchTags,
        levels: levelSource as Record<number, { exerciseId: string }>,
      },
      userLevel,
      exercises,
      userBranchData?.[id] ?? null,
    );
    if (exercise === null) {
      // one replacement request per removed branch
      const exerciseRegions = getTagValues(branchTags, TagGroups.REGION);
      replace = replace.concat(exerciseRegions.slice(0, 1));
    } else {
      keep[id] = branchData;
    }
  }

  return { keep, replace };
};

/**
 * Retrieves a numeric value from a gender/level lookup structure.
 * Falls back through: gender+level -> gender+default -> default+level -> default+default.
 */
const getValueByGenderAndLevel = (
  data: GenderLevelValueMap,
  gender: string,
  level: string,
): number | undefined => {
  let result: number | undefined;
  if (data) {
    const defaultData = data.default;
    if (defaultData && typeof defaultData === "object") {
      if (defaultData.default !== undefined) result = +defaultData.default;
      if (defaultData[level] !== undefined) result = +defaultData[level];
    }
    const genderData = data[gender];
    if (genderData && typeof genderData === "object") {
      if (genderData.default !== undefined) result = +genderData.default;
      if (genderData[level] !== undefined) result = +genderData[level];
    }
  }
  return result;
};

/**
 * Extracts starting values for all value types (repetition, duration, weight, height)
 * from an exercise's values configuration, looking up by gender and level.
 */
const getStartValues = (
  data: ExerciseValuesConfig,
  gender: string,
  level: string,
): StartValuesResult => {
  const result: StartValuesResult = {};
  WorkoutConstants.VALUE_TYPE_NAMES.forEach((valueName) => {
    if (data[valueName] && data[valueName].startValue) {
      const value = getValueByGenderAndLevel(
        data[valueName].startValue,
        gender,
        level,
      );
      if (value !== undefined) {
        (result as Record<string, number>)[valueName] = value;
      }
    }
  });
  return result;
};

/**
 * Hypertrophy trees mix weighted and bodyweight exercises, so a known exercise
 * picks the config by its EQ_TYPE instead of by the skill.
 */
const getHypertrophyIntensity = (
  skill: SkillCode,
  exercise?: Pick<ExerciseType, "tags">,
) => {
  if (!exercise) {
    // use SWR2 till exercises can be distinguished between SWR1 and SWR2
    return skill === "SWR2KG" ? IntensitySWR_2_KG : IntensitySWR_2;
  }
  return getTagValues(exercise.tags, TagGroups.EQ_TYPE).includes("WEIGHTS")
    ? IntensitySWR_2
    : IntensitySWR_2_KG;
};

export const getIntensityBySkill = (
  skill: SkillCode,
  exercise?: Pick<ExerciseType, "tags">,
) => {
  switch (skill) {
    case "SWR1":
    case "SWR1KG":
    case "SWR2":
    case "SWR2KG":
      return getHypertrophyIntensity(skill, exercise);
    case "CARDIO_3":
      return IntensityCARDIO_3;
    case "CARDIO_2":
      return IntensityCARDIO_2;
    case "CARDIO_1_LAKTAT":
      return IntensityCARDIO_1_LAKTAT;
    case "CARDIO_1_SHORT":
      return IntensityCARDIO_1_SHORT;
    case "BAS":
      return IntensityBAS;
    case "GKS":
      return exercise &&
        !getTagValues(exercise.tags, TagGroups.EQ_TYPE).includes("WEIGHTS")
        ? IntensityGKS_KG
        : IntensityGKS;
    case "PREV":
    case "PREVANKLE":
    case "PREVKNEE":
    case "PREVSHOULDER":
    case "PREVSPINE":
    case "PREVWRIST":
      return IntensityPREV;
    case "SA":
      return IntensitySA;
    case "SAKG":
      return IntensitySA_KG;
    case "SK":
      return IntensitySK;
    case "SKKG":
      return IntensitySK_KG;
    case "MAX":
    case "MAX_KRAFT":
      return IntensityDEFAULT;
    default:
      return IntensityDEFAULT_KG;
  }
};
