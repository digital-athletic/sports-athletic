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
import type {
  SkillType,
  TrainingType,
} from "@/features/training/models/Training";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { UserTrainingType } from "@/features/training/models/UserTraining";
import { getSectionForDate } from "@/features/training/trainingUtils";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
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
} from "@/features/training/utils/skillTreeUtils";
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
  type GeneratorSkillTypeFromSchema,
  type MaxTrainingRepsEntry,
  type MaxTrainingWeightsResult,
  type SkillBranchData,
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
import { IntensityGKS } from "../../../../assets/data/generator/intensity/GKS";
import { IntensityPREV } from "../../../../assets/data/generator/intensity/PREV";
import { IntensitySA } from "../../../../assets/data/generator/intensity/SA";
import { IntensitySA_KG } from "../../../../assets/data/generator/intensity/SAKG";
import { IntensitySK } from "../../../../assets/data/generator/intensity/SK";
import { IntensitySK_KG } from "../../../../assets/data/generator/intensity/SKKG";
import { IntensitySWR_2 } from "../../../../assets/data/generator/intensity/SWR2";
import { IntensitySWR_2_KG } from "../../../../assets/data/generator/intensity/SWR2KG";

// Pause
import PauseSUPERSETS from "../../../../assets/data/generator/pause/SUPERSETS";

