//@ts-nocheck
import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { UserType } from "@/features/profile/models/User";
import type { ExerciseType } from "@/features/training/models/Exercise";
import {
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import type { SetListEntryType } from "@/features/training/models/SetListEntry";
import type { TemporalData } from "@/features/training/models/TemporalData";
import type { TrainingType } from "@/features/training/models/Training";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { getSectionForDate } from "@/features/training/trainingUtils";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
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
import { Logger } from "@/services/Logger";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import type { SkillTreeType } from "@/store/skillTreesStore";
import { getTagValues } from "@/utils/tagUtils";

// Intensity
import IntensityBAS from "../../../../assets/data/generator/intensity/BAS";
import IntensityCARDIO1LAKTAT from "../../../../assets/data/generator/intensity/CARDIO_1_LAKTAT";
import IntensityCARDIO1SHORT from "../../../../assets/data/generator/intensity/CARDIO_1_SHORT";
import IntensityCARDIO2 from "../../../../assets/data/generator/intensity/CARDIO_2";
import IntensityCARDIO3 from "../../../../assets/data/generator/intensity/CARDIO_3";
import IntensityDEFAULT from "../../../../assets/data/generator/intensity/DEFAULT";
import IntensityDEFAULTKG from "../../../../assets/data/generator/intensity/DEFAULTKG";
import IntensityGKS from "../../../../assets/data/generator/intensity/GKS";
import IntensityPREV from "../../../../assets/data/generator/intensity/PREV";
import IntensitySA from "../../../../assets/data/generator/intensity/SA";
import IntensitySAKG from "../../../../assets/data/generator/intensity/SAKG";
import IntensitySK from "../../../../assets/data/generator/intensity/SK";
import IntensitySKKG from "../../../../assets/data/generator/intensity/SKKG";
import IntensitySWR2 from "../../../../assets/data/generator/intensity/SWR2";
import IntensitySWR2KG from "../../../../assets/data/generator/intensity/SWR2KG";

// Pause
import PauseSUPERSETS from "../../../../assets/data/generator/pause/SUPERSETS";

// Test workouts
import TEST_WORKOUTS from "../../../../assets/data/generator/TEST_WORKOUTS";
import TEST_WORKOUTS_START_VALUES from "../../../../assets/data/generator/TEST_WORKOUTS_START_VALUES";
import TEST_WORKOUTS_WU_REGION from "../../../../assets/data/generator/TEST_WORKOUTS_WU_REGION";
import {
  getRoundedResultForValueAndStep,
  roundWeightValue,
} from "../utils/workoutUtils";

export default class TrainingGenerator {
  static DEBUG = false;

  generateTraining = (
    type: TrainingType,
    user: UserType,
    place: string,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    weekday: number,
    equipment: string[],
    givenSection?: number,
    daysSinceLastWorkout: number,
    userExerciseData: {
      exerciseData: Record<number, UserExerciseDataType>;
      branchData: Record<number, UserExerciseBranchDataType>;
    },
  ): UserExerciseDataType[] => {
    if (type === "TEST_WORKOUT") {
      if (user.workoutData === null) {
        // anamnesis not finished
        throw {
          type: "NO_ANAMNESIS",
          subtype: "MISSING_WORKOUT_DATA",
          params: [],
        };
      }
      const tempTags = user.temporalData.map((element) => element.tag);
      let areas = getAreasFor(tempTags);

      if (areas.length > 0) {
        // no test workout with muscle soreness
        throw {
          type: "TOO_MUCH_SORENESS",
          subtype: "TEST_WORKOUT",
          params: [],
        };
      }

      // return weight test workout
      let testSetList = this.getTestSetList(
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

  generateShortWorkout = (
    type: TrainingType,
    user: UserType,
    place: string,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    equipment: string[],
    userExerciseData,
  ) => {
    // get skill tree
    const HAS_WEIGHTS = hasWeights(equipment);
    let skillTree = getSkillTree(skillTrees, type, [], HAS_WEIGHTS, true);

    if (TrainingGenerator.DEBUG) {
      console.log("generate short training for " + type);
      console.log("HAS_WEIGHTS", HAS_WEIGHTS);
      console.log("skillTree", skillTree);
    }

    // add black roll to eq if chosen type is BR
    if (type === "BR") {
      if (!equipment.includes("BLACK_ROLL")) equipment.push("BLACK_ROLL");
      if (!equipment.includes("BLACK_BALL")) equipment.push("BLACK_BALL");
    }

    // get branches matching
    // prevention tag
    let preventionFiltered = skillTree;
    let prev;
    if (type.indexOf("PREV") > -1) {
      switch (type) {
        case "PREVSHOULDER":
          prev = "SCHULTER";
          break;
        case "PREVKNEE":
          prev = "KNIE_HUEFTE";
          break;
        case "PREVWRIST":
          prev = "HANDGELENK_ELLENBOGEN";
          break;
        case "PREVANKLE":
          prev = "SPRUNGGELENK";
          break;
        case "PREVSPINE":
          prev = "WIRBELSAULE";
          break;
        default:
          prev = "SCHULTER";
          break;
      }

      let specificPrevention = {};
      for (let id in skillTree) {
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
    const painData: string[] = user.workoutData
      ? getBlocksFromPains(getTagValues(user.workoutData.tags, TagGroups.PAIN))
      : [];

    let painFiltered = {};
    let painList = [];
    for (let id in preventionFiltered) {
      let entry = preventionFiltered[id];
      let blocked = getTagValues(entry.tags, TagGroups.BLOCK);

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

    let sorenessFiltered = filterBySoreness(
      painFiltered,
      user.temporalData,
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
          getAreasFor(user.temporalData.map((e) => e.tag)).map((a) =>
            a.toUpperCase(),
          ) || [],
      };
    }

    // equipment
    let equipmentFiltered = filterByEquipment(sorenessFiltered, equipment).keep;

    if (TrainingGenerator.DEBUG) {
      console.log("equipment filtered", equipmentFiltered);
    }

    // age
    let ageGroup = user.workoutData
      ? ageGroupFor(user.workoutData.birthday)
      : WorkoutConstants.AGE_GROUPS.CHILD;
    let ageFiltered = filterByAge(equipmentFiltered, ageGroup).keep;

    if (TrainingGenerator.DEBUG) {
      console.log("age filtered", ageFiltered);
    }

    // gender
    let userGender = user.workoutData ? user.workoutData.gender : "FEMALE";
    let genderFiltered = filterByGender(ageFiltered, userGender).keep;

    if (TrainingGenerator.DEBUG) {
      console.log("gender filtered", genderFiltered);
    }

    if (Object.keys(genderFiltered).length === 0) {
      throw {
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: equipmentFiltered.missingEquipment || [],
      };
    }

    // Build exercise list
    let branches: Record<
      {
        branchTags: string[];
        exerciseId: number;
      }[]
    > = { main: [] };
    let branchesIds = [];

    const getBranchAndId = (branches, usedBranchIds) => {
      let branchKeys = Object.keys(branches).filter(
        (entry) => usedBranchIds.indexOf(entry) === -1,
      );
      if (branchKeys.length === 0) return null;
      let id = branchKeys[Math.floor(Math.random() * branchKeys.length)];
      let level = Math.min(
        ...Object.keys(branches[id].levels).map((entry) => +entry),
      );
      let branch = {
        branchId: id,
        branchTags: branches[id].tags,
        exerciseId: branches[id].levels[level].id,
      };
      return {
        branch: branch,
        id: id,
      };
    };

    const getSuperSetPairBranchAndId = (branches, usedBranchIds, exercises) => {
      let branchKeys = Object.keys(branches).filter(
        (entry) => usedBranchIds.indexOf(entry) === -1,
      );
      if (branchKeys.length === 0) return null;
      let id = branchKeys[Math.floor(Math.random() * branchKeys.length)];
      let level = Math.min(
        ...Object.keys(branches[id].levels).map((entry) => +entry),
      );
      let exerciseId = branches[id].levels[level].id;
      let branch = {
        branchId: id,
        branchTags: branches[id].tags,
        exerciseId: exerciseId,
      };
      let fillUpBranchAndId = {};
      let replacementBranchesAndIds = [];
      // if found branch gives both sided exercise fill up for super set
      if (exercises[exerciseId].tags.includes("SIDE_BOTH")) {
        // searching for oppositeDirection exercise
        let oppositeDirection = "noDirection";
        let direction = exercises[exerciseId].tags.find((t) =>
          t.includes("EXERCISEDIRECTION_"),
        );
        if (direction) {
          // delete EXERCISEDIRECTION_ part
          direction = direction.slice(18);
          oppositeDirection = getOpposingExerciseDirection(direction);
          if (oppositeDirection === "") {
            oppositeDirection = "noDirection";
          }
        }
        usedBranchIds.push(id + "");
        for (let k = 0; k < branchKeys.length; k++) {
          let secondBranch = {};
          secondBranch[branchKeys[k]] = branches[branchKeys[k]];
          let result = getBranchAndId(secondBranch, usedBranchIds);
          if (result !== null) {
            if (
              exercises[result.branch.exerciseId].tags.includes("SIDE_BOTH")
            ) {
              fillUpBranchAndId.branch = result.branch;
              if (
                exercises[result.branch.exerciseId].tags.includes(
                  oppositeDirection,
                )
              )
                break;
            } else {
              // used if no second SIDE_BOTH exercise is found
              replacementBranchesAndIds.push(result);
            }
          }
        }
      }
      if (
        Object.keys(fillUpBranchAndId).length === 0 &&
        replacementBranchesAndIds.length !== 0
      ) {
        // use 1 ONE_SIDE branch in exchange of single BOTH_SIDE branch
        let randomBranchAndId =
          replacementBranchesAndIds[
            Math.floor(Math.random() * replacementBranchesAndIds.length)
          ];
        branch = randomBranchAndId.branch;
        id = randomBranchAndId.id;
        fillUpBranchAndId = {};
      }
      return {
        branch: branch,
        id: id,
        fillUpBranchAndId: fillUpBranchAndId,
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
        branchesIds.push(result.id);
      }
    } else if (["BAS", "GKS"].indexOf(type) > -1) {
      // set these short trainings to 10 exercises, 1 set, 60 secs, 10 secs pause
      let regions =
        type === "GKS"
          ? [
              { tags: ["REGION_OBERKOERPER"], count: 3 },
              { tags: ["REGION_GANZKOERPER"], count: 2 },
            ]
          : [{ tags: [], count: 4 }];
      for (let region of regions) {
        for (let i = 0; i < region.count; i++) {
          let regionFiltered = filterByRegion(
            genderFiltered,
            getTagValues(region.tags, TagGroups.REGION),
          ).keep;
          if (Object.keys(regionFiltered) === 0) {
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
          branchesIds.push(result.id);

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
        let filteredBranches = Object.keys(genderFiltered).reduce(
          (acc, branchKey) => {
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
              prevTags.includes(prev)
            ) {
              acc[branchKey] = genderFiltered[branchKey];
            }
            return acc;
          },
          {},
        );

        const isMainSkill = set.skill === "main";
        for (let i = 0; i < set.count; i++) {
          let result = isMainSkill
            ? getSuperSetPairBranchAndId(
                filteredBranches,
                branchesIds,
                exercises,
              )
            : getBranchAndId(filteredBranches, branchesIds);
          // end if no more branches
          if (result === null) break;
          if (isMainSkill) {
            // set branches for main skill ordered WEIGHTS last
            let hasWeights =
              result.branch.branchTags.includes("EQTYPE_WEIGHTS");
            if (hasWeights) {
              branches.main.unshift(result.branch);
              branchesIds.unshift(result.id);
              // add fill up branch for BOTH_SIDE
              if (result.fillUpBranchAndId.branch) {
                branches.main.unshift(result.fillUpBranchAndId.branch);
                branchesIds.unshift(result.fillUpBranchAndId.branch.branchId);
              }
            } else {
              branches.main.push(result.branch);
              branchesIds.push(result.id);
              // add fill up branch for BOTH_SIDE
              if (result.fillUpBranchAndId.branch) {
                branches.main.push(result.fillUpBranchAndId.branch);
                branchesIds.push(result.fillUpBranchAndId.branch.branchId);
              }
            }
          } else {
            // set branches for secondary sets skill
            if (!branches[set.skill]) {
              branches[set.skill] = [];
            }
            branches[set.skill].push(result.branch);
            branchesIds.push(result.id);
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
        branchesIds.push(result.id);

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
    let exercisePairs: {
      first: {
        branchTags: string[];
        exerciseId: number;
        branchId: number;
      };
      second: {
        branchTags: string[];
        exerciseId: number;
        branchId: number;
      };
    }[] = this.getExercisePairs(
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
        let secondSinglePair = {};
        let secondSinglePairIndex = -1;
        for (let i = 0; i < exercisePairs.length; i++) {
          if (!exercisePairs[i].second && i !== singlePairIndex) {
            secondSinglePair = exercisePairs[i].first;
            secondSinglePairIndex = i;
          }
        }
        if (secondSinglePairIndex !== -1) {
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
      { skill: type, length: exerciseTime },
      skillTrees,
      user,
      place,
      equipment,
      exercises,
      setsPerExercise,
      user.temporalData,
      userExerciseData.exerciseData,
      isShortTraining,
    );
    // remove last pause
    exerciseList.pop();

    // handle PREV special warm-up
    if (type.indexOf("PREV") > -1) {
      setsPerExercise = 1;
      let exercisePairsWU: {
        first: {
          branchTags: string[];
          exerciseId: number;
          branchId: number;
        };
        second: {
          branchTags: string[];
          exerciseId: number;
          branchId: number;
        };
      }[] = this.getExercisePairs(
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
        user.temporalData,
        userExerciseData.exerciseData,
        isShortTraining,
      );
      // replace last pause to WUSPEZIAL lastPause duration
      exerciseListWU.pop();
      exerciseListWU.push({
        branchId: -1,
        exerciseId: 999999,
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

  generatePlanWorkout = (
    type: TrainingType,
    user: UserType,
    place: string,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    weekday: number,
    equipment: string[],
    givenSection?: number,
    daysSinceLastWorkout: number,
    userExerciseData: {
      exerciseData: { [id: number]: UserExerciseDataType };
      branchData: { [id: number]: UserExerciseBranchDataType };
    },
  ) => {
    if (user.workoutData === null) {
      throw {
        type: "NO_ANAMNESIS",
        subtype: "MISSING_WORKOUT_DATA",
        params: [],
      };
    }

    let userLevel = getTagValues(user.workoutData.tags, TagGroups.LEVEL)[0];

    let temporalData: TemporalData[] = user.temporalData;

    //select current section => max start date of those with start date before today
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    if (TrainingGenerator.DEBUG)
      console.log("NO training for " + daysSinceLastWorkout + " days");
    if (daysSinceLastWorkout > 21) {
      if (TrainingGenerator.DEBUG) console.log("NEUEN PLAN GENERIEREN");
    } else if (daysSinceLastWorkout > 7) {
      let additionalWeeks = Math.floor(daysSinceLastWorkout / 7);
      if (TrainingGenerator.DEBUG)
        //extend ALL (starts of) sections of current plan by number of missed weeks
        user.trainingPlan.sections.forEach((sec) => {
          let curr = new Date(sec.start);
          curr.setDate(curr.getDate() + additionalWeeks * 7);
          sec.start = curr;
        });
      //clip last section by number of added weeks -> end of season phase is definite
      user.trainingPlan.sections[user.trainingPlan.sections.length - 1][
        "length"
      ] -= additionalWeeks; //TODO check if section length > 0
    }

    let currSec;
    if (givenSection) {
      currSec = user.trainingPlan.sections[givenSection];
    } else {
      currSec = getSectionForDate(user.trainingPlan.sections, today.getTime());
    }

    if (TrainingGenerator.DEBUG) console.log("CURRENT SECTION:", currSec);

    //get training for current weekday -- there should be only one
    let currTraining = currSec.trainings.filter((training) => {
      return training.weekday === weekday;
    })[0];
    // This should never happen
    if (typeof currTraining === "undefined") {
      // use first training in list
      currTraining = currSec.trainings[0];
    }

    if (TrainingGenerator.DEBUG) {
      console.log("TRAINING INPUT", currTraining);
    }

    // if no test needed => build training
    let exerciseBranches = JSON.parse(JSON.stringify(currTraining.skills));

    /** DEV for specific exercises

     console.log(exerciseBranches);
     exerciseBranches = {
            PREV: [
                {
                    exerciseBranchId: "152",
                    tags: [
                        "PREVENTION_SCHULTER",
                        "SKILL_COOL_DOWN",
                        "SKILL_MOBILITY",
                        "EQTYPE_KG",
                        "SIDE_ONE",
                        "MUSCLEINVOLVEMENT_ISOLATED",
                        "REGION_OBERKOERPER",
                        "EXERCISEDIRECTION_UNTERKOERPER",
                        "SEASONPHASE_PREPATORY",
                        "SEASONPHASE_COMPETITION",
                        "SEASONPHASE_PAUSE",
                        "PLACE_HALL",
                        "PLACE_STUDIO",
                        "PLACE_HOME",
                        "PLACE_OUTSIDE",
                        "MUSCLE_SCHULTER",
                        "MUSCLE_SCHULTERBLATT_FIXIEREND_HINTEN",
                        "MUSCLESECONDARY_SCHULTERBLATT_FIXIEREND_FRONT",
                        "MUSCLESECONDARY_UNTERER_RUECKEN",
                        "MUSCLESECONDARY_GESAESS",
                        "MUSCLESECONDARY_AEUSSERER_OBERSCHENKEL",
                        "PAIN_SCHULTER",
                        "PAIN_WIRBELSAEULE",
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

    for (let skill in exerciseBranches) {
      let replace = [];
      let branches = exerciseBranches[skill].reduce((acc, entry) => {
        acc[entry.exerciseBranchId] = entry;
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
          exerciseBranchId: id,
        };
      });

      if (replace.length > 0) {
        if (TrainingGenerator.DEBUG) {
          console.log("Replacement needed " + skill, replace);
          console.log("Keep others", keep);
        }

        if (skill.indexOf("CARDIO") > -1) {
          // replace with zone 5 cardio
          let cardioFiveBranches = skillTrees["CARDIO_5"];
          let cardioReplacement = cardioFiveBranches["576"]; // other selection process?

          // replace existing cardio skill with cardio 5
          exerciseBranches[skill] = null;
          let cardioLength = currTraining.lengths[skill];
          skill = "CARDIO_5";
          currTraining.lengths[skill] = Math.min(cardioLength, 20); // max 20 minutes of replacemnet cardio
          exerciseBranches[skill] = [
            {
              tags: cardioReplacement.tags,
              exercises: cardioReplacement.levels,
              exerciseBranchId: "576",
            },
          ];
        } else {
          const PAINS = getTagValues(user.workoutData.tags, TagGroups.PAIN);
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
            Object.keys(keep).map((index) => keep[index].exerciseBranchId),
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
              let otherPrevSkill = skill;
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
                  otherPrevSkill = prevSkillsSecondary[p];
                  break;
                }
              }
              if (exerciseBranches[otherPrevSkill]) {
                exerciseBranches[otherPrevSkill] =
                  exerciseBranches[otherPrevSkill].concat(replacement);
                currTraining.lengths[otherPrevSkill] =
                  currTraining.lengths[otherPrevSkill] +
                  currTraining.lengths[skill];
              } else {
                exerciseBranches[otherPrevSkill] = replacement;
                currTraining.lengths[otherPrevSkill] =
                  currTraining.lengths[skill];
              }
              // select exercise for updated userLevel
              exerciseBranches[otherPrevSkill] = exerciseBranches[
                otherPrevSkill
              ].map((branchData) => {
                if (branchData) {
                  let exercise = getUserExerciseFromBranch(
                    {
                      levels: branchData.exercises
                        ? branchData.exercises
                        : branchData.levels,
                      tags: branchData.tags,
                    },
                    userLevel,
                    exercises,
                    userExerciseData.branchData[branchData.exerciseBranchId]
                      ? userExerciseData.branchData[branchData.exerciseBranchId]
                      : null,
                  );
                  return {
                    branchId: branchData.exerciseBranchId,
                    branchTags: exercise ? exercise.tags : branchData.tags,
                    exerciseId: exercise ? exercise.id : null,
                  };
                }
                return null;
              });
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
      exerciseBranches[skill] = exerciseBranches[skill].map((branchData) => {
        if (branchData) {
          let exercise = getUserExerciseFromBranch(
            {
              levels: branchData.exercises
                ? branchData.exercises
                : branchData.levels,
              tags: branchData.tags,
            },
            userLevel,
            exercises,
            userExerciseData.branchData[branchData.exerciseBranchId]
              ? userExerciseData.branchData[branchData.exerciseBranchId]
              : null,
          );
          return {
            branchId: branchData.exerciseBranchId,
            branchTags: exercise ? exercise.tags : branchData.tags,
            exerciseId: exercise ? exercise.id : null,
          };
        }
        return null;
      });
    }

    let sorted: {
      skill: string;
      length: number;
      branches: {
        branchTags: string[];
        exerciseId: number;
        branchId: number;
      }[];
    }[] = Object.keys(exerciseBranches)
      .sort((a, b) => {
        return (
          WorkoutConstants.SECTION_ORDER.indexOf(a) -
          WorkoutConstants.SECTION_ORDER.indexOf(b)
        );
      })
      .map((skill) => {
        if (exerciseBranches[skill]) {
          // add to sorted if not null
          return {
            skill: skill,
            length: currTraining.lengths[skill],
            branches: exerciseBranches[skill],
          };
        }
      });
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

  //choose exercise branches avoiding constraint tags like sore muscles' body area and missing equipment
  replaceExerciseBranches = (
    skill,
    replace,
    temporalData,
    equipment,
    user,
    exercises,
    skillTrees: { [skillName: string]: SkillTreeType },
    usedBranchIds,
    prevSkills,
    userExerciseData,
    isShortWorkout: boolean,
  ) => {
    let replacement = [];
    // no weights for kids
    let ageGroup = ageGroupFor(user.workoutData.birthday);
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
    if (Object.keys(skillTree) !== 0) {
      let allBranches = {};
      // rewrite data format of branches for filter methods
      for (let id in skillTree) {
        let exercises = {};
        for (let lvl in skillTree[id].levels) {
          exercises[lvl] = {
            exerciseId: skillTree[id].levels[lvl].exerciseId
              ? skillTree[id].levels[lvl].exerciseId
              : skillTree[id].levels[lvl].id,
          };
        }
        allBranches[id] = {
          tags: skillTree[id].tags,
          exercises: exercises,
          exerciseBranchData: id,
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
        (branchId) =>
          // not used
          usedBranchIds.indexOf(branchId) === -1,
      );

      let userLevel = getTagValues(user.workoutData.tags, TagGroups.LEVEL)[0];
      const maxCountPerRegion = userLevel === "PROFESSIONAL" ? 6 : 5;
      let branchesByRegion = {
        UNTERKOERPER: 0,
        OBERKOERPER: 0,
        CORE: 0,
        GANZKOERPER: 0,
      };
      for (let branchId of usedBranchIds) {
        if (skillTree[branchId]) {
          let branch = skillTree[branchId];
          let regions = getTagValues(branch.tags, TagGroups.REGION);
          let side = getTagValues(branch.tags, TagGroups.SIDE)[0];
          for (let i = 0; i < regions.length; i++) {
            let count = side === "ONE" ? 2 : 1;
            branchesByRegion[regions[i]] += count;
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
          // regions to find replacement for
          let regions = replace[i];
          let regionBranches = possibleBranches.filter((branchId) => {
            let branchRegions = getTagValues(
              skillTree[branchId].tags,
              TagGroups.REGION,
            );
            return branchRegions.some((region) => regions.indexOf(region) > -1);
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
                  branchSide = getTagValues(
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
          let exerciseBranchId = possibleBranches.splice(
            possibleBranches.indexOf(randomId),
            1,
          )[0];
          let { tags, levels: constLevels } = skillTree[exerciseBranchId];
          let levels = JSON.parse(JSON.stringify(constLevels));

          for (let key in levels) {
            levels[key] = {
              exerciseId: levels[key].id
                ? levels[key].id
                : levels[key].exerciseId,
            };
          }
          let countChosen =
            getTagValues(tags, TagGroups.SIDE).indexOf("ONE") > -1 ? 2 : 1;
          let regionChosen = getTagValues(tags, TagGroups.REGION)[0];
          branchesByRegion[regionChosen] += countChosen;
          replacement.push({
            tags: tags,
            exercises: levels,
            exerciseBranchId: exerciseBranchId,
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

  getSetListFromExercisePairs = (
    exercisePairs: {
      first: {
        branchTags: string[];
        exerciseId: number;
        branchId: number;
      };
      second: {
        branchTags: string[];
        exerciseId: number;
        branchId: number;
      };
    }[],
    skill: { skill: string; length: number },
    skillTrees: { [skillName: string]: SkillTreeType },
    user,
    place: string,
    equipment,
    exercises,
    setsPerExercise,
    temporalData,
    userExerciseData,
    isShortTraining = false,
  ): {
    branchId: number;
    exerciseId: number;
    set: number[];
    skill: string;
    duration?: number;
    repetition?: number;
    weight?: number;
    height?: number;
  }[] => {
    if (TrainingGenerator.DEBUG) {
      console.log("Get set list with exercises: ", exercises);
      console.log("and exercisePairs: ", exercisePairs);
    }
    if (skill.skill.indexOf("CARDIO") > -1) {
      const CARDIO_5 = skillTrees["CARDIO_5"];
      const CARDIO_4 = skillTrees["CARDIO_4"];
      let pauseExercise = CARDIO_5[Object.keys(CARDIO_5)[0]];
      let pauseExerciseId =
        pauseExercise.levels[Object.keys(pauseExercise.levels)[0]].id;
      let fillExercise = CARDIO_4[Object.keys(CARDIO_4)[0]];
      let fillExerciseId =
        fillExercise.levels[Object.keys(fillExercise.levels)[0]].id;
      let intervalLength = 120;
      let pauseLength = 60;
      let startRepetition = 3;
      switch (skill.skill) {
        case "CARDIO_5":
        case "CARDIO_4":
          let length = skill.length;
          const tempTags = temporalData.map((element) => element.tag);
          let areas = getAreasFor(tempTags);
          if (areas.indexOf("unterkoerper") > -1) {
            // max 20 minutes if unterkoerper soreness
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
              branchId: -1,
              exerciseId: 999999,
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
      let result = [];
      let exercise = this.getExerciseStartValues(
        skill.skill,
        exercisePairs[0].first,
        user,
        exercises[exercisePairs[0].first.exerciseId],
        userExerciseData,
        isShortTraining,
      );
      let repetition = exercise.repetition
        ? exercise.repetition
        : startRepetition;
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
          branchId: -1,
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
          branchId: -1,
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
          branchId: -1,
          exerciseId: fillExerciseId,
          set: [1, 1],
          skill: skill.skill,
          duration: timeRemaining,
        });
        // add pause to end cardio
        result.push({
          branchId: -1,
          exerciseId: 999999,
          set: [1, 1],
          skill: skill.skill,
          duration: pauseLength,
        });
      }
      return result;
    } else if (skill.skill.indexOf("MAX") > -1) {
      let ageGroup = ageGroupFor(user.workoutData.birthday);
      const genderTag =
        ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
          ? "k"
          : user.workoutData.gender === "MALE"
            ? "m"
            : "w";

      // build max training with 2 warm up and 2/3 training sets filled with support exercises
      let setList = [];
      const maxValues: MaxValuesType = user.workoutData
        ? user.workoutData.maxValues
        : DEFAULT_MAX_VALUES;
      // try not to reuse sup exercises
      let usedSupExercisesIds = [];

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
        let first = exercisePairs[ep].first;
        let exercise = exercises[first.exerciseId];
        let maxValue = getMaxValueForExercise(exercise, maxValues);
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
          branchId: -1,
          exerciseId: 999999,
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
          branchId: -1,
          exerciseId: 999999,
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
            let nextType = "weight";
            let supExUsedYet = weightSupExUsed + kgSupExUsed;
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

            let supExercise =
              nextTypeSupExercises[
                Math.floor(Math.random() * nextTypeSupExercises.length)
              ];
            usedSupExercisesIds.push(supExercise.id);
            let supWeight = -1;
            if (
              getTagValues(supExercise.tags, TagGroups.EQTYPE).indexOf(
                "WEIGHTS",
              ) > -1 &&
              supExercise.values &&
              supExercise.values.weight
            ) {
              let ageGroup = user.workoutData
                ? ageGroupFor(user.workoutData.birthday)
                : WorkoutConstants.AGE_GROUPS.CHILD;
              let userLevel = user.workoutData
                ? getTagValues(user.workoutData.tags, TagGroups.LEVEL)[0]
                : WorkoutConstants.LEVELS.BEGINNER;
              supWeight = getValueByGenderAndLevel(
                supExercise.values.weight.startValue,
                ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
                  ? "k"
                  : user.workoutData && user.workoutData.gender === "MALE"
                    ? "m"
                    : "w",
                userLevel.toLowerCase(),
              );
            }
            let supExerciseEntryFirst = {
              branchId: -1,
              exerciseId: supExercise.id,
              tags: supExercise.tags,
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              duration: supportExerciseDuration,
              weight: supWeight > -1 ? supWeight : undefined,
            };
            if (supExercise.isAdvanceByReps) {
              supExerciseEntryFirst = {
                branchId: -1,
                exerciseId: supExercise.id,
                tags: supExercise.tags,
                set: [trainingSet + 1, trainingWeights.length],
                skill: skill.skill,
                repetition: supportExerciseRepetition,
                weight: supWeight > -1 ? supWeight : undefined,
              };
            }
            let supExerciseEntrySecond = supExerciseEntryFirst;
            if (
              supExercise.tags.indexOf("SIDE_ONE") > -1 &&
              supExercise.otherSideExerciseId
            ) {
              // use other side
              supExerciseEntrySecond = {
                branchId: -1,
                exerciseId: supExercise.otherSideExerciseId,
                tags: supExercise.tags,
                set: [trainingSet + 1, trainingWeights.length],
                skill: skill.skill,
                duration: supportExerciseDuration,
                weight: supWeight > -1 ? supWeight : undefined,
              };
              if (supExercise.isAdvanceByReps) {
                supExerciseEntrySecond = {
                  branchId: -1,
                  exerciseId: supExercise.otherSideExerciseId,
                  tags: supExercise.tags,
                  set: [trainingSet + 1, trainingWeights.length],
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
              branchId: -1,
              exerciseId: 999999,
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              duration: 30,
            });
            setList.push(supExerciseEntryFirst);
            setList.push({
              branchId: -1,
              exerciseId: 999999,
              set: [trainingSet + 1, trainingWeights.length],
              skill: skill.skill,
              duration: 60,
            });
            setList.push(supExerciseEntrySecond);
            setList.push({
              branchId: -1,
              exerciseId: 999999,
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
              branchId: -1,
              exerciseId: 999999,
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
      let setList = [];
      for (let i = 0; i < exercisePairs.length; i++) {
        if (
          typeof exercises[exercisePairs[i].first.exerciseId] === "undefined" ||
          exercisePairs[i].first.exerciseId === -1
        ) {
          // no exercises found for this pair
          if (TrainingGenerator.DEBUG)
            console.error("NO EXERCISES IN PAIR: ", exercisePairs[i]);
          continue;
        }
        let first = exercisePairs[i].first;
        if (
          typeof exercises[first.exerciseId] === "undefined" ||
          exercises[first.exerciseId] === null
        ) {
          if (TrainingGenerator.DEBUG)
            console.log("NO EXERCISE ENTRY FOR ID: ", first.exerciseId);
        }

        // add data
        first = this.getExerciseStartValues(
          skill.skill,
          first,
          user,
          exercises[first.exerciseId],
          userExerciseData,
          isShortTraining,
        );
        // calc pause
        const inSetPauseLength = this.getInSetPauseBySkill(skill.skill);
        let afterSetPauseLength = isShortTraining
          ? 10
          : this.getAfterSetPauseBySkill(skill.skill);
        // always use 10 in short trainings
        if (!isShortTraining && PauseSUPERSETS[skill.skill])
          afterSetPauseLength = PauseSUPERSETS[skill.skill]; // TODO check if single/super set

        let second;
        if (exercisePairs[i].second && exercisePairs[i].second.exerciseId) {
          if (exercisePairs[i].second.exerciseId === -1) {
            // no exercises found for this pair
            if (TrainingGenerator.DEBUG)
              console.error("NO SECOND EXERCISES IN PAIR: ", exercisePairs[i]);
            continue;
          }
          second = exercisePairs[i].second;
          if (
            typeof exercises[second.exerciseId] === "undefined" ||
            exercises[second.exerciseId] === null
          ) {
            if (TrainingGenerator.DEBUG)
              console.log("NO EXERCISE ENTRY FOR: ", second);
          }

          // add data
          second = this.getExerciseStartValues(
            skill.skill,
            second,
            user,
            exercises[second.exerciseId],
            userExerciseData,
            isShortTraining,
          );
        } else {
          if (
            TrainingGenerator.DEBUG &&
            exercisePairs[i].second &&
            typeof exercisePairs[i].second.exerciseId === "undefined"
          )
            console.error(
              "NO EXERCISE ID DEFINED IN SECOND: ",
              exercisePairs[i].second,
            );
        }
        let set = [];
        let j = 1;
        let setsToBuild = setsPerExercise;

        if (skill.skill.indexOf("SWR") > -1 || skill.skill.indexOf("SK") > -1) {
          let firstEqType = getTagValues(first.tags, TagGroups.EQTYPE);
          let secondEqType = second
            ? getTagValues(second.tags, TagGroups.EQTYPE)
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
            let firstWarmUp = JSON.parse(JSON.stringify(first));
            firstWarmUp.weight = firstWarmUp.weight * warmUpWeightFactor;
            setList.push({
              ...firstWarmUp,
              set: set,
              skill: skill.skill,
            });
            setList.push({
              branchId: -1,
              exerciseId: 999999,
              set: set,
              skill: skill.skill,
              duration: warmUpPauseDuration,
              repetition: firstWarmUpRepetition,
            });
            if (second) {
              let secondWarmUp = JSON.parse(JSON.stringify(second));
              let secondWarmUpRepetition =
                skill.skill.indexOf("SK") > -1 ? 8 : second.repetition;
              if (secondWarmUp.weight) {
                // reduce weight for warmup set
                secondWarmUp.weight = secondWarmUp.weight * warmUpWeightFactor;
              }
              // add second exercise to set anyway
              setList.push({
                ...secondWarmUp,
                set: set,
                skill: skill.skill,
              });
              setList.push({
                branchId: -1,
                exerciseId: 999999,
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
            branchId: -1,
            exerciseId: 999999,
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
              branchId: -1,
              exerciseId: 999999,
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

  getSetCountBySkill = (skill: string, level: string) => {
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
    skillList: {
      skill: string;
      branches: {
        branchTags: string[];
        exerciseId: number;
        branchId: number;
      }[];
    }[],
    exercises,
    skillTrees: { [skillName: string]: SkillTreeType },
    user,
    place: string,
    equipment,
    userExerciseData,
  ) => {
    if (TrainingGenerator.DEBUG) console.log("skillList: ", skillList);
    const userLevel = getTagValues(user.workoutData.tags, TagGroups.LEVEL)[0];
    const PAINS = getTagValues(user.workoutData.tags, TagGroups.PAIN);

    let setList = [];

    if (TrainingGenerator.DEBUG) console.log("exercises: ", exercises);
    for (let i = 0; i < skillList.length; i++) {
      if (typeof skillList[i] === "undefined") continue;
      let setsPerExercise = this.getSetCountBySkill(
        skillList[i].skill,
        userLevel,
      );
      let branches: {
        branchTags: string[];
        exerciseId: number;
        branchId: number;
      }[] = skillList[i].branches;
      // build super sets
      let exercisePairs: {
        first: {
          branchTags: string[];
          exerciseId: number;
          branchId: number;
        };
        second: {
          branchTags: string[];
          exerciseId: number;
          branchId: number;
        };
      }[] = [];

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
          skillList[i],
          skillTrees,
          user,
          place,
          equipment,
          exercises,
          setsPerExercise,
          user.temporalData,
          userExerciseData,
        ),
      );
    }
    //remove last pause
    setList.pop();
    return setList;
  };

  getCardioExercisePairs = (
    skill: {
      skill: string;
      length: number;
    },
    branches: {
      branchTags: string[];
      exerciseId: number;
    }[],
    exercises: ExerciseType[],
    pains: string[],
    isShortTraining: boolean = false,
  ): {
    first: {
      branchTags: string[];
      exerciseId: number;
    };
    second?: {
      branchTags: string[];
      exerciseId: number;
    };
  }[] => {
    console.log(skill);
    let exercisePairs = [];
    switch (skill.skill) {
      case "CADRIO_5":
      case "CADRIO_4":
        // use the one given branch
        return [
          {
            first: branches[0],
          },
        ];
      case "CADRIO_3":
      case "CADRIO_2":
      case "CADRIO_1_SHORT":
      case "CADRIO_1_LAKTAT":
        // run intervalls with cardio5 pause and cardio 4 wu 5min and and fill till end
        break;
      default:
        break;
    }
    return exercisePairs;
  };

  getExercisePairs = (
    skill: string,
    branches: {
      branchId: number;
      branchTags: string[];
      exerciseId: number;
    }[],
    exercises: ExerciseType[],
    pains: string[],
    thisDayPrevs: string[],
    isShortTraining: boolean = false,
  ): {
    first: {
      branchTags: string[];
      exerciseId: number;
    };
    second?: {
      branchTags: string[];
      exerciseId: number;
    };
  }[] => {
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
    let exercisePairs = [];
    let bigMuscleExercises: {
      branchTags: string[];
      exerciseId: number;
    }[] = [];
    let smallMuscleExercises: {
      branchTags: string[];
      exerciseId: number;
    }[] = [];
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
    let prevSides = [];
    let regionPains = [];
    let prevRegions;
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
      );
      // filter side small
      smallMuscleExercises = filterExercisesBySides(
        smallMuscleExercises,
        exercises,
        prevSides,
      );

      // build exercise pairs
      while (bigMuscleExercises.length > 0) {
        let pair = { first: bigMuscleExercises.pop() };
        if (bigMuscleExercises.length > 0) {
          pair.second = bigMuscleExercises.pop();
        } else if (smallMuscleExercises.length > 0) {
          pair.second = smallMuscleExercises.pop();
        }
        exercisePairs.push(pair);
      }
      while (smallMuscleExercises.length > 0) {
        let pair = { first: smallMuscleExercises.pop() };
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
      let pair = { first: bigMuscleExercises.pop() };

      // safety check here because sometimes exerciseId is not set ?!?
      if (
        typeof pair.first.exerciseId === "undefined" ||
        pair.first.exerciseId === null
      )
        continue;

      let exercise = exercises.filter(
        (entry) => entry.id === pair.first.exerciseId,
      )[0];
      if (!exercise) {
        Logger.logEvent("exercise_data_in_pair_not_found", pair.first);
        continue;
      }
      const sides: string[] = getTagValues(
        pair.first.branchTags,
        TagGroups.SIDE,
      );
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
          branchId: pair.first.branchId,
          branchTags: pair.first.branchTags,
          exerciseId: exercise.otherSideExerciseId,
        };
        if (TrainingGenerator.DEBUG) {
          console.log("found other side exercise", pair.second.exerciseId);
        }
      } else if (isSuperset) {
        let oppMuscles = getOpposingMuscles(
          getTagValues(pair.first.branchTags, TagGroups.MUSCLE),
        );
        // do not use one sided exercises to complete superset
        let bothSideBigMuscleExercises = bigMuscleExercises.filter((e, i) => {
          return (
            getTagValues(e.branchTags, TagGroups.SIDE).filter((e2, i2) => {
              return e2 === "ONE" || e2 === "LEFT" || e2 === "RIGHT";
            }).length === 0
          );
        });
        let bothSideSmallMuscleExercises = smallMuscleExercises.filter(
          (e, i) => {
            return (
              getTagValues(e.branchTags, TagGroups.SIDE).filter((e2, i2) => {
                return e2 === "ONE" || e2 === "LEFT" || e2 === "RIGHT";
              }).length === 0
            );
          },
        );

        // find exercise with opposing muscle
        let oppBigExercises = [];
        let oppSmallExercises = [];
        if (bothSideBigMuscleExercises.length > 0) {
          oppBigExercises = bothSideBigMuscleExercises.filter((e, i) => {
            return (
              // use opposing muscles
              getTagValues(e.branchTags, TagGroups.MUSCLE).filter((e3, i3) => {
                return oppMuscles.indexOf(e3) > -1;
              }).length > 0
            );
          });
        }
        if (oppBigExercises.length === 0) {
          // no big muscle opponent found, look for small one
          oppSmallExercises = bothSideSmallMuscleExercises.filter((e, i) => {
            return (
              // use opposing muscles
              getTagValues(e.branchTags, TagGroups.MUSCLE).filter((e3, i3) => {
                return oppMuscles.indexOf(e3) > -1;
              }).length > 0
            );
          });
        }
        if (oppBigExercises.length > 0) {
          // use opposing big muscle
          let exId = oppBigExercises[0].exerciseId;
          for (let i = 0; i < bigMuscleExercises.length; i++) {
            if (bigMuscleExercises[i].exerciseId === exId) {
              pair.second = bigMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else if (oppSmallExercises.length > 0) {
          // use opposing big muscle
          let exId = oppSmallExercises[0].exerciseId;
          for (let i = 0; i < smallMuscleExercises.length; i++) {
            if (smallMuscleExercises[i].exerciseId === exId) {
              pair.second = smallMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else if (bothSideBigMuscleExercises.length > 0) {
          // use any big muscle
          let exId = bothSideBigMuscleExercises[0].exerciseId;
          for (let i = 0; i < bigMuscleExercises.length; i++) {
            if (bigMuscleExercises[i].exerciseId === exId) {
              pair.second = bigMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else if (bothSideSmallMuscleExercises.length > 0) {
          // use any small muscle
          let exId = bothSideSmallMuscleExercises[0].exerciseId;
          for (let i = 0; i < smallMuscleExercises.length; i++) {
            if (smallMuscleExercises[i].exerciseId === exId) {
              pair.second = smallMuscleExercises.splice(i, 1)[0];
              break;
            }
          }
        } else {
          if (TrainingGenerator.DEBUG)
            console.log(
              "No second exercise found for super set with: ",
              pair.first,
            );
        }
      }
      exercisePairs.push(pair);
    }

    // use small muscle exercises
    while (smallMuscleExercises.length > 0) {
      let pair = { first: smallMuscleExercises.pop() };

      // safety check here because sometimes exerciseId is not set ?!?
      if (
        typeof pair.first.exerciseId === "undefined" ||
        pair.first.exerciseId === null
      )
        continue;

      let exercise = exercises.filter(
        (entry) => entry.id === pair.first.exerciseId,
      )[0];
      let sides: string[] = getTagValues(pair.first.branchTags, TagGroups.SIDE);

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
          branchId: pair.first.branchId,
          branchTags: pair.first.branchTags,
          exerciseId: exercise.otherSideExerciseId,
        };
        if (TrainingGenerator.DEBUG) {
          console.log("found other side exercise", pair.second.exerciseId);
        }
      } else if (isSuperset) {
        // TODO filter complex before isolated
        // TODO opp direction first
        let oppMuscles = getOpposingMuscles(
          getTagValues(pair.first.branchTags, TagGroups.MUSCLE),
        );

        let bothSideSmallMuscleExercises = smallMuscleExercises.filter(
          (e, i) => {
            return (
              getTagValues(e.branchTags, TagGroups.SIDE).filter((e2, i2) => {
                return e2 === "ONE" || e2 === "LEFT" || e2 === "RIGHT";
              }).length === 0
            );
          },
        );

        let oppExercises = [];
        if (bothSideSmallMuscleExercises.length > 0) {
          oppExercises = bothSideSmallMuscleExercises.filter((e, i) => {
            return (
              getTagValues(e.branchTags, TagGroups.MUSCLE).filter((e2, i2) => {
                return oppMuscles.indexOf(e2) > -1;
              }).length > 0
            );
          });
        }

        if (oppExercises.length > 0) {
          // use opposing small muscle
          let exId =
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
          let exId =
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
            console.log(
              "No second exercise found for super set with: ",
              pair.first,
            );
        }
      }
      exercisePairs.push(pair);
    }

    //TODO Equipment Kombinationen Prios beachten
    //TODO Wechsel zwischen Regions in Supersatz möglich
    //TODO siehe Excel-Sheet "Aufbau der Trainingseinheiten 1" Tabelle Nr. 2 bis Ende
    return exercisePairs;
  };

  isSuperset = (skill: string, shortTraining: boolean = false) => {
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

  getInSetPauseBySkill = (skill: string) => {
    let pause;
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

  getAfterSetPauseBySkill = (skill: string) => {
    let pause;
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

  getRepetitionDefaultBySkill = (skillName: string) => {
    let repititions;
    switch (skillName) {
      case "CARDIO_1_SHORT":
      case "CARDIO_1_LAKTAT":
      case "CARDIO_2":
      case "CARDIO_3":
      case "CARDIO_4":
      case "CARDIO_5":
        repititions = 3;
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
        repititions = 8;
        break;
    }
    return repititions;
  };

  getDurationDefaultBySkill = (skillName: string) => {
    let duration;
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
   * Finds the best matching values for given exercise in following order
   *
   * - default by skill
   * - default by exercise
   * -- specific by exercise
   * - increased value based on value of last training with exercise and given feedback
   *
   * @param skillName
   * @param skill
   * @param user
   * @param exercise
   * @param isShortTraining
   * @returns Object containing exercise start values with duration, branchId, exerciseId, weight, repetition, tags, and height properties, or an empty object
   */
  getExerciseStartValues = (
    skillName: string,
    skill: {
      branchTags: string[];
      exerciseId: number;
      branchId: number;
    },
    user: UserType,
    exercise: ExerciseType,
    userExerciseData: { [id: string]: UserExerciseDataType },
    isShortTraining = false,
  ) => {
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
    let userGender = "k";
    if (user.workoutData) {
      userGender =
        ageGroupFor(user.workoutData.birthday) ===
        WorkoutConstants.AGE_GROUPS.CHILD
          ? "k"
          : user.workoutData.gender === "MALE"
            ? "m"
            : "w";
    }
    const levels = user.workoutData
      ? getTagValues(user.workoutData.tags, TagGroups.LEVEL)
      : WorkoutConstants.LEVELS.BEGINNER;
    const userLevel = levels[0] ? levels[0].toLowerCase() : "beginner"; // TODO check beginner as default?

    // Init result
    let data = {};
    data.tags = skill.branchTags;
    data.exerciseId = skill.exerciseId;
    data.branchId = skill.branchId;
    data.duration =
      exercise && exercise.isAdvanceByDuration
        ? this.getDurationDefaultBySkill(skillName)
        : undefined;
    data.height = undefined;
    data.repetition =
      exercise && exercise.isAdvanceByReps
        ? this.getRepetitionDefaultBySkill(skillName)
        : undefined;
    data.weight = undefined;
    data.weightType = "weightAbsolute";

    const userExercise = userExerciseData
      ? userExerciseData[skill.exerciseId]
      : null;

    // from data/generator/TestIntensity
    let intensity: {
      adjustment: {
        [value: string]: {
          [gender: string]: {
            [level: string]: { [feedback: string]: number };
          };
        };
      };
      startValue: {
        [value: string]: {
          [gender: string]: { [level: string]: number };
        };
      };
      targetValue: {
        [value: string]: {
          [gender: string]: { [level: string]: number };
        };
      };
    } | null = getIntensityBySkill(skillName);

    let exerciseValues = this.getExerciseValues(
      userExercise,
      exercise,
      intensity,
      userGender,
      userLevel,
      user.workoutData ? user.workoutData.maxValues : DEFAULT_MAX_VALUES,
    );
    let isNewDifficultySet = false;
    let difficultyFeedback = "None";
    if (userExercise) {
      if (userExercise.feedback) {
        isNewDifficultySet =
          userExercise.feedback.difficulty !== null &&
          typeof userExercise.feedback.difficulty !== "undefined";
      }
    }

    if (
      WorkoutConstants.NO_INCREASE_SKILL_TYPE.indexOf(skillName) === -1 &&
      userExercise &&
      (isNewDifficultySet || userExercise.difficulty !== null)
    ) {
      if (isNewDifficultySet) {
        difficultyFeedback = userExercise.feedback.difficulty;
      } else {
        difficultyFeedback = userExercise.difficulty;
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
    if (exerciseValues.weightType) data.weightType = exerciseValues.weightType;

    return data;
  };

  isEmptyOrUndefined = (obj) => {
    if (typeof obj === "undefined") {
      return true;
    } else if (Object.keys(obj).length === 0 && obj.constructor === Object) {
      return true;
    }
    return false;
  };

  getTestSetList = (
    user: UserType,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    userExerciseData: {
      exerciseData: { [id: number]: UserExerciseDataType };
      branchData: { [id: number]: UserExerciseBranchDataType };
    },
  ) => {
    const userLevel = getTagValues(user.workoutData.tags, TagGroups.LEVEL)[0];
    // 5 min warm up to start
    let wuBranches = getSkillTree(skillTrees, "WU", [], true);
    let wuRegions = TEST_WORKOUTS_WU_REGION;
    let usedBranches = [];
    let wuSetList = [];
    wuRegions.forEach((region) => {
      for (
        let i = 0;
        i < region.count &&
        usedBranches.length < Object.keys(wuBranches).length;
        i++
      ) {
        let unusedBranches = Object.keys(wuBranches).filter((branchId) => {
          return usedBranches.every((entry) => entry !== branchId);
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
          userExerciseData.branchData[selectedBranchId]
            ? userExerciseData.branchData[selectedBranchId]
            : null,
        );
        usedBranches.push(selectedBranchId);
        if (userLevelExercise) {
          let entry = {
            exerciseId: userLevelExercise.id,
            set: [1, 1],
            skill: "WU",
          };
          let startValue = this.getExerciseStartValues(
            WorkoutConstants.SKILL_TYPES.WU,
            entry,
            user,
            exercises[entry.exerciseId],
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
            exerciseId: 999999,
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

    let sortedExerciseIds: number[] = TEST_WORKOUTS[userLevel].default;
    if (TEST_WORKOUTS[userLevel][user.workoutData.gender])
      // use gender specific if exists
      sortedExerciseIds = TEST_WORKOUTS[userLevel][user.workoutData.gender];
    const sortedExercises = exercises
      .filter((entry) => {
        return sortedExerciseIds.indexOf(entry.id) > -1;
      })
      .sort((a, b) => {
        if (sortedExerciseIds.indexOf(a.id) > sortedExerciseIds.indexOf(b.id))
          return -1;
        return 1;
      });

    let setList: SetListEntryType[] = wuSetList;

    let percentage = 0.5;
    let repetitions = 12;
    let pauseLength = 60; // max and test always 60
    let pauseFactor = 1;
    let skill = "TEST";

    // build single lists to concat afterwards
    let singleExerciseLists = sortedExerciseIds.reduce((acc, entry) => {
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
            user.workoutData.gender,
            userLevel,
            sortedExercises[i],
            user.workoutData.maxValues,
            TEST_WORKOUTS_START_VALUES,
            percentage,
            repetitions,
            set,
            skill,
            i,
          ),
        );
        singleExerciseLists[sortedExercises[i].id].push({
          exerciseId: 999999,
          set: [set, 3],
          duration: pauseFactor * pauseLength,
          skill: skill,
        });
      }
    }
    sortedExerciseIds.forEach((entry) => {
      setList = setList.concat(singleExerciseLists[entry]);
    });

    return setList;
  };

  getTestSetExercise = (
    userGender,
    userLevel,
    sortedExercise,
    maxValues,
    startValues,
    percentage,
    repetitions,
    set,
    skill,
    num,
  ) => {
    let gender = userGender === "MALE" ? "m" : "w";
    let level;
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
    let weight = startValues[sortedExercise.id][gender][level];
    // use previous max value if set
    let maxValue = getMaxValueForExercise(sortedExercise, maxValues);
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
      exerciseId: sortedExercise.id,
      set: [set, 3],
      weight: weight,
      repetition: repetitions,
      skill: skill,
    };
  };

  getAdjustmentByUserData = (intensity, userGender, userLevel) => {
    // init
    let adjustment = {
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
      } = intensity.adjustment;
      let skillAdjustments = {};

      // Duration
      skillAdjustments.duration = adjust.duration
        ? adjust.duration.default.default
        : undefined;
      //default by level
      if (adjust.duration && adjust.duration.default[userLevel])
        skillAdjustments.duration = adjust.duration.default[userLevel];
      // by gender and level
      if (
        adjust.duration &&
        adjust.duration[userGender] &&
        adjust.duration[userGender][userLevel]
      )
        skillAdjustments.duration = adjust.duration[userGender][userLevel];

      // Height
      skillAdjustments.height = adjust.height
        ? adjust.height.default.default
        : undefined;
      if (adjust.height && adjust.height.default[userLevel])
        skillAdjustments.height = adjust.height.default[userLevel];
      if (
        adjust.height &&
        adjust.height[userGender] &&
        adjust.height[userGender][userLevel]
      )
        skillAdjustments.height = adjust.height[userGender][userLevel];

      // Repetition
      skillAdjustments.repetition = adjust.repetition
        ? adjust.repetition.default.default
        : undefined;
      if (adjust.repetition && adjust.repetition.default[userLevel])
        skillAdjustments.repetition = adjust.repetition.default[userLevel];
      if (
        adjust.repetition &&
        adjust.repetition[userGender] &&
        adjust.repetition[userGender][userLevel]
      )
        skillAdjustments.repetition = adjust.repetition[userGender][userLevel];

      // Weight absolute
      skillAdjustments.weightAbsolute = adjust.weightAbsolute
        ? adjust.weightAbsolute.default.default
        : undefined;
      if (adjust.weightAbsolute && adjust.weightAbsolute.default[userLevel])
        skillAdjustments.weightAbsolute =
          adjust.weightAbsolute.default[userLevel];
      if (
        adjust.weightAbsolute &&
        adjust.weightAbsolute[userGender] &&
        adjust.weightAbsolute[userGender][userLevel]
      )
        skillAdjustments.weightAbsolute =
          adjust.weightAbsolute[userGender][userLevel];

      // Weight F max
      skillAdjustments.weightFMax = adjust.weightFMax
        ? adjust.weightFMax.default.default
        : undefined;
      if (adjust.weightFMax && adjust.weightFMax.default[userLevel])
        skillAdjustments.weightFMax = adjust.weightFMax.default[userLevel];
      if (
        adjust.weightFMax &&
        adjust.weightFMax[userGender] &&
        adjust.weightFMax[userGender][userLevel]
      )
        skillAdjustments.weightFMax = adjust.weightFMax[userGender][userLevel];

      // finally set adjustments
      adjustment = skillAdjustments;
    }
    return adjustment;
  };

  adjustExerciseValues = (
    dataInput,
    userExercise,
    exercise,
    intensity,
    userGender,
    userLevel,
    difficultyFeedback,
  ) => {
    let data = Object.assign({}, dataInput);
    // use userExerciseData and adjust
    let adjustment = this.getAdjustmentByUserData(
      intensity,
      userGender,
      userLevel,
    );

    // consider feedback TODO consider streak length
    let adjustString = "SUCCEEDED";
    if (difficultyFeedback === "TOO_HARD") adjustString = "TOO_HARD";
    if (difficultyFeedback === "TOO_EASY") adjustString = "TOO_EASY";

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
    // weight is increased after training if target value of repetitions/duration is reached
    return data;
  };

  getExerciseValues = (
    userExercise,
    exercise,
    intensity,
    userGender,
    userLevel,
    maxValues,
  ) => {
    const EQ_TYPES = getTagValues(exercise.tags, TagGroups.EQTYPE);
    let data = {
      weightType: "weightAbsolute",
    };

    // default by skill
    if (intensity) {
      // use default skill data for new exercise
      const startValue: {
        [skill: string]: {
          [gender: string]: { [level: string]: number };
        };
      } = intensity.startValue;

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

        if (
          startValue.weight &&
          startValue.weight.type &&
          startValue.weight.type.type === "weightFMax"
        ) {
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
      } = getStartValues(exercise.values, userGender, userLevel);
      let isWeightFMaxExercise =
        (exercise.values.weight &&
          exercise.values.weight.startValue &&
          exercise.values.weight.startValue.type &&
          exercise.values.weight.startValue.type.type === "weightFMax") ||
        (!exercise.values.weight.startValue.type &&
          intensity.startValue.weight &&
          intensity.startValue.weight.type &&
          intensity.startValue.weight.type.type === "weightFMax");

      if (exercise.isAdvanceByReps && startValues.repetition) {
        data.repetition = startValues.repetition; // not ternary could overwrite
      }
      if (exercise.isAdvanceByDuration && startValues.duration) {
        data.duration = startValues.duration; // not ternary could overwrite
      }
      // check for EQTYPE_ tag
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
      // weight is increased after training if target value of repetitions/duration is reached
      if (userExercise.weight) {
        data.weight = userExercise.weight;
      }
      if (
        (exercise.values.weight &&
          exercise.values.weight.startValue &&
          exercise.values.weight.startValue.type &&
          exercise.values.weight.startValue.type.type === "weightFMax") ||
        (!exercise.values.weight.startValue.type &&
          intensity.startValue.weight &&
          intensity.startValue.weight.type &&
          intensity.startValue.weight.type.type === "weightFMax")
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

  getMaxTrainingWeights = (exercise, user, userExercisesData) => {
    let userLevel = getTagValues(user.workoutData.tags, TagGroups.LEVEL)[0];
    let equipment = getTagValues(exercise.tags, TagGroups.EQUIPMENT);
    let exerciseDirections = getTagValues(
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
    let userExerciseData = userExercisesData
      ? userExercisesData[exercise.id]
      : undefined;
    let trainingWeights = [];
    let numOfSets =
      WorkoutConstants.MAX_KRAFT_WORKING_REPS_PER_USER_LEVEL[userLevel];
    let percentage = parseFloat(
      exercise.values.weight.startValue.default[userLevel.toLowerCase()],
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

  getMaxTrainingReps = (
    user,
    maxTrainingWeightsObject,
    userExercisesData,
    exercise,
    genderTag,
  ) => {
    let maxTrainingWeights = maxTrainingWeightsObject.trainingWeights;
    let inclineBenchWeightDifference =
      maxTrainingWeightsObject.inclineBenchWeightDifference;
    if (inclineBenchWeightDifference > 0) {
      maxTrainingWeights = maxTrainingWeights.map(
        (w) => w + inclineBenchWeightDifference,
      );
    }
    let userLevel = getTagValues(user.workoutData.tags, TagGroups.LEVEL)[0];
    let userAge = ageGroupFor(user.workoutData.birthday);
    let warmupTrainingReps = WorkoutConstants.MAX_KRAFT_REPETITIONS_WARMUP;
    let userExerciseData = userExercisesData
      ? userExercisesData[exercise.id]
      : undefined;
    let maximumWeightPercentage = Math.max(
      ...Object.keys(
        WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[
          userAge
        ][userLevel].HARD,
      ),
    );
    // set exercise targetValue if entered from webTool
    if (exercise.values.weight.targetValue) {
      if (exercise.values.weight.targetValue[genderTag][userLevel]) {
        maximumWeightPercentage = parseFloat(
          exercise.values.weight.targetValue[genderTag][userLevel],
        );
      } else if (exercise.values.weight.targetValue.default[userLevel]) {
        maximumWeightPercentage = parseFloat(
          exercise.values.weight.targetValue.default[userLevel],
        );
      }
    }
    let level = "EASY";
    if (userExerciseData && userExerciseData.maxFRepetitions) {
      if (userExerciseData.feedback.difficulty) {
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
    let firstMaxTrainingReps =
      userLevel === WorkoutConstants.LEVELS.PROFESSIONAL ? 3 : 4;
    let maxTrainingReps = [{ level: level, repetitions: firstMaxTrainingReps }];
    for (let w = 1; w < maxTrainingWeights.length; w++) {
      let repetitions =
        WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[
          userAge
        ][userLevel][level][maxTrainingWeights[w].toString()];
      let checkableLevel = level;
      // look for undefined repetitionLevels and if found check if other levels would not be undefined
      for (let i = 0; i < 2; i++) {
        if (typeof repetitions === "undefined") {
          if (checkableLevel === "EASY" || checkableLevel === "HARD") {
            checkableLevel = "MEDIUM";
          } else if (checkableLevel === "MEDIUM") {
            checkableLevel = "HARD";
          }
          repetitions =
            WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[
              userAge
            ][userLevel][checkableLevel][maxTrainingWeights[w].toString()];
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
    let trainingReps = warmupTrainingReps.concat(maxTrainingReps);
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
    ["BRUST"],
    ["OBERSCHENKELVORDERSEITE"],
    ["GERADE_BAUCHMUSKELN"],
    ["SCHULTER"],
  ];
  const antagonists = [
    ["GROSSER_RUECKENMUSKEL_LAT", "NACKEN", "OBERER_RUECKEN"],
    ["GESAESS"],
    ["UNTERER_RUECKEN"],
    ["GROSSER_RUECKENMUSKEL_LAT"],
  ];
  const agonistsPrio2 = [
    ["BIZEPS"],
    ["HANDGELENKSSTRECKER"],
    ["SCHULTER_VORNE"],
    ["WADE"],
    ["INNERER_OBERSCHENKEL"],
    ["SCHULTERBLATT_FIXIEREND_FRONT"],
    ["HUEFT_AUSSEN_ROTATOR"],
    ["NACKEN_VORNE"],
  ];
  const antagonistsPrio2 = [
    ["ARMSTRECKER"],
    ["HANDGELENKSBEUGER"],
    ["SCHULTER_HINTEN"],
    ["SPRUNGGELENK", "SCHIENBEIN"],
    ["AEUSSERER_OBERSCHENKEL"],
    ["SCHULTERBLATT_FIXIEREND_HINTEN"],
    ["HUEFT_INNEN_ROTATOR"],
    ["NACKEN_HINTEN"],
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
  exercises: { branchTags: string[]; exerciseId: number }[],
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

const filterByUserLevel = (
  branches,
  user: UserType,
  exercises: ExerciseType[],
  userBranchData,
) => {
  if (!user || !user.workoutData) {
    return { keep: branches, replace: [] };
  }
  const userLevelTags = getTagValues(user.workoutData.tags, TagGroups.LEVEL);
  const userLevel = userLevelTags[0] || WorkoutConstants.LEVELS.BEGINNER;
  const keep = {};
  let replace: string[] = [];

  for (const id in branches) {
    if (!branches.hasOwnProperty(id)) continue;
    const branchData = branches[id];
    const levelSource = branchData.exercises
      ? branchData.exercises
      : branchData.levels;
    const exercise = getUserExerciseFromBranch(
      { tags: branchData.tags, levels: levelSource },
      userLevel,
      exercises,
      userBranchData && userBranchData[id] ? userBranchData[id] : null,
    );
    if (exercise === null) {
      const exerciseRegions = getTagValues(branchData.tags, TagGroups.REGION);
      replace = replace.concat(exerciseRegions);
    } else {
      keep[id] = branchData;
    }
  }

  return { keep, replace };
};

const getValueByGenderAndLevel = (data, gender: string, level: string) => {
  let result;
  if (data) {
    if (data.default) {
      if (data.default.default) result = +data.default.default;
      if (data.default[level]) result = +data.default[level];
    }
    if (data[gender]) {
      if (data[gender].default) result = +data[gender].default;
      if (data[gender][level]) result = +data[gender][level];
    }
  }
  return result;
};

const getStartValues = (data, gender: string, level: string) => {
  const result = {};
  WorkoutConstants.VALUE_TYPE_NAMES.forEach((valueName) => {
    if (data[valueName] && data[valueName].startValue) {
      result[valueName] = getValueByGenderAndLevel(
        data[valueName].startValue,
        gender,
        level,
      );
    }
  });
  return result;
};

const getIntensityBySkill = (skill: string) => {
  switch (skill) {
    case "SWR1":
    case "SWR1KG":
    case "SWR2":
      return IntensitySWR2;
    case "SWR2KG":
      return IntensitySWR2KG;
    case "CARDIO_3":
      return IntensityCARDIO3;
    case "CARDIO_2":
      return IntensityCARDIO2;
    case "CARDIO_1_LAKTAT":
      return IntensityCARDIO1LAKTAT;
    case "CARDIO_1_SHORT":
      return IntensityCARDIO1SHORT;
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
      return IntensitySAKG;
    case "SK":
      return IntensitySK;
    case "SKKG":
      return IntensitySKKG;
    case "MAX":
    case "MAX_KRAFT":
      return IntensityDEFAULT;
    default:
      return IntensityDEFAULTKG;
  }
};