// Test workouts
import TEST_WORKOUTS from "../../../../assets/data/generator/TEST_WORKOUTS";
import TEST_WORKOUTS_START_VALUES from "../../../../assets/data/generator/TEST_WORKOUTS_START_VALUES";
import TEST_WORKOUTS_WU_REGION from "../../../../assets/data/generator/TEST_WORKOUTS_WU_REGION";
import { PAUSE_EXERCISE_ID, PLACEHOLDER_BRANCH_ID } from "../models/IdTypes";
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
  getMaxValueForExercise,
  getRoundedResultForValueAndStep,
  getUserLevel,
  roundWeightValue,
} from "../utils/workoutUtils";

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
   * Filters available branches by pain, soreness, equipment, age, and gender,
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
    const painData: string[] = user.workoutData?.tags
      ? getBlocksFromPains(
          getUserTagValues(user.workoutData.tags, TagGroups.PAIN),
        )
      : [];

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

    const sorenessFiltered = filterBySoreness(
      painFiltered,
      temporalData.length > 0 ? temporalData : null,
      type,
      true,
    ).keep;

    if (TrainingGenerator.DEBUG) {
      console.log("soreness filtered", sorenessFiltered);
    }

    if (Object.keys(sorenessFiltered).length === 0) {
      throw {
        type: "NO_EXERCISES",
        subtype: "SORENESS",
        params:
          getAreasFor(getTemporalTags(user)).map((a) => a.toUpperCase()) || [],
      };
    }

    // equipment
    const equipmentFilterResult = filterByEquipment(
      sorenessFiltered,
      equipment,
    );
    const equipmentFiltered = equipmentFilterResult.keep;

    if (TrainingGenerator.DEBUG) {
      console.log("equipment filtered", equipmentFiltered);
    }

    // age
    const ageGroup = getUserBirthday(user)
      ? ageGroupFor(getUserBirthday(user))
      : WorkoutConstants.AGE_GROUPS.CHILD;
    let ageFiltered = filterByAge(equipmentFiltered, ageGroup).keep;

    if (TrainingGenerator.DEBUG) {
      console.log("age filtered", ageFiltered);
    }

    // gender
    const userGender = getUserGender(user) ?? "FEMALE";
    const genderFiltered = filterByGender(ageFiltered, userGender).keep;

    if (TrainingGenerator.DEBUG) {
      console.log("gender filtered", genderFiltered);
    }

    if (Object.keys(genderFiltered).length === 0) {
      throw {
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: equipmentFilterResult.missingEquipment || [],
      };
    }

    // Build exercise list
    let branches: Record<string, BranchExerciseReference[]> = { main: [] };
    let branchesIds: string[] = [];

    const getBranchAndId = (
      branches: SkillTreeType,
      usedBranchIds: string[],
    ): BranchSelectionResult | null => {
      const branchKeys = Object.keys(branches).filter(
        (key) => usedBranchIds.indexOf(key) === -1,
      );
      if (branchKeys.length === 0) return null;
      const id = branchKeys[Math.floor(Math.random() * branchKeys.length)];
      const levelKeys = Object.keys(branches[id].levels).map(Number);
      const level = Math.min(...levelKeys);
      const branch = {
        branchId: id,
        branchTags: branches[id].tags,
        exerciseId: branches[id].levels[level].exerciseId,
      };
      return { branch, branchId: id };
    };

    const getSuperSetPairBranchAndId = (
      branches: SkillTreeType,
      usedBranchIds: string[],
    ): SuperSetBranchSelectionResult | null => {
      const branchKeys = Object.keys(branches).filter(
        (key) => usedBranchIds.indexOf(key) === -1,
      );
      if (branchKeys.length === 0) return null;
      let id = branchKeys[Math.floor(Math.random() * branchKeys.length)];
      const levelKeys = Object.keys(branches[id].levels).map(Number);
      const level = Math.min(...levelKeys);
      const exerciseId = branches[id].levels[level].exerciseId;
      let branch = {
        branchId: id,
        branchTags: branches[id].tags,
        exerciseId: exerciseId,
      };
      let fillUpBranchAndId: BranchSelectionResult | undefined = undefined;
      const replacementBranchesAndIds: BranchSelectionResult[] = [];
      // if found branch gives both sided exercise fill up for super set
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
            } else {
              // used if no second SIDE_BOTH exercise is found
              replacementBranchesAndIds.push(result);
            }
          }
        }
      }
      if (
        fillUpBranchAndId === undefined &&
        replacementBranchesAndIds.length !== 0
      ) {
        // use 1 ONE_SIDE branch in exchange of single BOTH_SIDE branch
        const randomBranchAndId =
          replacementBranchesAndIds[
            Math.floor(Math.random() * replacementBranchesAndIds.length)
          ];
        branch = randomBranchAndId.branch;
        id = randomBranchAndId.branchId;
        fillUpBranchAndId = undefined;
      }
      return {
        branch,
        branchId: id,
        fillUpBranchAndId,
        replacementBranchesAndIds:
          replacementBranchesAndIds.length > 0
            ? replacementBranchesAndIds
            : undefined,
      };
    };

    let duration = 0;
    let setsPerExercise = 2;
    let isShortTraining = false; // does map to following skills, not all short trainings like prev and stability
    if (["WU", "MOB", "BR", "CD"].indexOf(type) > -1) {
      isShortTraining = true;
      // set these short trainings to 10 exercises, 1 set, 60 secs, 10 secs pause
      let numOfExercises = 10;
      setsPerExercise = 1;
      while (branches.main.length < numOfExercises) {
        let result = getBranchAndId(genderFiltered, branchesIds);
        // end if no more branches
        if (result === null) break;
        let side = getTagValues(result.branch.branchTags, TagGroups.SIDE);
        if (side.indexOf("ONE") > -1) {
          // one sided exercises used left and right, so we need one branch less
          numOfExercises--;
        }

        branches.main.push(result.branch);
        branchesIds.push(result.branchId);
      }
    } else if (["BAS", "GKS"].indexOf(type) > -1) {
      // set these short trainings to 10 exercises, 1 set, 60 secs, 10 secs pause
      let regions =
        type === "GKS"
          ? [
              { tags: ["REGION_UPPER_BODY"], count: 3 },
              { tags: ["REGION_FULL_BODY"], count: 2 },
            ]
          : [{ tags: [], count: 4 }];
      for (let region of regions) {
        for (let i = 0; i < region.count; i++) {
          let regionFiltered = filterByRegion(
            genderFiltered,
            getTagValues(region.tags, TagGroups.REGION),
          ).keep;
          if (Object.keys(regionFiltered).length === 0) {
            regionFiltered = genderFiltered;
            if (TrainingGenerator.DEBUG) {
              console.log("no matching branches found for region", region);
            }
          }
          let result = getBranchAndId(regionFiltered, branchesIds);
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
      painData,
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
      { skill: type as GeneratorSkillTypeFromSchema, length: exerciseTime },
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
    // remove last pause
    exerciseList.pop();

    // handle PREV special warm-up
    if (type.indexOf("PREV") > -1) {
      setsPerExercise = 1;
      let exercisePairsWU: ExercisePair[] = this.getExercisePairs(
        "WUSPEZIAL",
        branches["WUSPEZIAL"],
        exercises,
        painData,
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
      // replace last pause to WUSPEZIAL lastPause duration
      exerciseListWU.pop();
      exerciseListWU.push({
        branchId: PLACEHOLDER_BRANCH_ID,
        exerciseId: PAUSE_EXERCISE_ID,
        set: [1, 1],
        skill: "WUSPEZIAL",
        duration: 30,
      });
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

    if (TrainingGenerator.DEBUG)
      console.log("NO training for " + daysSinceLastWorkout + " days");
    if (daysSinceLastWorkout > 21) {
      if (TrainingGenerator.DEBUG) console.log("NEUEN PLAN GENERIEREN");
    } else if (daysSinceLastWorkout > 7) {
      // Extend section start dates when user has missed multiple weeks
      const { sections: extendedSections, additionalWeeks } =
        extendSectionsForMissedWeeks(
          trainingPlan.sections,
          daysSinceLastWorkout,
        );

      if (TrainingGenerator.DEBUG)
        console.log(`Extending plan sections by ${additionalWeeks} weeks`);

      trainingPlan.sections = extendedSections;
    }

    let currSec;
    if (givenSection) {
      currSec = trainingPlan.sections[givenSection];
    } else {
      currSec = getSectionForDate(
        trainingPlan.sections as Parameters<typeof getSectionForDate>[0],
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
          const cardioLength = currTraining.lengths[skill] ?? 0;
          const cardioSkill = "CARDIO_5" satisfies SkillTypes;
          currTraining.lengths[cardioSkill] = Math.min(cardioLength, 20); // max 20 minutes of replacemnet cardio
          exerciseBranches[cardioSkill] = [
            {
              tags: cardioReplacement.tags,
              exercises: cardioReplacement.levels,
              branchId: "576",
            },
          ];
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
          // Change used skill from former prevention to new PREV skill if needed
          if (skill.indexOf("PREV") !== -1 && replacement.length !== 0) {
            let prevRegion = getRegionsForPreventionSkills([skill]);
            // check if prevention region is still the same
            let regionReplacement = replacement.filter((r) =>
              getTagValues(r.tags, TagGroups.PREVENTION).some((p) =>
                prevRegion.includes(p),
              ),
            );
            let prevSkillsSecondary = prevSkills;
            const prevIndex = prevSkillsSecondary.indexOf(skill);
            if (prevIndex > -1) {
              prevSkillsSecondary.splice(prevIndex, 1);
            }
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
                currTraining.lengths[otherPrevSkill] =
                  (currTraining.lengths[otherPrevSkill] ?? 0) +
                  (currTraining.lengths[skill] ?? 0);
              } else {
                exerciseBranches[otherPrevSkill] = replacement;
                currTraining.lengths[otherPrevSkill] =
                  currTraining.lengths[skill] ?? 0;
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
            length: currTraining.lengths[skillKey] ?? 0,
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
    const birthday = getUserBirthday(user);
    const ageGroup = birthday
      ? ageGroupFor(birthday)
      : WorkoutConstants.AGE_GROUPS.ADULT;
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

      let possibleBranches = Object.keys(filteredBranches).filter(
        (branchId) => usedBranchIds.indexOf(branchId) === -1,
      );

      const userLevel = getUserLevel(user);
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
            // try choosing branches from less used regions
            let arrayOfLessUsedRegions = Object.keys(branchesByRegion).sort(
              (a, b) => branchesByRegion[a] - branchesByRegion[b],
            );
            for (let l = 0; l < arrayOfLessUsedRegions.length; l++) {
              if (
                branchesByRegion[arrayOfLessUsedRegions[l]] >= maxCountPerRegion
              ) {
                break;
              }
              regionBranches = possibleBranches.filter((branchId) => {
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
                regionBranches = regionBranches.filter((branchId) => {
                  const branchSide = getTagValues(
                    skillTree[branchId].tags,
                    TagGroups.SIDE,
                  );
                  return branchSide.indexOf("ONE") === -1;
                });
              }
              if (regionBranches.length > 0) break;
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
    skill: { skill: GeneratorSkillTypeFromSchema; length: number },
    skillTrees: { [skillName: string]: SkillTreeType },
    user: UserType,
    place: string,
    equipment: string[],
    exercises: ExerciseType[],
    setsPerExercise: number,
    temporalData: TemporalDataType[],
    userExerciseData: Record<string, UserExerciseDataType | undefined> | null,
    isShortTraining: boolean = false,
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
            {
              branchId: PLACEHOLDER_BRANCH_ID,
              exerciseId: "999999",
              set: [1, 1],
              skill: skill.skill,
              duration: 60,
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
      const exercise = this.getExerciseStartValues(
        skill.skill,
        exercisePairs[0].first,
        user,
        firstExercise,
        userExerciseData as { [id: string]: UserExerciseDataType },
        isShortTraining,
      );
      const repetition =
        (exercise as { repetition?: number }).repetition ?? startRepetition;
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
        timeRemaining -= intervalLength + pauseLength;
      }
      if (timeRemaining > 5 * 60) {
        // add 5 min warm-up at start
        result.unshift({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: fillExerciseId,
          set: [1, 1],
          skill: skill.skill,
          duration: 5 * 60,
        });
        timeRemaining -= 5 * 60;
      }
      if (timeRemaining > 60) {
        // if more than a minute left fill time
        result.push({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: fillExerciseId,
          set: [1, 1],
          skill: skill.skill,
          duration: timeRemaining,
        });
        // add pause to end cardio
        result.push({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: "999999",
          set: [1, 1],
          skill: skill.skill,
          duration: pauseLength,
        });
      }
      return result;
    } else if (skill.skill.indexOf("MAX") > -1) {
      const workoutData = requireWorkoutData(user);
      const birthday = getUserBirthday(user);
      const gender = getUserGender(user);
      const ageGroup = birthday
        ? ageGroupFor(birthday)
        : WorkoutConstants.AGE_GROUPS.ADULT;
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
      // try not to reuse sup exercises
      let usedSupExercisesIds: string[] = [];

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
        const maxValue = getMaxValueForExercise(exercise, maxValues) ?? 0;
        // 2 warm-up with reduced weight later calculated with trainingWeights
        let warmUpWeights = [50, 75];
        // set with ex - pause -sup1 -pause -sup2 -pause
        let maxTrainingWeights = this.getMaxTrainingWeights(
          exercise,
          user,
          userExerciseData,
        );
        let trainingReps = this.getMaxTrainingReps(
          user,
          maxTrainingWeights,
          userExerciseData,
          exercise,
          genderTag,
        );
        warmUpWeights = warmUpWeights.map((w) =>
          Math.floor((w / 100) * maxTrainingWeights.trainingWeights[0]),
        );
        let trainingWeights = warmUpWeights.concat(
          maxTrainingWeights.trainingWeights,
        );
        // get soreness areas for filtering support ex
        const tempTags = temporalData.map((element) => element.tag);
        let areas = getAreasFor(tempTags);
        areas = areas.map((a) => a.toUpperCase());
        const supportExercises = exercises.filter(
          (e) =>
            getTagValues(e.tags, TagGroups.SKILL).indexOf("SUPPORT") > -1 &&
            getTagValues(e.tags, TagGroups.SIDE).indexOf("RIGHT") === -1 &&
            !getTagValues(e.tags, TagGroups.REGION).some((e) =>
              areas.includes(e),
            ) &&
            e.displayName &&
            e.displayName.length > 0 &&
            equipmentForExerciseExists(e, equipment),
        );

        // build warm up
        // warm up scheme: ex - 60s pause - ex - 60s pause
        setList.push({
          branchId: first.branchId,
          exerciseId: first.exerciseId,
          tags: first.branchTags,
          set: [1, trainingWeights.length],
          skill: skill.skill,
          weight: roundWeightValue((trainingWeights[0] / 100) * maxValue),
          repetition: trainingReps[0].repetitions,
          repetitionMAX: trainingReps[0],
        });
        setList.push({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: "999999",
          set: [1, trainingWeights.length],
          skill: skill.skill,
          duration: 60,
        });
        setList.push({
          branchId: first.branchId,
          exerciseId: first.exerciseId,
          tags: first.branchTags,
          set: [2, trainingWeights.length],
          skill: skill.skill,
          weight: roundWeightValue((trainingWeights[1] / 100) * maxValue),
          repetition: trainingReps[1].repetitions,
          repetitionMAX: trainingReps[1],
        });
        setList.push({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: "999999",
          set: [2, trainingWeights.length],
          skill: skill.skill,
          duration: 60,
        });
        // build training
        // training scheme: ex - 30s pause - 8rep/30s supEx - 60s pause - 8rep/30s supEx - 30s pause
        // sup ex change after every rep
        const supportExerciseDuration = 30;
        const supportExerciseRepetition = 10;

        for (
          let trainingSet = 2;
          trainingSet < trainingWeights.length;
          trainingSet++
        ) {
          let isLastSet = trainingSet === trainingWeights.length - 1;
          if (!isLastSet) {
            // get sup exercise
            if (usedSupExercisesIds.length === supportExercises.length) {
              // reset if all in use
              usedSupExercisesIds = [];
            }

            let unusedSupExercises = supportExercises.filter(
              (ex) => usedSupExercisesIds.indexOf(ex.id) === -1,
            );

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
              nextTypeSupExercises =
                unusedSupExercises.length === 0
                  ? supportExercises
                  : unusedSupExercises;
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
              const supAgeGroup = birthday
                ? ageGroupFor(birthday)
                : WorkoutConstants.AGE_GROUPS.CHILD;
              const supUserLevel = getUserLevel(user);
              supWeight =
                getValueByGenderAndLevel(
                  supExercise.values.weight.startValue as GenderLevelValueMap,
                  supAgeGroup === WorkoutConstants.AGE_GROUPS.CHILD
                    ? "k"
                    : gender === "MALE"
                      ? "m"
                      : "w",
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
            // build rep
            setList.push({
              branchId: first.branchId,
              exerciseId: first.exerciseId,
              tags: first.branchTags,
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              weight: roundWeightValue(
                (trainingWeights[trainingSet] / 100) * maxValue,
              ),
              repetition: trainingReps[trainingSet].repetitions,
              repetitionMAX: trainingReps[trainingSet],
            });
            setList.push({
              branchId: PLACEHOLDER_BRANCH_ID,
              exerciseId: "999999",
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              duration: 30,
            });
            setList.push(supExerciseEntryFirst);
            setList.push({
              branchId: PLACEHOLDER_BRANCH_ID,
              exerciseId: "999999",
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              duration: 60,
            });
            setList.push(supExerciseEntrySecond);
            setList.push({
              branchId: PLACEHOLDER_BRANCH_ID,
              exerciseId: "999999",
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              duration: 30,
            });
          } else {
            // last rep and last 60s pause
            setList.push({
              branchId: first.branchId,
              exerciseId: first.exerciseId,
              tags: first.branchTags,
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              weight: roundWeightValue(
                (trainingWeights[trainingSet] / 100) * maxValue,
              ),
              repetition: trainingReps[trainingSet].repetitions,
              repetitionMAX: trainingReps[trainingSet],
            });
            setList.push({
              branchId: PLACEHOLDER_BRANCH_ID,
              exerciseId: "999999",
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              duration: 120,
            });
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
        let afterSetPauseLength = isShortTraining
          ? 10
          : this.getAfterSetPauseBySkill(skill.skill);
        // always use 10 in short trainings
        const pauseForSkill =
          PauseSUPERSETS[skill.skill as keyof typeof PauseSUPERSETS];
        if (!isShortTraining && pauseForSkill)
          afterSetPauseLength = pauseForSkill; // TODO check if single/super set

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
            let warmUpWeightFactor =
              skill.skill.indexOf("SK") > -1 ? 0.65 : 0.7;
            let warmUpPauseDuration = second ? 30 : 60;

            // add warm-up set
            set = [j, setsToBuild];
            let firstWarmUpRepetition =
              skill.skill.indexOf("SK") > -1 ? 8 : first.repetition;
            let firstWarmUp = cloneWithValidation(
              first,
              SetListEntrySchema,
              "first",
            ) as ExerciseStartValues;
            if (firstWarmUp.weight !== undefined) {
              firstWarmUp.weight = firstWarmUp.weight * warmUpWeightFactor;
            }
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
              repetition: firstWarmUpRepetition,
            });
            if (second) {
              let secondWarmUp = cloneWithValidation(
                second,
                SetListEntrySchema,
                "second",
              ) as ExerciseStartValues;
              let secondWarmUpRepetition =
                skill.skill.indexOf("SK") > -1 ? 8 : second.repetition;
              if (secondWarmUp.weight) {
                // reduce weight for warmup set
                secondWarmUp.weight = secondWarmUp.weight * warmUpWeightFactor;
              }
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
                repetition: secondWarmUpRepetition,
              });
            }
            // increase set count
            j++;
          }
        }

        for (; j <= setsToBuild; j++) {
          let pauseLength = inSetPauseLength;
          set = [j, setsToBuild];

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
            duration: pauseLength,
          });
          if (second) {
            if (j === setsToBuild) pauseLength = afterSetPauseLength;
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
        exercisePairs = this.getExercisePairs(
          skillList[i].skill,
          branches,
          exercises,
          PAINS,
          prevs,
        );
      }

      setList.push(
        ...this.getSetListFromExercisePairs(
          exercisePairs,
          {
            skill: skillList[i].skill as GeneratorSkillTypeFromSchema,
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
    //remove last pause
    setList.pop();
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
      let muscles = getTagValues(branches[b].branchTags, TagGroups.MUSCLE);
      if (
        muscles.filter((e, i) => WorkoutConstants.BIG_MUSCLES.indexOf(e) > -1)
          .length > 0
      ) {
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
          regionPains[pain].indexOf("LINKS") > -1 &&
          prevSides.indexOf("LEFT") === -1
        )
          prevSides.push("LEFT");
        if (
          regionPains[pain].indexOf("RECHTS") > -1 &&
          prevSides.indexOf("RIGHT") === -1
        )
          prevSides.push("RIGHT");
        if (
          regionPains[pain].indexOf("LINKS") === -1 &&
          regionPains[pain].indexOf("RECHTS") === -1 &&
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

    // use big muscle exercises
    while (bigMuscleExercises.length > 0) {
      const first = bigMuscleExercises.pop();

      // safety check here because sometimes exerciseId is not set ?!?
      if (
        !first ||
        typeof first.exerciseId === "undefined" ||
        first.exerciseId === null
      )
        continue;

      const pair: ExercisePair = { first };

      const exercise = exercises.filter(
        (entry) => entry.id === first.exerciseId,
      )[0];
      if (!exercise) {
        Logger.logEvent("exercise_data_in_pair_not_found", first);
        continue;
      }
      const sides: string[] = getTagValues(first.branchTags, TagGroups.SIDE);
      if (TrainingGenerator.DEBUG) {
        console.log("found sides", sides, "for exercise", exercise);
      }

      if (
        sides.length > 0 &&
        sides.indexOf("ONE") > -1 &&
        exercise.otherSideExerciseId
      ) {
        // use other side in superset
        pair.second = {
          branchId: first.branchId,
          branchTags: first.branchTags,
          exerciseId: exercise.otherSideExerciseId,
        };
        if (TrainingGenerator.DEBUG) {
          console.log("found other side exercise", pair.second.exerciseId);
        }
      } else if (isSuperset) {
        const oppMuscles = getOpposingMuscles(
          getTagValues(first.branchTags, TagGroups.MUSCLE),
        );
        // do not use one sided exercises to complete superset
        const bothSideBigMuscleExercises = bigMuscleExercises.filter((e) => {
          return (
            getTagValues(e.branchTags, TagGroups.SIDE).filter((e2) => {
              return e2 === "ONE" || e2 === "LEFT" || e2 === "RIGHT";
            }).length === 0
          );
        });
        const bothSideSmallMuscleExercises = smallMuscleExercises.filter(
          (e) => {
            return (
              getTagValues(e.branchTags, TagGroups.SIDE).filter((e2) => {
                return e2 === "ONE" || e2 === "LEFT" || e2 === "RIGHT";
              }).length === 0
            );
          },
        );

        // find exercise with opposing muscle
        let oppBigExercises: BranchExerciseReference[] = [];
        let oppSmallExercises: BranchExerciseReference[] = [];
        if (bothSideBigMuscleExercises.length > 0) {
          oppBigExercises = bothSideBigMuscleExercises.filter((e) => {
            return (
              // use opposing muscles
              getTagValues(e.branchTags, TagGroups.MUSCLE).filter((e3) => {
                return oppMuscles.indexOf(e3) > -1;
              }).length > 0
            );
          });
        }
        if (oppBigExercises.length === 0) {
          // no big muscle opponent found, look for small one
          oppSmallExercises = bothSideSmallMuscleExercises.filter((e) => {
            return (
              // use opposing muscles
              getTagValues(e.branchTags, TagGroups.MUSCLE).filter((e3) => {
                return oppMuscles.indexOf(e3) > -1;
              }).length > 0
            );
          });
        }
        if (oppBigExercises.length > 0) {
          // use opposing big muscle
          const exId = oppBigExercises[0].exerciseId;
          for (let i = 0; i < bigMuscleExercises.length; i++) {
            if (bigMuscleExercises[i].exerciseId === exId) {
              pair.second = bigMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else if (oppSmallExercises.length > 0) {
          // use opposing big muscle
          const exId = oppSmallExercises[0].exerciseId;
          for (let i = 0; i < smallMuscleExercises.length; i++) {
            if (smallMuscleExercises[i].exerciseId === exId) {
              pair.second = smallMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else if (bothSideBigMuscleExercises.length > 0) {
          // use any big muscle
          const exId = bothSideBigMuscleExercises[0].exerciseId;
          for (let i = 0; i < bigMuscleExercises.length; i++) {
            if (bigMuscleExercises[i].exerciseId === exId) {
              pair.second = bigMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else if (bothSideSmallMuscleExercises.length > 0) {
          // use any small muscle
          const exId = bothSideSmallMuscleExercises[0].exerciseId;
          for (let i = 0; i < smallMuscleExercises.length; i++) {
            if (smallMuscleExercises[i].exerciseId === exId) {
              pair.second = smallMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else {
          if (TrainingGenerator.DEBUG)
            console.log("No second exercise found for super set with: ", first);
        }
      }
      exercisePairs.push(pair);
    }

    // use small muscle exercises
    while (smallMuscleExercises.length > 0) {
      const first = smallMuscleExercises.pop();

      // safety check here because sometimes exerciseId is not set ?!?
      if (
        !first ||
        typeof first.exerciseId === "undefined" ||
        first.exerciseId === null
      )
        continue;

      const pair: ExercisePair = { first };

      const exercise = exercises.filter(
        (entry) => entry.id === first.exerciseId,
      )[0];
      const sides: string[] = getTagValues(first.branchTags, TagGroups.SIDE);

      if (TrainingGenerator.DEBUG) {
        console.log("found sides", sides, "for exercise", exercise);
      }

      if (
        sides.length > 0 &&
        sides.indexOf("ONE") > -1 &&
        exercise.otherSideExerciseId
      ) {
        // use other side in superset
        pair.second = {
          branchId: first.branchId,
          branchTags: first.branchTags,
          exerciseId: exercise.otherSideExerciseId,
        };
        if (TrainingGenerator.DEBUG) {
          console.log("found other side exercise", pair.second.exerciseId);
        }
      } else if (isSuperset) {
        // TODO filter complex before isolated
        // TODO opp direction first
        const oppMuscles = getOpposingMuscles(
          getTagValues(first.branchTags, TagGroups.MUSCLE),
        );

        const bothSideSmallMuscleExercises = smallMuscleExercises.filter(
          (e) => {
            return (
              getTagValues(e.branchTags, TagGroups.SIDE).filter((e2) => {
                return e2 === "ONE" || e2 === "LEFT" || e2 === "RIGHT";
              }).length === 0
            );
          },
        );

        let oppExercises: BranchExerciseReference[] = [];
        if (bothSideSmallMuscleExercises.length > 0) {
          oppExercises = bothSideSmallMuscleExercises.filter((e) => {
            return (
              getTagValues(e.branchTags, TagGroups.MUSCLE).filter((e2) => {
                return oppMuscles.indexOf(e2) > -1;
              }).length > 0
            );
          });
        }

        if (oppExercises.length > 0) {
          // use opposing small muscle
          const exId =
            oppExercises[Math.floor(Math.random() * oppExercises.length)]
              .exerciseId;
          for (let i = 0; i < smallMuscleExercises.length; i++) {
            if (smallMuscleExercises[i].exerciseId === exId) {
              pair.second = smallMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else if (bothSideSmallMuscleExercises.length > 0) {
          // use any small muscle
          const exId =
            bothSideSmallMuscleExercises[
              Math.floor(Math.random() * bothSideSmallMuscleExercises.length)
            ].exerciseId;
          for (let i = 0; i < smallMuscleExercises.length; i++) {
            if (smallMuscleExercises[i].exerciseId === exId) {
              pair.second = smallMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else {
          if (TrainingGenerator.DEBUG)
            console.log("No second exercise found for super set with: ", first);
        }
      }
      exercisePairs.push(pair);
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
   * MAX/SA skills have longer recovery (3 min), while warm-up skills use minimal rest.
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
      case "MAX":
      case "MAX_KRAFT":
      case "PLYO":
      case "SA":
      case "SAKG":
        pause = 3 * 60;
        break;
      case "GKS":
      case "GKSKG":
        pause = 90;
        break;
      case "SK":
      case "SKKG":
        pause = 2.5 * 60;
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
      default:
        pause = 10;
        break;
    }
    return pause;
  };

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
    let userGender: GenderTag = "k";
    if (getUserBirthday(user)) {
      userGender =
        ageGroupFor(getUserBirthday(user)) === WorkoutConstants.AGE_GROUPS.CHILD
          ? "k"
          : getUserGender(user) === "MALE"
            ? "m"
            : "w";
    }
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
      skillName as SkillType,
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
   * increasing weights (50%, 75%, 100% of calculated test weight).
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

    let percentage = 0.5;
    let repetitions = 12;
    let pauseLength = 60; // max and test always 60
    let pauseFactor = 1;
    let skill = "TEST";

    // build single lists to concat afterwards
    const singleExerciseLists = sortedExerciseIds.reduce<
      Record<string, GeneratedSetListEntry[]>
    >((acc, entry) => {
      acc[entry] = [];
      return acc;
    }, {});

    // build 2 warm-up sets, one test set
    for (let set = 1; set < 4; set++) {
      if (set === 2) {
        percentage = 0.75;
        repetitions = 8;
      }
      if (set === 3) {
        percentage = 1;
        pauseFactor = 2; // double pause after test set
        repetitions = -1; // -1 for "do as much as you can", get number afterwards
      }
      for (let i = 0; i < sortedExercises.length; i++) {
        singleExerciseLists[sortedExercises[i].id].push(
          this.getTestSetExercise(
            gender,
            userLevel,
            sortedExercises[i],
            workoutData.maxValues ?? DEFAULT_MAX_VALUES,
            TEST_WORKOUTS_START_VALUES,
            percentage,
            repetitions,
            set,
            skill as GeneratorSkillTypeFromSchema,
            i,
          ),
        );
        singleExerciseLists[sortedExercises[i].id].push({
          branchId: PLACEHOLDER_BRANCH_ID,
          exerciseId: PAUSE_EXERCISE_ID,
          set: [set, 3],
          duration: pauseFactor * pauseLength,
          skill: skill as GeneratorSkillTypeFromSchema,
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
    skill: GeneratorSkillTypeFromSchema,
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
    let weight = genderWeights?.[level] ?? 0;
    // use previous max value if set
    const maxValue = getMaxValueForExercise(sortedExercise, maxValues);
    if (maxValue) {
      // do not use 100% of last max value
      // use percentage of last maxValue by level
      let maxValuePercentage = 0.65;
      if (userLevel === WorkoutConstants.LEVELS.PROFESSIONAL) {
        maxValuePercentage = 0.7;
      }
      weight = roundWeightValue(maxValue * maxValuePercentage * percentage);
    } else {
      weight = roundWeightValue(weight * percentage);
    }

    return {
      branchId: PLACEHOLDER_BRANCH_ID,
      exerciseId: sortedExercise.id,
      set: [set, 3] as [number, number],
      weight: weight,
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
   * Applies difficulty-based adjustments to exercise values.
   * Increases or decreases duration, reps, height, and weight based on
   * user feedback from the previous workout with this exercise.
   */
  adjustExerciseValues = (
    dataInput: ExerciseValuesData,
    userExercise: UserExerciseDataType | null,
    exercise: ExerciseType,
    intensity: IntensityData | null,
    userGender: GenderTag,
    userLevel: string,
    difficultyFeedback: DifficultyFeedbackType,
  ): ExerciseValuesData => {
    const data: ExerciseValuesData = { ...dataInput };
    // use userExerciseData and adjust
    const adjustment = this.getAdjustmentByUserData(
      intensity,
      userGender,
      userLevel,
    );

    // consider feedback TODO consider streak length
    const adjustString: DifficultyFeedbackType = difficultyFeedback;

    //adjust
    if (exercise.isAdvanceByDuration && data.duration && adjustment.duration) {
      data.duration += adjustment.duration[adjustString];
    }
    if (exercise.isAdvanceByReps && data.repetition && adjustment.repetition) {
      data.repetition += adjustment.repetition[adjustString];
    }
    if (exercise.isJump && data.height && adjustment.height) {
      data.height += +adjustment.height[adjustString];
    }
    // Adjust weight based on feedback, consistent with reps/duration/height above.
    // This handles the "in between" zone where user didn't hit targets but also
    // didn't fall below start values. In that case, training-active preserves
    // feedback and TrainingGenerator adjusts all values here.
    // When training-active does adjust weight (target hit), it clears feedback,
    // so no double-adjustment occurs.
    if (data.weight !== undefined && data.weight !== null) {
      if (data.weightType === "weightFMax" && adjustment.weightFMax) {
        data.weight += adjustment.weightFMax[adjustString];
        // Clamp FMax percentage to valid range (50-100%)
        if (data.weight < 50) data.weight = 50;
        if (data.weight > 100) data.weight = 100;
      } else if (adjustment.weightAbsolute) {
        data.weight += adjustment.weightAbsolute[adjustString];
        // Prevent negative weight
        if (data.weight < 0) data.weight = 0;
      }
    }
    return data;
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
        [skill: string]: {
          [gender: string]: { [level: string]: number };
        };
      };

      // set default by skill and exercise type

      // Duration
      if (exercise.isAdvanceByDuration) {
        data.duration = startValue.duration
          ? +startValue.duration.default.default
          : undefined;
        if (startValue.duration && startValue.duration.default[userLevel]) {
          data.duration = +startValue.duration.default[userLevel];
        }
        if (
          startValue.duration &&
          startValue.duration[userGender] &&
          startValue.duration[userGender][userLevel]
        ) {
          data.duration = +startValue.duration[userGender][userLevel];
        }
      }

      // Repetition
      if (exercise.isAdvanceByReps) {
        data.repetition = startValue.repetition
          ? +startValue.repetition.default.default
          : undefined;
        if (startValue.repetition && startValue.repetition.default[userLevel]) {
          data.repetition = +startValue.repetition.default[userLevel];
        }
        if (
          startValue.repetition &&
          startValue.repetition[userGender] &&
          startValue.repetition[userGender][userLevel]
        ) {
          data.repetition = +startValue.repetition[userGender][userLevel];
        }
      }

      // Weight
      if (EQ_TYPES.indexOf("WEIGHTS") > -1) {
        data.weight = startValue.weight
          ? +startValue.weight.default.default
          : undefined;
        if (startValue.weight && startValue.weight.default[userLevel]) {
          data.weight = +startValue.weight.default[userLevel];
        }
        if (
          startValue.weight &&
          startValue.weight[userGender] &&
          startValue.weight[userGender][userLevel]
        ) {
          data.weight = +startValue.weight[userGender][userLevel];
        }

        const weightTypeObj = (startValue.weight as Record<string, unknown>)
          ?.type as { type?: string } | undefined;
        if (weightTypeObj?.type === "weightFMax") {
          // value is percentage of Fmax
          data.weight = data.weight;
          data.weightType = "weightFMax";
        }
      }

      // Height
      if (exercise.isJump) {
        let equip = getTagValues(exercise.tags, TagGroups.EQUIPMENT);
        if (hasJumpBox(equip)) {
          data.height = startValue.height
            ? +startValue.height.default.default
            : undefined;
          if (startValue.height && startValue.height.default[userLevel]) {
            data.height = +startValue.height.default[userLevel];
          }
          if (
            startValue.height &&
            startValue.height[userGender] &&
            startValue.height[userGender][userLevel]
          ) {
            data.height = +startValue.height[userGender][userLevel];
          }
        }
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

      if (exercise.isAdvanceByReps && startValues.repetition) {
        data.repetition = startValues.repetition; // not ternary could overwrite
      }
      if (exercise.isAdvanceByDuration && startValues.duration) {
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

  /**
   * Calculates the weight percentages for max strength training sets.
   * Returns progressive weights starting from minimum (based on user level)
   * up to the target percentage, with special handling for incline bench press.
   */
  getMaxTrainingWeights = (
    exercise: ExerciseType,
    user: UserType,
    userExercisesData: Record<string, UserExerciseDataType | undefined> | null,
  ): MaxTrainingWeightsResult => {
    const userLevel = getUserLevel(user);
    const equipment = getTagValues(exercise.tags, TagGroups.EQUIPMENT);
    const exerciseDirections = getTagValues(
      exercise.tags,
      TagGroups.EXERCISE_DIRECTION,
    );
    let firstWeightPercentage =
      WorkoutConstants.MAX_KRAFT_MINIMAL_WEIGHT_PERCENTAGE_PER_USER_LEVEL[
        userLevel
      ];
    let inclineBenchWeightDifference = 0;
    if (isInclineBenchPress(equipment, exerciseDirections)) {
      //  reduce weight for inclined press
      firstWeightPercentage =
        userLevel === WorkoutConstants.LEVELS.PROFESSIONAL ? 65 : 60;
      inclineBenchWeightDifference =
        WorkoutConstants.MAX_KRAFT_INCLINE_BENCH_WEIGHT_DIFFERENCE;
    }
    const userExerciseData = userExercisesData
      ? userExercisesData[exercise.id]
      : undefined;
    const trainingWeights: number[] = [];
    const numOfSets =
      WorkoutConstants.MAX_KRAFT_WORKING_REPS_PER_USER_LEVEL[userLevel];
    const exerciseWeightStartValue = exercise.values?.weight?.startValue
      ?.default as Record<string, string> | undefined;
    let percentage = parseFloat(
      exerciseWeightStartValue?.[userLevel.toLowerCase()] ?? "75",
    );
    if (userExerciseData && userExerciseData.nextWeightPercentage) {
      percentage = getRoundedResultForValueAndStep(
        userExerciseData.nextWeightPercentage,
        2.5,
      );
    }
    while (trainingWeights.length < numOfSets) {
      // maximum weight percentage per set
      if (trainingWeights.length === numOfSets - 2) {
        if (percentage > 85) percentage = 85;
      }
      if (trainingWeights.length === numOfSets - 1) {
        if (percentage > 80) percentage = 80;
      }
      // professional level maximum weight in 6. set
      if (numOfSets === 3) {
        if (trainingWeights.length === 0) {
          if (percentage > 90) percentage = 90;
        }
      }
      // minimum weight is firstWeightPercentage
      if (percentage < firstWeightPercentage)
        percentage = firstWeightPercentage;
      trainingWeights.unshift(percentage);
      percentage -= 2.5;
    }
    trainingWeights.unshift(firstWeightPercentage);
    return {
      trainingWeights: trainingWeights,
      inclineBenchWeightDifference: inclineBenchWeightDifference,
    };
  };

  /**
   * Calculates the repetition count for each set in max strength training.
   * Uses lookup tables based on user age, level, weight percentage, and difficulty level.
   * Returns warm-up reps followed by working set reps.
   */
  getMaxTrainingReps = (
    user: UserType,
    maxTrainingWeightsObject: MaxTrainingWeightsResult,
    userExercisesData: Record<string, UserExerciseDataType | undefined> | null,
    exercise: ExerciseType,
    genderTag: GenderTag,
  ): MaxTrainingRepsEntry[] => {
    let maxTrainingWeights = maxTrainingWeightsObject.trainingWeights;
    const inclineBenchWeightDifference =
      maxTrainingWeightsObject.inclineBenchWeightDifference;
    if (inclineBenchWeightDifference > 0) {
      maxTrainingWeights = maxTrainingWeights.map(
        (w) => w + inclineBenchWeightDifference,
      );
    }
    const userLevel = getUserLevel(user);
    const birthday = getUserBirthday(user);
    const userAge = ageGroupFor(birthday);
    const warmupTrainingReps = WorkoutConstants.MAX_KRAFT_REPETITIONS_WARMUP;
    const userExerciseData = userExercisesData
      ? userExercisesData[exercise.id]
      : undefined;
    const ageReps =
      WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[
        userAge as keyof typeof WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT
      ];
    const levelReps = ageReps?.[userLevel as keyof typeof ageReps];
    let maximumWeightPercentage = Math.max(
      ...Object.keys(levelReps?.HARD ?? { "75": 8 }).map(Number),
    );
    // set exercise targetValue if entered from webTool
    const weightTargetValue = exercise.values?.weight?.targetValue as
      | Record<string, Record<string, string> | undefined>
      | undefined;
    if (weightTargetValue) {
      const levelLower = userLevel.toLowerCase();
      const genderValue = weightTargetValue[genderTag];
      const defaultValue = weightTargetValue.default;
      if (genderValue?.[levelLower]) {
        maximumWeightPercentage = parseFloat(genderValue[levelLower]);
      } else if (defaultValue?.[levelLower]) {
        maximumWeightPercentage = parseFloat(defaultValue[levelLower]);
      }
    }
    let level = "EASY";
    if (userExerciseData && userExerciseData.maxFRepetitions) {
      if (userExerciseData.feedback?.difficulty) {
        //adjust level
        const lastLevel =
          userExerciseData.maxFRepetitions[
            userExerciseData.maxFRepetitions.length - 1
          ].level;
        if (userExerciseData.feedback.difficulty === "TOO_HARD") {
          // only weight decreases
          level = lastLevel;
        } else {
          // upgrade reps level
          if (userExerciseData.feedback.difficulty === "SUCCEEDED") {
            level =
              lastLevel === "EASY"
                ? "MEDIUM"
                : lastLevel === "MEDIUM"
                  ? "HARD"
                  : "EASY";
          } else {
            level =
              lastLevel === "EASY"
                ? "HARD"
                : lastLevel === "MEDIUM"
                  ? "EASY"
                  : "MEDIUM";
          }
        }
      } else {
        // feedback.difficulty is not set if levelUp should be done but no other branch exercise is found
        if (
          userExerciseData.nextWeightPercentage &&
          userExerciseData.nextWeightPercentage === maximumWeightPercentage
        ) {
          // level stays HARD for branch exercises that are finished but can't be replaced
          level = "HARD";
        }
      }
    }
    const firstMaxTrainingReps =
      userLevel === WorkoutConstants.LEVELS.PROFESSIONAL ? 3 : 4;
    const maxTrainingReps: MaxTrainingRepsEntry[] = [
      { level: level, repetitions: firstMaxTrainingReps },
    ];
    for (let w = 1; w < maxTrainingWeights.length; w++) {
      const levelKey = level as keyof typeof levelReps;
      const weightKey = maxTrainingWeights[w].toString();
      let repetitions = (
        levelReps?.[levelKey] as Record<string, number> | undefined
      )?.[weightKey];
      let checkableLevel = level;
      // look for undefined repetitionLevels and if found check if other levels would not be undefined
      for (let i = 0; i < 2; i++) {
        if (typeof repetitions === "undefined") {
          if (checkableLevel === "EASY" || checkableLevel === "HARD") {
            checkableLevel = "MEDIUM";
          } else if (checkableLevel === "MEDIUM") {
            checkableLevel = "HARD";
          }
          const checkKey = checkableLevel as keyof typeof levelReps;
          repetitions = (
            levelReps?.[checkKey] as Record<string, number> | undefined
          )?.[weightKey];
        }
      }
      // handle corrupt data by using min or max repetition count for high or low weight
      if (typeof repetitions === "undefined") {
        if (maxTrainingWeights[w] > 80) {
          repetitions = 1;
        } else {
          repetitions = 6;
        }
      }
      maxTrainingReps[w] = {
        level: level,
        repetitions: repetitions,
      };
    }
    const trainingReps = warmupTrainingReps.concat(maxTrainingReps);
    return trainingReps;
  };
}

TrainingGenerator.DEBUG = false;

const hasJumpBox = (equipment: string[]) => {
  const { BOX_LOW, BOX_HIGH } = WorkoutConstants.EQUIPMENT;
  return equipment.some((eq) => eq === BOX_LOW || eq === BOX_HIGH);
};

const isInclineBenchPress = (
  equipment: string[],
  exerciseDirections: string[],
) => {
  const { INCLINE_BENCH, ADJUSTABLE_BENCH } = WorkoutConstants.EQUIPMENT;
  if (equipment.indexOf(INCLINE_BENCH) === -1) {
    return false;
  }
  const hasOtherBenches = equipment
    .filter((eq) => eq.indexOf("BENCH") > -1)
    .filter(
      (bench) => bench !== INCLINE_BENCH && bench !== ADJUSTABLE_BENCH,
    ).length;
  if (hasOtherBenches > 0) {
    return false;
  }
  return (
    exerciseDirections.indexOf(
      WorkoutConstants.EXERCISE_DIRECTIONS.HORIZONTAL_PUSH,
    ) > -1
  );
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
      const exerciseRegions = getTagValues(branchTags, TagGroups.REGION);
      replace = replace.concat(exerciseRegions);
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

export const getIntensityBySkill = (
  skill: SkillType | GeneratorSkillTypeFromSchema | string,
) => {
  switch (skill) {
    // use SWR2 till exercises can be distinguished between SWR1 and SWR2
    case "SWR1":
    case "SWR1KG":
    case "SWR2":
      return IntensitySWR_2;
    case "SWR2KG":
      return IntensitySWR_2_KG;
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
      return IntensityGKS;
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
