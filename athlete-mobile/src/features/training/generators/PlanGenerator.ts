//@ts-nocheck
import { TagGroups } from "@/constants/tagGroups";
import {
  WorkoutConstants,
  type AgeGroupTag,
  type LevelTag,
  type PlaceType,
  type SectionTypes,
} from "@/constants/workoutConstants";
import { type UserType } from "@/features/profile/models/User";
import { type ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import { type SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { type TrainingDayType } from "@/features/training/models/TrainingDay";
import { type TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { type TrainingSectionType } from "@/features/training/models/TrainingSection";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type SkillTreeType } from "@/schemas/skillTree.schema";
import { type BranchDataMapType } from "@/store/exerciseProgressStore";
import { type PlacesState } from "@/store/placesStore";

// Utility functions
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import {
  equipmentExists,
  hasRunEquipment,
  hasWeights,
} from "@/features/training/utils/equipmentUtils";
import {
  getBlocksFromPains,
  getPreventionsFromPains,
} from "@/features/training/utils/painUtils";
import {
  getBranchIdsByNames,
  getNextTypeFiltered,
  getSkillTree,
  getUserExerciseFromBranch,
} from "@/features/training/utils/skillTreeUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import {
  DirectionsMapSchema,
  ExerciseBranchArraySchema,
  ExerciseBranchEntrySchema,
  FallbackSectionSchema,
  PlanStructureSchema,
  SkillPrioritiesSchema,
  SkillsMapSchema,
  TrainingSectionsMapSchema,
  WorkoutArraySchema,
  type DirectionsMap,
} from "@/schemas/generator.schema";
import { cloneWithValidation } from "@/utils/cloneWithValidation";
import { dateToDDMMYYYY, DDMMYYYYToDate } from "@/utils/date";
import { getTagValues } from "@/utils/tagUtils";

// Assets
import SkillPriorities from "../../../../assets/data/generator/SkillPriorities";
// Training Sections
// - Pause
// - - Child
import TrainingSectionsPauseChildAdvanced from "../../../../assets/data/generator/trainingSections/pause/child/advanced";
import TrainingSectionsPauseChildBeginner from "../../../../assets/data/generator/trainingSections/pause/child/beginner";
import TrainingSectionsPauseChildProfessional from "../../../../assets/data/generator/trainingSections/pause/child/professional";
// - - Adult
import TrainingSectionsPauseAdultAdvanced from "../../../../assets/data/generator/trainingSections/pause/adult/advanced";
import TrainingSectionsPauseAdultBeginner from "../../../../assets/data/generator/trainingSections/pause/adult/beginner";
import TrainingSectionsPauseAdultProfessional from "../../../../assets/data/generator/trainingSections/pause/adult/professional";
// - Prepatory
// - - Child
import TrainingSectionsPrepatoryChildAdvanced from "../../../../assets/data/generator/trainingSections/prepatory/child/advanced";
import TrainingSectionsPrepatoryChildBeginner from "../../../../assets/data/generator/trainingSections/prepatory/child/beginner";
import TrainingSectionsPrepatoryChildProfessional from "../../../../assets/data/generator/trainingSections/prepatory/child/professional";
// - - Adult
import TrainingSectionsPrepatoryAdultAdvanced from "../../../../assets/data/generator/trainingSections/prepatory/adult/advanced";
import TrainingSectionsPrepatoryAdultBeginner from "../../../../assets/data/generator/trainingSections/prepatory/adult/beginner";
import TrainingSectionsPrepatoryAdultProfessional from "../../../../assets/data/generator/trainingSections/prepatory/adult/professional";
// - Competition
// - - Child
import TrainingSectionsCompetitionChildAdvanced from "../../../../assets/data/generator/trainingSections/competition/child/advanced";
import TrainingSectionsCompetitionChildBeginner from "../../../../assets/data/generator/trainingSections/competition/child/beginner";
import TrainingSectionsCompetitionChildProfessional from "../../../../assets/data/generator/trainingSections/competition/child/professional";
// - - Adult
import TrainingSectionsCompetitionAdultAdvanced from "../../../../assets/data/generator/trainingSections/competition/adult/advanced";
import TrainingSectionsCompetitionAdultBeginner from "../../../../assets/data/generator/trainingSections/competition/adult/beginner";
import TrainingSectionsCompetitionAdultProfessional from "../../../../assets/data/generator/trainingSections/competition/adult/professional";
// END Training Sections

// Regions
import RegionBAS from "../../../../assets/data/generator/regions/BAS";
import RegionBR from "../../../../assets/data/generator/regions/BR";
import RegionCARDIO from "../../../../assets/data/generator/regions/CARDIO";
import RegionCD from "../../../../assets/data/generator/regions/CD";
import RegionGKS from "../../../../assets/data/generator/regions/GKS";
import RegionMAX from "../../../../assets/data/generator/regions/MAX";
import RegionMOB from "../../../../assets/data/generator/regions/MOB";
import RegionPREVANKLE from "../../../../assets/data/generator/regions/PREVANKLE";
import RegionPREVKNEE from "../../../../assets/data/generator/regions/PREVKNEE";
import RegionPREVSHOULDER from "../../../../assets/data/generator/regions/PREVSHOULDER";
import RegionPREVSPINE from "../../../../assets/data/generator/regions/PREVSPINE";
import RegionPREVWRIST from "../../../../assets/data/generator/regions/PREVWRIST";
import RegionSA from "../../../../assets/data/generator/regions/SA";
import RegionSAKG from "../../../../assets/data/generator/regions/SAKG";
import RegionSK from "../../../../assets/data/generator/regions/SK";
import RegionSKKG from "../../../../assets/data/generator/regions/SKKG";
import RegionSWR1 from "../../../../assets/data/generator/regions/SWR1";
import RegionSWR1KG from "../../../../assets/data/generator/regions/SWR1KG";
import RegionSWR2 from "../../../../assets/data/generator/regions/SWR2";
import RegionSWR2KG from "../../../../assets/data/generator/regions/SWR2KG";
import RegionWU from "../../../../assets/data/generator/regions/WU";
import RegionWUSKSA from "../../../../assets/data/generator/regions/WUSKSA";
import RegionWUSPEZIAL from "../../../../assets/data/generator/regions/WUSPEZIAL";

// Max time
import MaxTimeBAS from "../../../../assets/data/generator/maxTime/BAS";
import MaxTimeCARDIO from "../../../../assets/data/generator/maxTime/CARDIO";
import MaxTimeDEFAULT from "../../../../assets/data/generator/maxTime/DEFAULT";
import MaxTimeGKS from "../../../../assets/data/generator/maxTime/GKS";
import MaxTimeHBCARDIO from "../../../../assets/data/generator/maxTime/HBCARDIO";
import MaxTimeMAX from "../../../../assets/data/generator/maxTime/MAX";
import MaxTimePREV from "../../../../assets/data/generator/maxTime/PREV";
import MaxTimeSA from "../../../../assets/data/generator/maxTime/SA";
import MaxTimeSK from "../../../../assets/data/generator/maxTime/SK";
import MaxTimeSWR from "../../../../assets/data/generator/maxTime/SWR";
import MaxTimeWUSPEZIAL from "../../../../assets/data/generator/maxTime/WUSPEZIAL";

// Directions

import DirectionGANZKOERPER from "../../../../assets/data/generator/directions/GANZKOERPER";
import DirectionOBERKOERPER from "../../../../assets/data/generator/directions/OBERKOERPER";
import DirectionRUMPF from "../../../../assets/data/generator/directions/RUMPF";
import DirectionUNTERKOERPER from "../../../../assets/data/generator/directions/UNTERKOERPER";
import DirectionUNTERKOERPER_GKS from "../../../../assets/data/generator/directions/UNTERKOERPER_GKS";

export default class PlanGenerator {
  static DEBUG = false;

  static generatePlan = (
    user,
    exercisesList,
    skillTrees,
    exerciseBranchData,
    userTrainingDays,
    places,
    startDate,
  ) => {
    if (PlanGenerator.DEBUG) console.log("GENERATE for user: ", user);
    // initialize relevant user workout data
    const workoutData = user.workoutData;
    const dateOfBirth = workoutData.birthday;
    let ageGroup = ageGroupFor(dateOfBirth);
    if (PlanGenerator.DEBUG) console.log("AgeGroup: ", ageGroup);
    let level = getUserLevel(user);
    if (
      level === WorkoutConstants.LEVELS.PROFESSIONAL &&
      ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
    ) {
      // no professional childs => reset to advanced
      level = WorkoutConstants.LEVELS.ADVANCED;
    }
    if (PlanGenerator.DEBUG) console.log("Level: ", level);
    const position = getTagValues(workoutData.tags, TagGroups.POSITION)[0]; // there should always be just one POSITION tag
    if (PlanGenerator.DEBUG) console.log("Position: ", position);
    const seasonPhase = workoutData.seasonPhase;
    if (PlanGenerator.DEBUG) console.log("SeasonPhase: ", seasonPhase);
    const pains: string[] = getTagValues(workoutData.tags, TagGroups.PAIN);

    let hasPain: boolean = pains.length > 0 ? true : false;

    const prevention: string[] = getPreventionsFromPains(pains);

    if (PlanGenerator.DEBUG) console.log("Prevention: ", prevention);

    //phase depending on location -> one trainingPlan for each trainingDay
    let hasWeightsAvailable = false;
    let trainingDays = [];
    for (let index = 0; index < userTrainingDays.length; index++) {
      let entry: TrainingDayType = Object.assign({}, userTrainingDays[index]);
      if (entry.active) {
        let place: PlaceType = places[entry.place];
        if (place && !hasWeightsAvailable)
          hasWeightsAvailable = hasWeights(place.equipment);
        entry.weekday = index;
        trainingDays.push(entry);
      }
    }
    if (PlanGenerator.DEBUG) {
      console.log("TrainingDays: ", trainingDays);
      console.log("Has weights: ", hasWeightsAvailable);
    }

    //create new training plan
    let trainingPlan: TrainingPlanType = this.initializeTrainingPlan(
      seasonPhase,
      ageGroup,
      position,
      level,
      hasWeightsAvailable,
      startDate,
      true, // treat all as GK till SA is fixed
      // position === "GOAL"
    );
    if (PlanGenerator.DEBUG) console.log("InitializedPlan: ", trainingPlan);

    //for every trainingPlan section for all the user's training(day)s
    for (let i = 0; i < trainingPlan.sections.length; i++) {
      const section = trainingPlan.sections[i];
      trainingPlan.sections[i] = this.createSection(
        section,
        userTrainingDays,
        places,
        seasonPhase,
        user,
        hasPain,
        ageGroup,
        level,
        prevention,
        exercisesList,
        skillTrees,
        exerciseBranchData,
      );
    }
    if (PlanGenerator.DEBUG) console.log("Final TrainingPlan: ", trainingPlan);

    return trainingPlan;
  };

  /**
   * Populates a training section with individual training days.
   * Groups active training days, assigns skill focuses and durations,
   * then selects exercises for each skill based on user profile and equipment.
   */
  static createSection = (
    sec: TrainingSectionType,
    userTrainingDays: TrainingDayType[],
    places: PlacesState,
    seasonPhase: SeasonPhaseType,
    user: UserType,
    hasPain: boolean,
    ageGroup: AgeGroupTag,
    level: LevelTag,
    prevention: string[],
    exercisesList: ExerciseType[],
    skillTrees: Record<string, SkillTreeType>,
    exerciseBranchData: BranchDataMapType,
  ): TrainingSectionType => {
    const skillPriorities = cloneWithValidation(
      SkillPriorities,
      SkillPrioritiesSchema,
      "SkillPriorities",
    ); // Do not write in imported file!
    sec.trainings = [];
    const section = sec.type;
    const cardioType = sec.cardioType;

    // build training days
    // get days in groups
    let trainingDayGroups = this.getTrainingDayGroups(userTrainingDays);

    let groupFocuses = this.getTrainingDayGroupsFocuses(
      trainingDayGroups,
      ageGroup,
      places,
    );
    // setup list of preventions to train
    let preventionsIndex = 0;

    // build training days by group
    for (
      let groupIndex = 0;
      groupIndex < trainingDayGroups.length;
      groupIndex++
    ) {
      // get group data
      const groupFocus = groupFocuses[groupIndex];
      const groupTrainingDays = trainingDayGroups[groupIndex];

      const planStructures = Object.assign(
        {},
        skillPriorities[
          ageGroup === WorkoutConstants.AGE_GROUPS.CHILD ? "CHILD" : "ADULT"
        ][hasPain ? "pain" : "noPain"],
      );
      if (PlanGenerator.DEBUG)
        console.log(
          "Section: PlanStructures: ",
          JSON.parse(JSON.stringify(planStructures)),
        );

      // build training days
      for (let trDay = 0; trDay < groupTrainingDays.length; trDay++) {
        // get training day data
        const day = groupTrainingDays[trDay];
        const trainingFocus = groupFocus[trDay];
        const place = day.place as PlaceType;
        const duration = day.duration;
        const equipment = places[place as keyof PlacesState].equipment;
        const structure =
          trainingFocus === "PHASE"
            ? "phase"
            : trainingFocus === "CARDIO"
              ? "cardio"
              : trainingFocus === "COMBINED"
                ? "combined"
                : "stability";
        const skills = Object.assign({}, planStructures[structure]);

        if (PlanGenerator.DEBUG)
          console.log(
            "Section: Group " +
              groupIndex +
              ", Training " +
              trDay +
              ", with focus " +
              trainingFocus +
              ", Skills:",
            JSON.parse(JSON.stringify(skills)),
          );

        //returns object of prioritized lists of skills to use for exercises up until duration = prop of next entry
        //e.g. { '0': [ 'SWR1', 'PREV', 'MOB' ],
        //      '30': [ 'HBCARDIO' ],
        //      '45': [ 'WU' ],
        //      '60': [ 'CD' ] }
        const skillTrainingplan = Object.assign(
          {},
          this.getSkillTrainingplan(
            section,
            cardioType,
            { ...cloneWithValidation(skills, SkillsMapSchema, "skills") },
            equipment,
          ),
        );
        if (PlanGenerator.DEBUG)
          console.log(
            "Section: Group " +
              groupIndex +
              ", Training " +
              trDay +
              ", weekday " +
              day.weekday +
              ", Priorities:",
            JSON.parse(JSON.stringify(skillTrainingplan)),
          );

        let fillPriorities: string[] = [];

        //skillTrainingplan sorted keys to ensure properties = lengths can be processed in ascending order
        const skillsForDuration = Object.keys(skillTrainingplan).sort(
          (a, b) => +a - +b,
        );
        let prevDurationKey: number | null = null;
        const tagsPerSkill: Record<
          string,
          { tags: string[]; count: number }[]
        > = {};
        let timePerSkill: Record<string, number> = {};

        if (PlanGenerator.DEBUG) {
          console.log(
            "Section: Group " +
              groupIndex +
              ", Training " +
              trDay +
              ", Duration",
            duration,
          );
          console.log(
            "Section: Group " +
              groupIndex +
              ", Training " +
              trDay +
              ", SkillsForDuration",
            skillsForDuration,
          );
        }
        let fillPrioritiesHandledIndex = -1;
        let prevSkill: string | null = null;

        //calculate time per skill, iterate over array of sorted keys for right order
        for (let durationForBlock of skillsForDuration) {
          fillPriorities.push(...skillTrainingplan[durationForBlock]);
          fillPriorities.forEach((item, ind, arr) => {
            if (item !== null && ind > fillPrioritiesHandledIndex) {
              // check if is not yet replaced prev skill
              // check if null to set only one skill per day
              if (
                prevSkill === null &&
                [
                  "PREV",
                  "PREV1",
                  "PREV2",
                  "PREV3",
                  "PREV4",
                  "WUSPEZIAL",
                ].indexOf(item) > -1
              ) {
                // get prev to use
                prevSkill = prevention[preventionsIndex];
                preventionsIndex++;
                if (preventionsIndex >= prevention.length) {
                  preventionsIndex = 0;
                }
              }
              const replacedSkill = this.replaceUserSpecificSkill(
                item,
                ageGroup,
                prevSkill,
              );
              if (replacedSkill !== null) {
                arr[ind] = replacedSkill;
              }
              if (ind > fillPrioritiesHandledIndex) {
                fillPrioritiesHandledIndex = ind;
              }
            }
          });
          // change to specific prev
          skillTrainingplan[durationForBlock] = skillTrainingplan[
            durationForBlock
          ]
            .map((skill) => {
              return this.replaceUserSpecificSkill(skill, ageGroup, prevSkill);
            })
            .filter((skill): skill is string => skill !== null);
          // filter skills removed by replace fn
          fillPriorities = fillPriorities.filter((e) => e !== null);
          if (PlanGenerator.DEBUG) {
            console.log(
              "Section: Group " +
                groupIndex +
                ", Training " +
                trDay +
                ", FillPriorities",
              JSON.parse(JSON.stringify(fillPriorities)),
            );
          }
          if (prevDurationKey !== null && duration >= prevDurationKey) {
            //work with previous entry, because durationForBlock always means "for the time after the current value until the next entry"
            let block = skillTrainingplan[String(prevDurationKey)];
            let blockDuration;
            if (+durationForBlock >= duration) {
              blockDuration = duration - prevDurationKey;
            } else {
              blockDuration = +durationForBlock - prevDurationKey;
            }
            if (blockDuration > 0) {
              let minDurs = this.getMinimumDurationsForBlock(
                block,
                prevention,
                seasonPhase.type?.toLowerCase() ?? "pause",
                ageGroup,
                level,
              );

              Object.assign(timePerSkill, minDurs);

              // extra handling for last set
              if (
                durationForBlock ===
                skillsForDuration[skillsForDuration.length - 1]
              ) {
                if (duration > +durationForBlock) {
                  let block = skillTrainingplan[durationForBlock];
                  let minDurs = this.getMinimumDurationsForBlock(
                    block,
                    prevention,
                    seasonPhase.type?.toLowerCase() ?? "pause",
                    ageGroup,
                    level,
                  );
                  Object.assign(timePerSkill, minDurs);
                }
              }

              if (PlanGenerator.DEBUG)
                console.log(
                  "Section: Group " +
                    groupIndex +
                    ", Training " +
                    trDay +
                    ", TimePerSkill",
                  JSON.parse(JSON.stringify(timePerSkill)),
                );
            }
          }
          prevDurationKey = +durationForBlock;
        }
        let trainingDuration = Object.keys(timePerSkill).reduce((acc, key) => {
          return acc + timePerSkill[key];
        }, 0);

        let timeLeft = duration - trainingDuration;
        if (timeLeft > 0) {
          timePerSkill = this.addTimeLeftToSkills(
            timePerSkill,
            fillPriorities,
            timeLeft,
            level,
            duration,
          );
        }
        if (PlanGenerator.DEBUG)
          console.log(
            "Section: Group " +
              groupIndex +
              ", Training " +
              trDay +
              ", Duration",
            duration,
          );

        let time;
        let remainingTime = 0;
        for (let skill of fillPriorities) {
          // time info available for skill
          if (skill !== "" && typeof timePerSkill[skill] !== "undefined") {
            let tagObj = this.getTagsForSkill(skill, ageGroup, level);

            //get tags per skill and time
            time = timePerSkill[skill];
            time += remainingTime || 0;
            remainingTime = 0;

            let minDuration = Math.min(...Object.keys(tagObj).map(Number)); // get first entry i.e. the one with lowest key
            let maxDuration = Math.max(...Object.keys(tagObj).map(Number));
            if (PlanGenerator.DEBUG) {
              console.log(
                "Section: Group " +
                  groupIndex +
                  ", Training " +
                  trDay +
                  ", Skill " +
                  skill +
                  " - Time: ",
                time,
              );
              console.log(
                "Section: Group " +
                  groupIndex +
                  ", Training " +
                  trDay +
                  ", Skill " +
                  skill +
                  " - MinDuration: ",
                minDuration,
              );
              console.log(
                "Section: Group " +
                  groupIndex +
                  ", Training " +
                  trDay +
                  ", Skill " +
                  skill +
                  " - MaxDuration: ",
                maxDuration,
              );
            }
            if (time < minDuration) {
              if (PlanGenerator.DEBUG) {
                console.error(
                  "NO TRAINING POSSIBLE FOR " +
                    skill +
                    " WITH GIVEN TIME " +
                    time +
                    " using " +
                    minDuration,
                );
              }
              // use min dur at least
              time = minDuration;
            } else if (time > maxDuration) {
              if (fillPriorities.indexOf(skill) === fillPriorities.length - 1) {
                if (PlanGenerator.DEBUG) {
                  console.error(
                    "Can only train last skill " +
                      skill +
                      " for max " +
                      maxDuration.toString() +
                      " mins, shortening training by " +
                      (time - maxDuration).toString() +
                      " mins",
                  );
                }
              }
              time = maxDuration;
              remainingTime = time - maxDuration;
            }

            // get matching or closets set of regions
            let keyToUse: number | string = Object.keys(tagObj).reduce(
              (acc: number, e) => {
                // find smallest key
                if (acc === -1) return +e;
                if (+e < acc) return +e;
                return acc;
              },
              -1,
            );

            if (tagObj[time]) {
              keyToUse = time;
            } else {
              let diff = -1;
              for (let key in tagObj) {
                if (diff === -1 || Math.abs(+key - time) < diff) {
                  keyToUse = key;
                  diff = Math.abs(+key - time);
                }
              }
            }
            if (PlanGenerator.DEBUG) {
              console.log(
                "use tags for skill " + skill + " and time " + keyToUse,
                tagObj[keyToUse],
              );
            }
            tagsPerSkill[skill] = tagObj[keyToUse];
          }
        }

        if (PlanGenerator.DEBUG)
          console.log(
            "Section: Group " +
              groupIndex +
              ", Training " +
              trDay +
              ", TagsPerSkill",
            tagsPerSkill,
          );

        const exercises: Record<string, ExerciseBranchType[]> = {};

        const oberkoerperDirections = cloneWithValidation(
          DirectionOBERKOERPER,
          DirectionsMapSchema,
          "DirectionOBERKOERPER",
        );
        // "FRONT" will be added as pair with "BACK" while for side and rotation there will always be two
        const rumpfDirections = cloneWithValidation(
          DirectionRUMPF,
          DirectionsMapSchema,
          "DirectionRUMPF",
        );
        const ganzkoerperDirections = cloneWithValidation(
          DirectionGANZKOERPER,
          DirectionsMapSchema,
          "DirectionGANZKOERPER",
        );
        let unterkoerperDirections = cloneWithValidation(
          DirectionUNTERKOERPER,
          DirectionsMapSchema,
          "DirectionUNTERKOERPER",
        );
        if (
          Object.keys(tagsPerSkill).includes("GKS") &&
          tagsPerSkill["GKS"].reduce((result, entry) => {
            // result is already true, or REGION_GANZKOERPER is part of skill tags
            return result || entry.tags.includes("REGION_GANZKOERPER");
          }, false)
        ) {
          if (PlanGenerator.DEBUG) {
            console.log(
              "use gks lower body directions with",
              tagsPerSkill["GKS"],
            );
          }
          unterkoerperDirections = cloneWithValidation(
            DirectionUNTERKOERPER_GKS,
            DirectionsMapSchema,
            "DirectionUNTERKOERPER_GKS",
          );
        }

        let prevSkills = Object.keys(tagsPerSkill).filter(
          (s) => s.indexOf("PREV") > -1,
        );
        let branchIdsInUse: string[] = [];
        for (let skill in tagsPerSkill) {
          //DEV set to false if not needed
          const LOG = false && skill.indexOf("SWR1") > -1;
          if (LOG) console.log("tagsPerSkill", tagsPerSkill[skill]);
          exercises[skill] = cloneWithValidation(
            this.chooseByTags(
              skill,
              tagsPerSkill[skill],
              oberkoerperDirections,
              unterkoerperDirections,
              ganzkoerperDirections,
              rumpfDirections,
              equipment,
              user,
              place,
              exercisesList,
              skillTrees,
              prevSkills,
              exerciseBranchData,
              branchIdsInUse,
              LOG,
            ),
            ExerciseBranchArraySchema,
            "exercises[skill]",
          );
          if (LOG) console.log("exercises[skill]", exercises[skill]);
          if (exercises[skill].length === 0) {
            // remove skills without content
            delete exercises[skill];
          } else {
            for (let e = 0; e < exercises[skill].length; e++) {
              branchIdsInUse.push(exercises[skill][e].exerciseBranchId);
            }
          }
        }

        sec.trainings.push({
          weekday: day.weekday,
          skills: exercises,
          lengths: timePerSkill,
          focus: trainingFocus,
        });

        if (PlanGenerator.DEBUG)
          console.log(
            "Section: Day " + trDay + " - Training: ",
            sec.trainings[sec.trainings.length - 1],
          );
      }
    }
    if (PlanGenerator.DEBUG) console.log("Section: ", sec);
    return sec;
  };

  static getTrainingDayGroups = (userTrainingDays) => {
    let trainingDayGroups = [];
    let firstDayOff = 0;
    for (let d1 = 0; d1 < userTrainingDays.length; d1++) {
      if (!userTrainingDays[d1].active) {
        firstDayOff = d1;
        break;
      }
    }
    let group = [];
    for (let d2 = 0; d2 < 7; d2++) {
      const currDay = (firstDayOff + d2) % 7;
      if (userTrainingDays[currDay].active) {
        // add to group
        group.push(userTrainingDays[currDay]);
      } else if (group.length > 0) {
        // save and close group
        trainingDayGroups.push(group);
        group = [];
      }
    }
    //save last group
    if (group.length > 0) {
      // save and close group
      trainingDayGroups.push(group);
    }
    return trainingDayGroups;
  };

  static getTrainingDayGroupsFocuses = (
    trainingDayGroups,
    ageGroup,
    places,
  ) => {
    let groupFocuses = [];
    let hasCardio = false;
    const numOfTrainingDays = trainingDayGroups.reduce((acc, group) => {
      return acc + group.length;
    }, 0);

    // get focuses for training day groups
    for (
      let groupIndex = 0;
      groupIndex < trainingDayGroups.length;
      groupIndex++
    ) {
      //set focus for days
      let focuses = this.getFocusForTrainingDayGroup(
        trainingDayGroups[groupIndex],
        ageGroup,
        places,
      );
      if (focuses.indexOf("CARDIO") > -1) hasCardio = true;
      groupFocuses.push(focuses);
    }

    if (
      !hasCardio &&
      numOfTrainingDays > 1 &&
      ageGroup !== WorkoutConstants.AGE_GROUPS.CHILD
    ) {
      if (PlanGenerator.DEBUG)
        console.log("No CARDIO set so try to change longest PHASE to COMBINED");
      let numOfPhaseTrainings = 0;

      // make longest PHASE training a combined (Logik Nr.6)
      let groupToAdjustCardio = -1;
      let trainingToAdjustCardio = -1;
      let groupToAdjust = -1;
      let trainingToAdjust = -1;
      let trainingToAdjustHasWeights = false;
      for (let groupIndex = 0; groupIndex < groupFocuses.length; groupIndex++) {
        for (
          let trainingIndex = 0;
          trainingIndex < groupFocuses[groupIndex].length;
          trainingIndex++
        ) {
          if (groupFocuses[groupIndex][trainingIndex] === "PHASE") {
            numOfPhaseTrainings++;
          }
          // check for cardio
          if (
            groupFocuses[groupIndex][trainingIndex] === "PHASE" &&
            (trainingDayGroups[groupIndex][trainingIndex].place !== "HOME" ||
              hasRunEquipment(places["HOME"].equipment))
          ) {
            // valid
            if (groupToAdjustCardio === -1) {
              // is first valid option
              groupToAdjustCardio = groupIndex;
              trainingToAdjustCardio = trainingIndex;
              trainingToAdjustHasWeights = hasWeights(
                places[trainingDayGroups[groupIndex][trainingIndex].place]
                  .equipment,
              );
            } else {
              if (
                trainingToAdjustHasWeights &&
                !hasWeights(
                  places[trainingDayGroups[groupIndex][trainingIndex].place]
                    .equipment,
                )
              ) {
                // this training has no weights so better use it instead of the day with weights
                groupToAdjustCardio = groupIndex;
                trainingToAdjustCardio = trainingIndex;
                trainingToAdjustHasWeights = false;
              } else if (
                trainingDayGroups[groupIndex][trainingIndex].duration <
                trainingDayGroups[groupToAdjustCardio][trainingToAdjustCardio]
                  .duration
              ) {
                // no place selection find shortest training to use for cardio
                groupToAdjustCardio = groupIndex;
                trainingToAdjustCardio = trainingIndex;
                trainingToAdjustHasWeights = hasWeights(
                  places[trainingDayGroups[groupIndex][trainingIndex].place]
                    .equipment,
                );
              }
            }
          }
          // check for combined
          if (
            groupFocuses[groupIndex][trainingIndex] === "PHASE" &&
            (trainingDayGroups[groupIndex][trainingIndex].place !== "HOME" ||
              hasRunEquipment(places["HOME"].equipment)) &&
            trainingDayGroups[groupIndex][trainingIndex].duration >= 45
          ) {
            // valid for combined if is phase training with run eq and more than 45 minutes
            if (
              groupToAdjust === -1 ||
              trainingDayGroups[groupIndex][trainingIndex].duration >
                trainingDayGroups[groupToAdjust][trainingToAdjust].duration ||
              (trainingToAdjustHasWeights &&
                !hasWeights(
                  places[trainingDayGroups[groupIndex][trainingIndex].place]
                    .equipment,
                ))
            ) {
              groupToAdjust = groupIndex;
              trainingToAdjust = trainingIndex;
            }
          }
        }
      }

      if (
        groupToAdjustCardio > -1 &&
        trainingToAdjustCardio > -1 &&
        numOfPhaseTrainings > 1
      ) {
        // change to cardio
        groupFocuses[groupToAdjustCardio][trainingToAdjustCardio] = "CARDIO";
      } else if (groupToAdjust > -1 && trainingToAdjust > -1) {
        // change to combined
        groupFocuses[groupToAdjust][trainingToAdjust] = "COMBINED";
      } else {
        if (PlanGenerator.DEBUG)
          console.log(
            "Could not adjust PHASE training to be COMBINED with indices group:",
            groupToAdjust,
            "training:",
            trainingToAdjust,
          );
      }
    }
    if (PlanGenerator.DEBUG) console.log("Group focuses: ", groupFocuses);
    return groupFocuses;
  };

  static addTimeLeftToSkills = (
    timePerSkill,
    fillPriorities,
    time,
    level,
    trainingDuration,
  ) => {
    let result = Object.assign({}, timePerSkill);
    let timeLeft = time;
    if (trainingDuration > 45) {
      // fill up prio 2 to max
      if (fillPriorities[1] && result[fillPriorities[1]] > 0) {
        let skill = fillPriorities[1];
        let maxPossible = this.getMaxTimeForSkillAndLevel(skill, level);
        let maxAdd = maxPossible - result[skill];
        let timeToAdd = Math.min(timeLeft, maxAdd);
        result[skill] += timeToAdd;
        timeLeft -= timeToAdd;
      }
    }
    //if (trainingDuration >= 60) {
    //fill up from prio 1 to end
    for (
      let fillPrio = 0;
      fillPrio < fillPriorities.length && timeLeft > 0;
      fillPrio++
    ) {
      let skill = fillPriorities[fillPrio];
      let maxPossible = this.getMaxTimeForSkillAndLevel(skill, level);
      let maxAdd = maxPossible - result[skill];
      let timeToAdd = Math.min(timeLeft, maxAdd);
      result[skill] += timeToAdd;
      timeLeft -= timeToAdd;
    }
    //}
    // at the end try to fill up prio 1
    /*
        if (timeLeft > 0) {
            let skill = fillPriorities[0];
            let maxPossible = this.getMaxTimeForSkillAndLevel(skill, level);
            let maxAdd = maxPossible - result[skill];
            let timeToAdd = Math.min(timeLeft, maxAdd);
            result[skill] += timeToAdd;
            timeLeft -= timeToAdd;
        }
        */
    if (PlanGenerator.DEBUG) {
      console.log(
        "COULDN'T USE ALL TIME LEFT: " + timeLeft + " mins remain on skills ",
        timePerSkill,
      );
    }
    return result;
  };

  static getMaxTimeForSkillAndLevel = (skill, level) => {
    let maxTimeObj;
    switch (skill) {
      case "BAS":
        maxTimeObj = MaxTimeBAS;
        break;
      case "CARDIO_4":
      case "CARDIO_5":
        maxTimeObj = MaxTimeCARDIO;
        break;
      case "GKS":
        maxTimeObj = MaxTimeGKS;
        break;
      case "CARDIO_1_SHORT":
      case "CARDIO_1_LAKTAT":
      case "CARDIO_2":
      case "CARDIO_3":
        maxTimeObj = MaxTimeHBCARDIO;
        break;
      case "MAX":
      case "MAX_KRAFT":
        maxTimeObj = MaxTimeMAX;
        break;
      case "PREV":
        maxTimeObj = MaxTimePREV;
        break;
      case "SA":
      case "SAKG":
        maxTimeObj = MaxTimeSA;
        break;
      case "SK":
      case "SKKG":
        maxTimeObj = MaxTimeSK;
        break;
      case "SWR1":
      case "SWR1KG":
      case "SWR2":
      case "SWR2KG":
        maxTimeObj = MaxTimeSWR;
        break;
      case "WUSPEZIAL":
        maxTimeObj = MaxTimeWUSPEZIAL;
        break;
      default:
        maxTimeObj = MaxTimeDEFAULT;
        break;
    }
    let maxTime = 200; // better default here? Should never be used
    if (maxTimeObj[level]) maxTime = maxTimeObj[level];
    return maxTime;
  };

  static getStudioPreferencePlans = (planStructures, activeTrainingDays) => {
    let daysInRow = 1;
    for (let i = 0; i < activeTrainingDays.length; i++) {
      const weekday = activeTrainingDays[i].weekday;
      // get weekdays next to this one
      const adjacentWeekdays = [(weekday + 6) % 7, (weekday + 1) % 7]; // +6 instead of -1 beacuse (0-1)%7=-1, (0+6)%7=6
      // get trainings on adjacent days
      let adjacentTrainings = activeTrainingDays.filter((entry) => {
        return adjacentWeekdays.indexOf(entry.weekday) > -1;
      });
      // number of trainings in a row is adjacent trainings + this training
      if (adjacentTrainings.length + 1 > daysInRow) {
        // is highest yet => save
        daysInRow = adjacentTrainings.length + 1;
      }
    }

    if (planStructures.length === 3) {
      if (daysInRow !== 3) {
        // has a pause between days => use 1 - 2 - 1
        planStructures[2] = cloneWithValidation(
          planStructures[0],
          PlanStructureSchema,
          "planStructures[0]",
        );
      }
      // use all three days
    }

    let studio = [];
    let nonStudio = [];
    // get plan structures for studio and no studio days
    planStructures.forEach((entry) => {
      for (let curr of Object.values(entry)) {
        for (let skill of curr) {
          if (skill === "PHASE" || skill.indexOf("CARDIO")) {
            studio.push(entry);
            return;
          }
        }
      }
      nonStudio.push(entry);
    });
    return {
      studio: studio,
      nonStudio: nonStudio,
    };
  };

  static replaceUserSpecificSkill = (
    skill: string | null,
    ageGroup: "CHILD" | "ADOLESCENT" | "ADULT",
    prevSkill?: string | null,
  ): string | null => {
    if (skill === null) return skill;
    let result = skill;
    //get user specific prevention
    if (["PREV", "PREV1", "PREV2", "PREV3", "PREV4"].indexOf(skill) > -1) {
      if (prevSkill) {
        result = prevSkill;
      } else if (ageGroup === WorkoutConstants.AGE_GROUPS.CHILD) {
        // stability for kids without prevs 2 & 3
        if (skill === "PREV2") {
          result = "GKS";
        }
        if (skill === "PREV3") {
          result = "BAS";
        }
      }
    }

    // special warm-up only if corresponding prev exists in current block
    if (skill === "WUSPEZIAL") {
      if (prevSkill) {
        result = "WUSPEZIAL";
      } else {
        result = null;
      }
    }

    // no weights for kids
    if (ageGroup === WorkoutConstants.AGE_GROUPS.CHILD) {
      if (skill === "SWR1") {
        result = "SWR1KG";
      }
      if (skill === "SWR2") {
        result = "SWR2KG";
      }
    }
    return result;
  };

  static initializeTrainingPlan = (
    seasonPhase,
    ageGroup,
    position,
    level,
    hasWeights,
    startDate,
    isKeeper,
  ) => {
    //defines type and numOfWeeks for each section
    let trainingSections = this.getWeightedSections(
      seasonPhase,
      ageGroup,
      position,
      level,
      hasWeights,
      isKeeper,
    );

    let trainingPlan: TrainingPlanType = {};
    trainingPlan.start = startDate; // if is update is start of current plan - now otherwise

    //calculate start for each section
    trainingSections = this.calculateStartingDates(
      trainingSections,
      trainingPlan.start,
    );
    /*const trainSections = trainingSections.map(sec => {
            sec.start = dateToDDMMYYYY(sec.start);
            return sec;
        });*/
    if (PlanGenerator.DEBUG)
      console.log("TrainingSections: ", trainingSections);
    trainingPlan.sections = trainingSections; //TODO change to DDMMYYYY everywhere
    if (PlanGenerator.DEBUG) console.log("TrainingPlan: ", trainingPlan);
    return trainingPlan;
  };

  //defines type and numOfWeeks for each section
  static getWeightedSections = (
    seasonPhase: SeasonPhaseType,
    ageGroup,
    position,
    level,
    hasWeights,
    isKeeper,
  ): TrainingSectionType[] => {
    let numOfWeeks = seasonPhase.numOfWeeks;
    let sections = this.getSectionsBySeasonPhaseAgeGroupLevelNumOfWeeks(
      seasonPhase.type,
      ageGroup,
      level,
      numOfWeeks,
      hasWeights,
      isKeeper,
    );
    // DEV check selected sections
    return sections;
  };

  static calculateStartingDates = (
    trainingSections: TrainingSectionType[],
    trainingPlanStart: string,
  ): TrainingSectionType[] => {
    let d = DDMMYYYYToDate(trainingPlanStart);
    //next monday(1)
    if (d.getDay() !== 1) {
      // is not monday
      let daysToAdd = (1 + 7 - d.getDay()) % 7;
      d = this.addDays(d, daysToAdd);
    }

    let t = [];
    t = trainingSections.map((item) => {
      return { ...item, start: dateToDDMMYYYY(d) };
    });
    if (PlanGenerator.DEBUG) console.log("TrainingSections in progress: ", t);

    let x = [];
    x = t.map((value, index, array) => {
      const { start, ...rest } = value;
      let startDate = DDMMYYYYToDate(start);
      let daysToAdd = 0;
      let sectionIndex = index - 1;
      while (sectionIndex > -1) {
        daysToAdd += array[sectionIndex].numOfWeeks * 7;
        sectionIndex--;
      }
      startDate = this.addDays(startDate, daysToAdd);
      if (PlanGenerator.DEBUG)
        console.log("Start date section " + index + ": ", startDate);

      return { start: dateToDDMMYYYY(startDate), ...rest };
    });
    return x;
  };

  static isLeapYear = (d: Date) => {
    const year = d.getFullYear();
    return year / 4 === 0 && (year / 100 !== 1 || year / 400 === 0);
  };

  static getMonthLength = (d: Date) => {
    switch (d.getMonth()) {
      case 0:
      case 2:
      case 4:
      case 6:
      case 7:
      case 9:
      case 11:
        return 31;
      case 3:
      case 5:
      case 8:
      case 10:
        return 30;
      case 1:
        return this.isLeapYear(d) ? 29 : 28;
      default:
        return 30;
    }
  };

  static addDays = (d: Date, daysToAdd: number) => {
    let date = new Date(d.getTime());
    let newDate = date.getDate() + daysToAdd;
    while (newDate > this.getMonthLength(date)) {
      // is in next month
      newDate -= this.getMonthLength(date);
      let newMonth = date.getMonth() + 1;
      if (newMonth > 11) {
        // is new year
        newMonth = 0;
        date.setFullYear(date.getFullYear() + 1);
      }
      date.setMonth(newMonth);
    }
    date.setDate(newDate);
    return date;
  };

  static mapFallbackSections = (chosen, fallback, type: string) => {
    let mappedSections = [];
    let i = 0;
    let b = cloneWithValidation(
      fallback[i++],
      FallbackSectionSchema,
      "fallback",
    );
    let m = {};
    for (let section of chosen) {
      let a = cloneWithValidation(section, FallbackSectionSchema, "section");

      while (a.length > b.length) {
        m = cloneWithValidation(a, FallbackSectionSchema, "a");
        m.length = b.length;
        m[type + "Type"] = b.type;
        mappedSections.push(m);

        a.length -= b.length;

        if (i < fallback.length) {
          b = cloneWithValidation(
            fallback[i++],
            FallbackSectionSchema,
            "fallback",
          );
        } else {
          return mappedSections;
        }
      }
      m = cloneWithValidation(a, FallbackSectionSchema, "a");
      m[type + "Type"] = b.type;
      mappedSections.push(m);

      if (a.length === b.length) {
        if (i < fallback.length) {
          b = cloneWithValidation(
            fallback[i++],
            FallbackSectionSchema,
            "fallback",
          );
        } else {
          return mappedSections;
        }
      } else if (a.length < b.length) {
        b.length -= a.length;
      }
    }
    return mappedSections;
  };

  static getSkillTrainingplan = (
    section: SectionTypes,
    cardioType: string,
    skills,
    placeEquipment,
  ): Record<string, string[]> => {
    //replace "phase" by actual phase name
    for (let entry in skills) {
      for (let i = 0; i < skills[entry].length; i++) {
        if (skills[entry][i] === "PHASE") {
          if (hasWeights(placeEquipment)) {
            skills[entry][i] = section;
          } else {
            if (section !== "MAX_KRAFT" && section !== "MAX") {
              skills[entry][i] = section + "KG";
            } else {
              skills[entry][i] = "SWR2KG";
            }
          }
        } else if (skills[entry][i] === "WU") {
          if (section === "SA" || section === "SK") {
            skills[entry][i] = "WUSKSA";
          }
        } else if (skills[entry][i].indexOf("CARDIO") > -1) {
          skills[entry][i] = cardioType;
        }
      }
    }
    return skills;
  };

  static getBranchesForWorkout = (
    skill: string,
    weightedTag: { tags: string[]; count: number },
    oberkoerperDirections: DirectionsMap,
    unterkoerperDirections: DirectionsMap,
    ganzkoerperDirections: DirectionsMap,
    rumpfDirections: DirectionsMap,
    equipment: string[],
    workout: ExerciseBranchType[],
    user: UserType,
    place: string,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    prevSkills: string[],
    exerciseBranchData: BranchDataMapType,
    branchIdsInUse: string[],
    log: boolean = false,
  ): ExerciseBranchType[] => {
    if (PlanGenerator.DEBUG || log) {
      console.log("GET BRANCHES FOR WORKOUT with");
      console.log("skill", skill);
      console.log("weightedTag", weightedTag);
      console.log("equipment", equipment);
      console.log("exercises already in use", workout);
    }
    const HAS_WEIGHTS = hasWeights(equipment);
    let fullSkillTree = getSkillTree(
      skillTrees,
      skill,
      prevSkills,
      HAS_WEIGHTS,
    );
    const userAge = ageGroupFor(user.workoutData.birthday);
    const userLevel = getUserLevel(user);
    const pains = getBlocksFromPains(
      getTagValues(user.workoutData.tags, TagGroups.PAIN),
    );
    if (PlanGenerator.DEBUG && pains.length > 0) {
      console.log("filter pains ", pains);
    }

    //filter branches
    if (PlanGenerator.DEBUG) console.log("full skillTree", fullSkillTree);
    let skillTree: SkillTreeType = {};
    skillTree = this.addToSkillTree(
      skillTree,
      fullSkillTree,
      workout,
      userAge,
      user.workoutData.gender,
      userLevel,
      equipment,
      pains,
      exerciseBranchData,
      exercises,
      branchIdsInUse,
    );

    if (PlanGenerator.DEBUG)
      console.log(
        "remaining skillTree count",
        skill,
        Object.keys(skillTree).length,
        "has weights " + HAS_WEIGHTS,
      );

    // always add non weight exercises to use for planed distribution
    if (HAS_WEIGHTS) {
      if (PlanGenerator.DEBUG)
        console.log("add non weight skill tree for ", skill);
      // try skill tree without weights for more gender/age options
      let secondSkillTree = getSkillTree(skillTrees, skill, prevSkills, false);
      skillTree = this.addToSkillTree(
        skillTree,
        secondSkillTree,
        workout,
        userAge,
        user.workoutData.gender,
        userLevel,
        equipment,
        pains,
        exerciseBranchData,
        exercises,
        branchIdsInUse,
      );
      if (PlanGenerator.DEBUG)
        console.log(
          "complemented skillTree count after non weight branches added",
          skill,
          Object.keys(skillTree).length,
        );
    }
    if (PlanGenerator.DEBUG)
      console.log(
        "filtered skillTree",
        skill,
        JSON.parse(JSON.stringify(skillTree)),
      );

    // get region presets
    const regionTags = getTagValues(weightedTag.tags, TagGroups.REGION);
    const skillTags = getTagValues(weightedTag.tags, TagGroups.SKILL);
    const exNameTags = getTagValues(weightedTag.tags, TagGroups.EXERCISENAME);

    // init selection
    let bigMuscles = [];
    let exerciseDirection = [];
    let regionTag = null;
    const length = weightedTag.count;

    // get selection
    if (regionTags.length > 0) {
      if (PlanGenerator.DEBUG || log) console.log("regionTags", regionTags);
      // if multiple take one
      regionTag = regionTags[Math.floor(Math.random() * regionTags.length)];
      const getDirectionsByLength = (dir, len) => {
        if (len === 0) return [];
        if (dir.hasOwnProperty(len)) {
          return dir[len];
        }
        const lastKey = Math.max(...Object.keys(dir));
        return dir[lastKey];
      };
      if (regionTag === "OBERKOERPER") {
        bigMuscles = ["BRUST", "GROSSER_RUECKENMUSKEL_LAT"];
        exerciseDirection = getDirectionsByLength(
          oberkoerperDirections,
          length,
        );
      } else if (regionTag === "UNTERKOERPER") {
        bigMuscles = ["GESAESS", "OBERSCHENKELVORDERSEITE"];
        //choose entry of unterkoerper directions where index is number of unterkoerper exercises (for that skill)
        exerciseDirection = getDirectionsByLength(
          unterkoerperDirections,
          length,
        );
      } else if (regionTag === "RUMPF" || regionTag === "CORE") {
        //shuffle the order
        exerciseDirection = getDirectionsByLength(rumpfDirections, length);
        regionTag = "CORE";
      } else if (regionTag === "GANZKOERPER") {
        bigMuscles = [
          "GESAESS",
          "OBERSCHENKELVORDERSEITE",
          "BRUST",
          "GROSSER_RUECKENMUSKEL_LAT",
        ];
        exerciseDirection = getDirectionsByLength(
          ganzkoerperDirections,
          length,
        );
      } else {
        if (PlanGenerator.DEBUG)
          console.log("No exerciseDirection found for tag " + regionTag);
        exerciseDirection = [];
        // set default entries
        for (let i = 0; i < length; i++) {
          exerciseDirection.push({ tags: null, count: 1 });
        }
      }
      if (PlanGenerator.DEBUG)
        console.log(
          "exerciseDirection set for skill ",
          skill,
          " region ",
          regionTag,
          JSON.parse(JSON.stringify(exerciseDirection)),
        );
    }

    let notChosenBigMuscles = Array.from(bigMuscles);
    let smallMuscles = [
      "NACKEN_HINTEN",
      "NACKEN_VORNE",
      "NACKEN_SEITE",
      "SCHULTER",
      "SCHULTER_VORNE",
      "SCHULTER_HINTEN",
      "SCHULTER_SEITE",
      "BIZEPS",
      "ARMSTRECKER",
      "HANDGELENKSBEUGER",
      "HANDGELENKSSTRECKER",
      "FINGER_HANDGELENKSMUSKULATUR",
      "NACKEN",
      "OBERER_RUECKEN",
      "SCHULTERBLATT_FIXIEREND_HINTEN",
      "SCHULTERBLATT_FIXIEREND_FRONT",
      "UNTERER_RUECKEN",
      "GERADE_BAUCHMUSKELN",
      "SEITLICHE_BAUCHMUSKELN",
      "HUEFT_BEUGER",
      "HUEFT_INNEN_ROTATOR",
      "HUEFT_AUSSEN_ROTATOR",
      "INNERER_OBERSCHENKEL",
      "AEUSSERER_OBERSCHENKEL",
      "WADE",
      "SPRUNGGELENK",
      "SCHIENBEIN",
    ];

    let possibleExercises = [...Object.keys(skillTree)];
    if (regionTag && exerciseDirection.length > 0) {
      // get exercise branches by region
      possibleExercises = Object.keys(skillTree).filter((ex) =>
        getTagValues(skillTree[ex]["tags"], TagGroups.REGION).includes(
          regionTag,
        ),
      );
    } else if (skillTags.length > 0) {
      // get branches by skill type
      // need the corresponding skill tree later
      // if multiple take one randomly
      skillTree = getSkillTree(
        skillTrees,
        skillTags[Math.floor(Math.random() * skillTags.length)],
        prevSkills,
        HAS_WEIGHTS,
      );
      // get skill tree for skill to use, there should be only one
      possibleExercises = [...Object.keys(skillTree)];
    } else if (exNameTags.length > 0) {
      // get branch for exersice name, need all skill branches later
      skillTree = getSkillTree(skillTrees, "ALL", prevSkills, HAS_WEIGHTS);
      // TODO: add TAGS instead of hardcoded branch ids
      // get branches for exercises set
      possibleExercises = [...getBranchIdsByNames(exNameTags, skill)];
    }
    if (PlanGenerator.DEBUG)
      console.log("possibleExercises for " + skill, possibleExercises);

    //get branches for training
    let branches = [];

    if (possibleExercises.length < weightedTag.count) {
      if (PlanGenerator.DEBUG) {
        console.log(
          "not enough exercises left for " +
            skill +
            " with region " +
            regionTag +
            " and weighted tags " +
            weightedTag,
        );
      }
    }
    let possibleBranches = possibleExercises.map((idStr) => {
      if (
        skillTree[idStr] &&
        skillTree[idStr].tags &&
        skillTree[idStr].levels
      ) {
        return {
          exerciseBranchId: idStr,
          tags: skillTree[idStr].tags,
          levels: skillTree[idStr].levels,
        };
      } else if (
        idStr === "141" &&
        skillTree["142"] &&
        skillTree["142"].tags &&
        skillTree["142"].levels
      ) {
        // DEV TEST SETTING because rowing moved to another branch
        // TODO: REMOVE when set by TAGS instead of branch ids
        return {
          exerciseBranchId: "142",
          tags: skillTree["142"].tags,
          levels: skillTree["142"].levels,
        };
      }
      return {
        exerciseBranchId: "-1",
        tags: [],
        levels: [],
      };
    });
    if (PlanGenerator.DEBUG || log)
      console.log(
        "num of possible Branches for skill " + skill,
        possibleBranches.length,
      );

    // use at least as many branches as possible
    let numOfBranchesToUse = Math.min(
      weightedTag.count,
      possibleBranches.length,
    );
    if (PlanGenerator.DEBUG)
      console.log("numOfBranchesToUse for skill " + skill, numOfBranchesToUse);

    // weight/KG distribution
    let weightPercentage = 0;
    if (HAS_WEIGHTS) {
      if (userAge === WorkoutConstants.AGE_GROUPS.CHILD) {
        weightPercentage = 0.3;
      } else {
        if (place === "STUDIO") {
          if (skill.indexOf("SWR") > -1 || skill === "GKS") {
            weightPercentage = 0.8;
          } else {
            weightPercentage = 0.6;
          }
        } else {
          weightPercentage = 0.5;
        }
      }
    }
    // setup for choosing
    let weightExercisesToUse = Math.ceil(weightPercentage * numOfBranchesToUse);
    let kgExercisesToUse = numOfBranchesToUse - weightExercisesToUse;
    let nextType = "kg";

    // add by tags for count times
    for (let k = 0; k < numOfBranchesToUse; k++) {
      if (log) console.log("count", k + 1 + "/" + weightedTag.count);

      // choose nextType
      if (weightExercisesToUse > 0 && kgExercisesToUse > 0) {
        nextType = Math.random() > 0.5 ? "kg" : "weight";
      } else if (weightExercisesToUse === 0) {
        nextType = "kg";
      } else {
        nextType = "weight";
      }

      if (PlanGenerator.DEBUG) {
        console.log("branches yet", JSON.parse(JSON.stringify(branches)));
        console.log(
          "add branch for skill ",
          skill,
          " weightedTags ",
          weightedTag.tags,
        );
        console.log("count", k + 1 + "/" + weightedTag.count);
        console.log(
          "exerciseDirection",
          JSON.parse(JSON.stringify(exerciseDirection)),
        );
      }
      if (PlanGenerator.DEBUG) {
        console.log("START FILTERING WITH", possibleBranches);
      }

      let directionFiltered = [];
      let directionFound;
      if (PlanGenerator.DEBUG) {
        console.log(
          "looking for exercise with direction from",
          JSON.parse(JSON.stringify(exerciseDirection)),
        );
        console.log("in", JSON.parse(JSON.stringify(possibleBranches)));
      }
      // "skip" all directions with highest prios that aren't available for that region tag
      let directionIndex = 0;
      for (; directionIndex < exerciseDirection.length; directionIndex++) {
        directionFiltered = possibleBranches.filter((possEx) => {
          let dirs = getTagValues(possEx.tags, "EXERCISEDIRECTION");
          let sides = getTagValues(possEx.tags, "SIDE");
          return (
            (exerciseDirection[directionIndex]["direction"]
              ? dirs.includes(exerciseDirection[directionIndex]["direction"])
              : true) &&
            (exerciseDirection[directionIndex]["side"]
              ? sides.includes(exerciseDirection[directionIndex]["side"])
              : true)
          );
        });
        if (directionFiltered.length > 0) {
          directionFound = exerciseDirection[directionIndex];
          break;
        }
      }
      if (PlanGenerator.DEBUG) {
        if (directionFiltered.length > 0) {
          console.log(
            "found for exercise filtered for direction",
            directionFound,
            directionFiltered,
          );
        } else {
          console.log("Nothing found for exercise direction");
        }
      }

      // wenn nicht alle Bedingungen möglich, pro nicht erfüllbarer Bedingung -> zufällig
      if (directionFiltered.length < 1) {
        directionFiltered = possibleBranches;
      }
      if (PlanGenerator.DEBUG) {
        console.log("DIRECTION FILTERED", directionFiltered.length);
      }

      let sideFiltered = [];
      if (k === numOfBranchesToUse - 1) {
        // is last exercise, do not use one sided exercises
        sideFiltered = directionFiltered.filter((branch) => {
          // check user level exercise tags, because only some of the given branch may be one sided
          let userLevelExercise = getUserExerciseFromBranch(
            branch,
            userLevel,
            exercises,
            exerciseBranchData[branch.exerciseBranchId]
              ? exerciseBranchData[branch.exerciseBranchId]
              : null,
          );
          if (userLevelExercise) {
            return !getTagValues(
              userLevelExercise.tags,
              TagGroups.SIDE,
            ).includes("ONE");
          }
          return false;
        });
      }
      // wenn nicht alle Bedingungen möglich, pro nicht erfüllbarer Bedingung -> zufällig
      if (sideFiltered.length < 1) {
        sideFiltered = directionFiltered;
      }

      // no muscle filtering for rumpf / other than ober/unterkoerper -> no different muscle groups!?
      let muscleFiltered = sideFiltered;
      if (regionTag !== "RUMPF" && regionTag !== "CORE") {
        // not yet chosen big muscles
        muscleFiltered = sideFiltered.filter((possEx) =>
          notChosenBigMuscles.some((tag) =>
            getTagValues(possEx.tags, TagGroups.MUSCLE).includes(tag),
          ),
        );
        // all big muscles
        if (muscleFiltered.length === 0) {
          muscleFiltered = sideFiltered.filter((possEx) =>
            bigMuscles.some((tag) =>
              getTagValues(possEx.tags, TagGroups.MUSCLE).includes(tag),
            ),
          );
        }
        // small muscles
        if (muscleFiltered.length === 0) {
          muscleFiltered = sideFiltered.filter((possEx) =>
            smallMuscles.some((tag) =>
              getTagValues(possEx.tags, TagGroups.MUSCLE).includes(tag),
            ),
          );
        }
        if (muscleFiltered.length < 1) {
          muscleFiltered = sideFiltered;
        }
      }
      if (PlanGenerator.DEBUG) {
        console.log("MUSCLE FILTERED", muscleFiltered);
      }

      // prefer complex exercises only for non core regions
      let involvementFiltered = [];
      if (regionTag !== "RUMPF" && regionTag !== "CORE") {
        // use complex with 70%, isolated with 30%
        let involvementToUse = Math.random() > 0.3 ? "COMPLEX" : "ISOLATED";
        involvementFiltered = muscleFiltered.filter((possEx) => {
          let possExInvolvement = getTagValues(
            possEx.tags,
            TagGroups.MUSCLE_INVOLVEMENT,
          );
          return (
            possExInvolvement.length === 0 ||
            possExInvolvement.includes(involvementToUse)
          );
        });
        if (PlanGenerator.DEBUG) {
          console.log("COMPLEX/ISOLATED FILTERED", involvementFiltered);
        }
      }

      if (involvementFiltered.length < 1) {
        // if no matching complexity found use all
        involvementFiltered = muscleFiltered;
      }

      let equipmentFiltered = [];
      if (skill.indexOf("MAX") > -1) {
        // prefer LH before KH
        equipmentFiltered = involvementFiltered.filter((possEx) =>
          getTagValues(possEx.tags, TagGroups.EQUIPMENT).includes(
            WorkoutConstants.EQUIPMENT.BARBELL,
          ),
        );
      }

      if (equipmentFiltered.length < 1) {
        equipmentFiltered = involvementFiltered;
      }

      // filter by type for weight/kg distribution only if not MAX
      let nextTypeFiltered = [];
      if (skill.indexOf("MAX") === -1) {
        nextTypeFiltered = getNextTypeFiltered(nextType, involvementFiltered);
        if (nextTypeFiltered.length < 1) {
          // no more found for type, take other
          nextType = nextType === "kg" ? "weight" : "kg";
          nextTypeFiltered = getNextTypeFiltered(nextType, involvementFiltered);
        }
        if (nextType === "kg") {
          kgExercisesToUse--;
        } else {
          weightExercisesToUse--;
        }
      }

      if (nextTypeFiltered.length < 1) {
        nextTypeFiltered = equipmentFiltered;
      }

      let remainingPossibilities = equipmentFiltered;
      let exerciseBranch = null;

      if (remainingPossibilities.length > 0) {
        // take randomly chosen entry of remainingPossibilities out of possibleExercises
        // needs to be spliced from possibleBranches to not be reused
        exerciseBranch = cloneWithValidation(
          possibleBranches.splice(
            possibleBranches.indexOf(
              remainingPossibilities[
                Math.floor(Math.random() * remainingPossibilities.length)
              ],
            ),
            1,
          )[0],
          ExerciseBranchEntrySchema,
          "exerciseBranch",
        );
      } else {
        // use any branch from skill
        exerciseBranch = cloneWithValidation(
          possibleBranches.splice(
            Math.floor(Math.random() * possibleBranches.length),
            1,
          )[0],
          ExerciseBranchEntrySchema,
          "exerciseBranch",
        );
      }

      //probably
      if (exerciseBranch && notChosenBigMuscles.length > 1) {
        let indexOfMuscleFound = notChosenBigMuscles.indexOf(
          getTagValues(exerciseBranch.tags, "MUSCLE").filter((tag) =>
            notChosenBigMuscles.includes(tag),
          )[0],
        );
        if (indexOfMuscleFound > -1) {
          //remove one of the chosen big muscles
          notChosenBigMuscles.splice(indexOfMuscleFound, 1);
        }
      }

      //TODO what to do if no exercise left for total match
      if (!exerciseBranch) {
        console.log("NO EXERCISE BRANCH SELECTED FOR", skill);
      } else {
        // check user level exercise tags, because only some of the given branch may be one sided
        let userLevelExercise = getUserExerciseFromBranch(
          exerciseBranch,
          userLevel,
          exercises,
          exerciseBranchData[exerciseBranch.exerciseBranchId]
            ? exerciseBranchData[exerciseBranch.exerciseBranchId]
            : null,
        );
        if (!userLevelExercise) {
          // do not use this branch
          // set back k
          k--;
          // branch has already bin spliced out of possible banches
          continue;
        }
        // do not use this exercise direction again
        exerciseDirection.splice(directionIndex, 1);
        let sideTags = userLevelExercise
          ? getTagValues(userLevelExercise.tags, TagGroups.SIDE)
          : [];
        let isOneSided = sideTags.some((st) => st.indexOf("ONE") > -1);

        if (PlanGenerator.DEBUG) {
          console.log("skill", skill);
          console.log("userLevelExercise", userLevelExercise);
          console.log("isOneSided", isOneSided);
        }
        if (isOneSided) {
          // will add other side in training generator
          // if not a single side used prev exercise => reduce exercise number by one
          if (skill.indexOf("PREV") === -1) k++;
        }
        let { levels, ...rest } = exerciseBranch;
        for (let levelKey in levels) {
          const level = Number(levelKey);
          levels[level] = { exerciseId: levels[level].id };
        }
        branches.push({
          tags: rest.tags,
          exercises: levels,
          exerciseBranchId: rest.exerciseBranchId,
        });
      }
    }
    if (PlanGenerator.DEBUG) {
      console.log("Selected branches for skill ", skill, branches.length);
    }
    return branches;
  };

  static chooseByTags = (
    skill: string,
    weightedTags: { tags: string[]; count: number }[],
    oberkoerperDirections: DirectionsMap,
    unterkoerperDirections: DirectionsMap,
    ganzkoerperDirections: DirectionsMap,
    rumpfDirections: DirectionsMap,
    equipment: string[],
    user: UserType,
    place: string,
    exercises: ExerciseType[],
    skillTrees: { [skillName: string]: SkillTreeType },
    prevSkills: string[],
    exerciseBranchData: BranchDataMapType,
    branchIdsInUse: string[],
    log: boolean = false,
  ): ExerciseBranchType[] => {
    if (PlanGenerator.DEBUG)
      console.log("choose by tags for " + skill, weightedTags);
    let workout: ExerciseBranchType[] = [];
    for (let i = 0; i < weightedTags.length; i++) {
      let currentWorkout = cloneWithValidation(
        workout,
        WorkoutArraySchema,
        "workout",
      );
      let branches = this.getBranchesForWorkout(
        skill,
        weightedTags[i],
        oberkoerperDirections,
        unterkoerperDirections,
        ganzkoerperDirections,
        rumpfDirections,
        equipment,
        currentWorkout,
        user,
        place,
        exercises,
        skillTrees,
        prevSkills,
        exerciseBranchData,
        branchIdsInUse,
        log,
      );
      if (PlanGenerator.DEBUG || log) {
        console.log("branches for region", weightedTags[i].tags);
        console.log(branches.length + " branches found", branches);
      }
      if (typeof branches !== "undefined") {
        workout.push(...branches);
      }
    }
    if (PlanGenerator.DEBUG)
      console.log("workout built for " + skill + ": ", workout);
    return workout;
  };

  static getMinimumDurationsForBlock = (
    block,
    prevention,
    seasonPhase,
    ageGroup,
    level,
  ) => {
    let time = 0;
    let timePerSkill = {};
    if (PlanGenerator.DEBUG) console.log("BLOCK: ", block);
    //assign minimum duration to each skill
    for (let skill of block) {
      // DEV prevent Crash for incomplete mock data
      if (skill !== null) {
        // TODO get from assets
        let tagObj = this.getTagsForSkill(skill, ageGroup, level);
        if (PlanGenerator.DEBUG)
          console.log(
            "minDuration tagObj for SKILL: ",
            skill,
            "obj:",
            JSON.parse(JSON.stringify(tagObj)),
          );

        //get minimum duration for skill
        let minDuration = Math.min(...Object.keys(tagObj)); // get first entry i.e. the one with lowest key
        time = minDuration;

        timePerSkill[skill] = time;
        if (PlanGenerator.DEBUG)
          console.log(
            "new time per skill for SKILL: ",
            skill,
            "timePerSkill:",
            JSON.parse(JSON.stringify(timePerSkill)),
          );
      }
    }
    return timePerSkill;
  };

  static indexByCounter = (counter: number): number => {
    if (counter < 0) {
      return 0;
    }
    return counter;
  };

  static getTagsForSkill = (
    skill: string,
    age?: string | null,
    level?: string | null,
  ) => {
    if (PlanGenerator.DEBUG) {
      console.log("get tags for skill", skill, age, level);
    }
    let region = RegionSWR1;
    switch (skill) {
      case "CARDIO_1_SHORT":
      case "CARDIO_1_LAKTAT":
      case "CARDIO_2":
      case "CARDIO_3":
      case "CARDIO_4":
      case "CARDIO_5":
        region = RegionCARDIO;
        break;
      case "BAS":
        region = RegionBAS;
        break;
      case "BR":
        region = RegionBR;
        break;
      case "CD":
        region = RegionCD;
        break;
      case "GKS":
        region = RegionGKS;
        break;
      case "MAX":
      case "MAX_KRAFT":
        region = RegionMAX;
        break;
      case "MOB":
        region = RegionMOB;
        break;
      case "PREVANKLE":
        region = RegionPREVANKLE;
        break;
      case "PREVKNEE":
        region = RegionPREVKNEE;
        break;
      case "PREVSHOULDER":
        region = RegionPREVSHOULDER;
        break;
      case "PREVSPINE":
        region = RegionPREVSPINE;
        break;
      case "PREVWRIST":
        region = RegionPREVWRIST;
        break;
      case "SA":
        region = RegionSA;
        break;
      case "SAKG":
        region = RegionSAKG;
        break;
      case "SK":
        region = RegionSK;
        break;
      case "SKKG":
        region = RegionSKKG;
        break;
      case "SWR1":
        region = RegionSWR1;
        break;
      case "SWR1KG":
        region = RegionSWR1KG;
        break;
      case "SWR":
        region = RegionSWR2;
        break;
      case "SWR2KG":
        region = RegionSWR2KG;
        break;
      case "WU":
        region = RegionWU;
        break;
      case "WUSKSA":
        region = RegionWUSKSA;
        break;
      case "WUSPEZIAL":
        region = RegionWUSPEZIAL;
        break;
      default:
        if (PlanGenerator.DEBUG) console.log("USED DEFAULT FOR SKILL", skill);
        region = RegionSWR1;
    }
    if (PlanGenerator.DEBUG) {
      console.log("selected region for skill " + skill, region);
    }
    if (age && age === WorkoutConstants.AGE_GROUPS.CHILD && region.child) {
      return region.child;
    }
    if (
      level &&
      level === WorkoutConstants.LEVELS.PROFESSIONAL &&
      region.professional
    ) {
      return region.professional;
    }
    return region.default; // default should always be set
  };

  static getSectionsBySeasonPhaseAgeGroupLevelNumOfWeeks = (
    seasonPhase: string,
    ageGroup: string,
    level: string,
    numOfWeeks: number,
    hasWeights: boolean,
    isKeeper: boolean,
  ) => {
    const sp = seasonPhase.toLowerCase();
    const ag =
      ageGroup.toLowerCase() === "adolescent"
        ? "adult"
        : ageGroup.toLowerCase(); // treat adolescents as adults
    const lv = level.toLowerCase();
    let sectionsGroup = null;
    if (PlanGenerator.DEBUG) {
      console.log(
        "Find training sections for " +
          sp +
          ag +
          lv +
          "\nwith " +
          numOfWeeks +
          " weeks.",
      );
    }
    switch (sp + ag + lv) {
      // Pause
      // - Child
      case "pausechildbeginner":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPauseChildBeginner,
          TrainingSectionsMapSchema,
          "TrainingSectionsPauseChildBeginner",
        );
        break;
      case "pausechildadvanced":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPauseChildAdvanced,
          TrainingSectionsMapSchema,
          "TrainingSectionsPauseChildAdvanced",
        );
        break;
      case "pausechildprofessional":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPauseChildProfessional,
          TrainingSectionsMapSchema,
          "TrainingSectionsPauseChildProfessional",
        );
        break;
      // - Adult
      case "pauseadultbeginner":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPauseAdultBeginner,
          TrainingSectionsMapSchema,
          "TrainingSectionsPauseAdultBeginner",
        );
        break;
      case "pauseadultadvanced":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPauseAdultAdvanced,
          TrainingSectionsMapSchema,
          "TrainingSectionsPauseAdultAdvanced",
        );
        break;
      case "pauseadultprofessional":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPauseAdultProfessional,
          TrainingSectionsMapSchema,
          "TrainingSectionsPauseAdultProfessional",
        );
        break;
      // Prepatory
      // - Child
      case "prepatorychildbeginner":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPrepatoryChildBeginner,
          TrainingSectionsMapSchema,
          "TrainingSectionsPrepatoryChildBeginner",
        );
        break;
      case "prepatorychildadvanced":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPrepatoryChildAdvanced,
          TrainingSectionsMapSchema,
          "TrainingSectionsPrepatoryChildAdvanced",
        );
        break;
      case "prepatorychildprofessional":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPrepatoryChildProfessional,
          TrainingSectionsMapSchema,
          "TrainingSectionsPrepatoryChildProfessional",
        );
        break;
      // - Adult
      case "prepatoryadultbeginner":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPrepatoryAdultBeginner,
          TrainingSectionsMapSchema,
          "TrainingSectionsPrepatoryAdultBeginner",
        );
        break;
      case "prepatoryadultadvanced":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPrepatoryAdultAdvanced,
          TrainingSectionsMapSchema,
          "TrainingSectionsPrepatoryAdultAdvanced",
        );
        break;
      case "prepatoryadultprofessional":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPrepatoryAdultProfessional,
          TrainingSectionsMapSchema,
          "TrainingSectionsPrepatoryAdultProfessional",
        );
        break;
      // Competition
      // - Child
      case "competitionchildbeginner":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsCompetitionChildBeginner,
          TrainingSectionsMapSchema,
          "TrainingSectionsCompetitionChildBeginner",
        );
        break;
      case "competitionchildadvanced":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsCompetitionChildAdvanced,
          TrainingSectionsMapSchema,
          "TrainingSectionsCompetitionChildAdvanced",
        );
        break;
      case "competitionchildprofessional":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsCompetitionChildProfessional,
          TrainingSectionsMapSchema,
          "TrainingSectionsCompetitionChildProfessional",
        );
        break;
      // - Adult
      case "competitionadultbeginner":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsCompetitionAdultBeginner,
          TrainingSectionsMapSchema,
          "TrainingSectionsCompetitionAdultBeginner",
        );
        break;
      case "competitionadultadvanced":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsCompetitionAdultAdvanced,
          TrainingSectionsMapSchema,
          "TrainingSectionsCompetitionAdultAdvanced",
        );
        break;
      case "competitionadultprofessional":
        sectionsGroup = cloneWithValidation(
          TrainingSectionsCompetitionAdultProfessional,
          TrainingSectionsMapSchema,
          "TrainingSectionsCompetitionAdultProfessional",
        );
        break;
      default:
        if (PlanGenerator.DEBUG) {
          console.log(
            "Couldn't find training sections for " + sp + ", " + ag + ", " + lv,
          );
        }
        // Use default
        sectionsGroup = cloneWithValidation(
          TrainingSectionsPrepatoryAdultAdvanced,
          TrainingSectionsMapSchema,
          "TrainingSectionsPrepatoryAdultAdvanced",
        );
        break;
    }

    if (PlanGenerator.DEBUG) {
      console.log("Found training sections", sectionsGroup);
    }
    let sections = sectionsGroup[20];
    if (typeof sectionsGroup[numOfWeeks] === "undefined") {
      // numOfWeeks is bigger than 20, add more sections
      const repeat = sectionsGroup["repeat"];
      let remainingWeeks = numOfWeeks - 20;
      let i = 0;
      while (remainingWeeks > 0) {
        if (i === repeat.length) {
          // go back to start of reapeat
          i = 0;
        }
        // add new section
        let nextSection = Object.assign({}, repeat[i]);
        nextSection.numOfWeeks = 0;
        for (let k = repeat[i].numOfWeeks; k > 0; k--) {
          if (remainingWeeks === 0) break;
          // add week to section
          nextSection.numOfWeeks++;
          remainingWeeks--;
        }
        if (
          sections[sections.length - 1].type === nextSection.type &&
          sections[sections.length - 1].cardioType === nextSection.cardioType
        ) {
          // add weeks to existing section
          sections[sections.length - 1].numOfWeeks += nextSection.numOfWeeks;
        } else {
          // add new section
          sections.push(nextSection);
        }
        i++;
      }
    } else {
      // set sections from preset
      sections = sectionsGroup[numOfWeeks];
    }

    if (PlanGenerator.DEBUG) {
      console.log("Found sections for given numOfWeeks", numOfWeeks, sections);
    }

    // if no studio or beginner => change max to swr2
    if (!hasWeights || level === WorkoutConstants.LEVELS.BEGINNER) {
      if (PlanGenerator.DEBUG)
        console.log("Adjusting sections for no studio or beginner");
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].type === "MAX" || sections[i].type === "MAX_KRAFT") {
          sections[i].type = "SWR2";
        }
      }
    }
    // if keeper and not child => change sa to sk, change cardio 1L to 1K
    // if (isKeeper && ageGroup !== WorkoutConstants.AGE_GROUPS.CHILD) {

    // also change childs SA to SK for now TODO set back
    if (isKeeper) {
      if (PlanGenerator.DEBUG) console.log("Adjusting sections for keepers");
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].type === "SA") {
          sections[i].type = "SK";
        }
        if (sections[i].cardioType === "CARDIO_1_LAKTAT") {
          sections[i].cardioType = "CARDIO_1_SHORT";
        }
      }
    }
    if (PlanGenerator.DEBUG)
      console.log("Set plan sections", JSON.parse(JSON.stringify(sections)));
    return sections;
  };

  static getFocusForTrainingDayGroup = (
    groupTrainingDays,
    ageGroup,
    places,
  ): ("PHASE" | "CARDIO" | "STABILITY" | "COMBINED")[] => {
    let trainingPossibilities = groupTrainingDays.map((day) => {
      let eq = places[day.place].equipment;
      return {
        ...day,
        hasWeights: hasWeights(eq),
        hasRunEquipment: hasRunEquipment(eq),
      };
    });
    if (ageGroup === WorkoutConstants.AGE_GROUPS.CHILD) {
      // training days should always be just one and kids only have phase training
      // map for backwards sanity
      return trainingPossibilities.map((e) => "PHASE");
    } else {
      // adults can have up to 3 training days in one group
      switch (trainingPossibilities.length) {
        case 1:
          //use PHASE
          return ["PHASE"];
        case 2:
          if (
            (trainingPossibilities[0].place === "STUDIO" &&
              trainingPossibilities[1].place !== "STUDIO") ||
            (trainingPossibilities[0].place !== "STUDIO" &&
              trainingPossibilities[1].place === "STUDIO")
          ) {
            // only one studio day and other is not home (see above) put phase there
            return trainingPossibilities.map((e) =>
              e.place === "STUDIO"
                ? "PHASE"
                : e.hasRunEquipment
                  ? "CARDIO"
                  : "STABILITY",
            );
          } else if (
            (trainingPossibilities[0].hasRunEquipment &&
              !trainingPossibilities[1].hasRunEquipment) ||
            (!trainingPossibilities[0].hasRunEquipment &&
              trainingPossibilities[1].hasRunEquipment)
          ) {
            // only one home day put phase there to have cardio somewhere else
            return trainingPossibilities.map((e) =>
              !e.hasRunEquipment ? "PHASE" : "CARDIO",
            );
          } else if (
            !trainingPossibilities[0].hasRunEquipment &&
            !trainingPossibilities[1].hasRunEquipment
          ) {
            // both home
            if (
              trainingPossibilities[1].duration >
              trainingPossibilities[0].duration
            ) {
              return ["STABILITY", "PHASE"];
            } else {
              return ["PHASE", "STABILITY"];
            }
          } else {
            // both or none is studio day
            // none is home day
            // put PHASE to longer training day
            if (
              trainingPossibilities[0].duration <
              trainingPossibilities[1].duration
            ) {
              // first day STABILITY/CARDIO depending on place
              return [
                trainingPossibilities[0].hasRunEquipment
                  ? "CARDIO"
                  : "STABILITY",
                "PHASE",
              ];
            }
            // otherway round
            return [
              "PHASE",
              trainingPossibilities[0].hasRunEquipment ? "CARDIO" : "STABILITY",
            ];
          }
        case 3:
          // no run eq => no cardio
          if (
            trainingPossibilities.filter((e) => !e.hasRunEquipment).length === 3
          ) {
            return ["PHASE", "STABILITY", "PHASE"];
          }
          // when HOME-GYM-HOME exactly as defined
          if (
            trainingPossibilities[0].place === "HOME" &&
            trainingPossibilities[1].place === "STUDIO" &&
            trainingPossibilities[2].place === "HOME"
          ) {
            let firstHome = trainingPossibilities[0].hasRunEquipment
              ? "CARDIO"
              : "STABILITY";
            let secondHome = "STABILITY";
            if (
              firstHome !== "CARDIO" &&
              trainingPossibilities[2].hasRunEquipment
            ) {
              secondHome = "CARDIO";
            }
            return [firstHome, "PHASE", secondHome];
          }

          // else match best
          let sorting: { [weekday: number]: string } = {};
          let focuses = ["PHASE", "CARDIO", "STABILITY"];
          let studioDays = trainingPossibilities.filter(
            (e) => e.place === "STUDIO",
          );
          let homeDays = trainingPossibilities.filter(
            (e) => e.place === "HOME",
          );
          let otherDays = trainingPossibilities.filter(
            (e) => e.place !== "STUDIO" && e.place !== "HOME",
          );
          // 1 - STUDIO
          while (focuses.length > 0 && studioDays.length > 0) {
            let longestStudioDayIndex = 0;
            for (let i = 0; i < studioDays.length; i++) {
              if (
                studioDays[i].duration >
                studioDays[longestStudioDayIndex].duration
              ) {
                longestStudioDayIndex = i;
              }
            }
            sorting[studioDays[longestStudioDayIndex].weekday] = focuses.splice(
              0,
              1,
            )[0];
            studioDays.splice(longestStudioDayIndex, 1);
          }
          // 2 - NOT HOME
          while (focuses.length > 0 && otherDays.length > 0) {
            let longestOtherDayIndex = 0;
            for (let i = 0; i < otherDays.length; i++) {
              if (
                otherDays[i].duration > otherDays[longestOtherDayIndex].duration
              ) {
                longestOtherDayIndex = i;
              }
            }
            sorting[otherDays[longestOtherDayIndex].weekday] = focuses.splice(
              0,
              1,
            )[0];
            otherDays.splice(longestOtherDayIndex, 1);
          }
          // 3 - HOME
          while (focuses.length > 0 && homeDays.length > 0) {
            let longestHomeDayIndex = 0;
            for (let i = 0; i < homeDays.length; i++) {
              if (
                homeDays[i].duration > homeDays[longestHomeDayIndex].duration
              ) {
                longestHomeDayIndex = i;
              }
            }
            let focus = focuses.splice(0, 1)[0];
            if (
              focus === "CARDIO" &&
              !homeDays[longestHomeDayIndex].hasRunEquipment
            ) {
              //no cardio possible at home => downgrade to stability
              focus = "STABILITY";
            }
            sorting[homeDays[longestHomeDayIndex].weekday] = focus;
            homeDays.splice(longestHomeDayIndex, 1);
          }
          let result = trainingPossibilities.map((e) => sorting[e.weekday]);
          if (result.indexOf("CARDIO") === -1) {
            // add cardio to phase focus
            result = result.map((e) => {
              if (e === "PHASE") return "COMBINED";
              return e;
            });
          }
          if (PlanGenerator.DEBUG) {
            console.log("Three day focus mapping");
            console.log("days", trainingPossibilities);
            console.log("focuses", sorting);
            console.log("mapping", result);
          }
          return result;
        default:
          return trainingPossibilities.map((e, i) =>
            i % 3 === 0 ? "PHASE" : i % 3 === 1 ? "CARDIO" : "STABILITY",
          );
      }
    }
  };

  static addToSkillTree = (
    skillTree: SkillTreeType,
    additionalSkillTree: SkillTreeType,
    workout: ExerciseBranchType[],
    userAge: string,
    userGender: string,
    userLevel: string,
    equipment: string[],
    pains: string[],
    exerciseBranchData: BranchDataMapType,
    exercises: ExerciseType[],
    branchIdsInUse: string[],
  ): SkillTreeType => {
    // DEV do not use exercises in goal, as long as all users act like goalkeepers
    const goalExercises = ["661", "662", "767", "768", "769"];
    for (let id in additionalSkillTree) {
      if (additionalSkillTree.hasOwnProperty(id) && additionalSkillTree[id]) {
        // DEV
        if (
          Object.keys(additionalSkillTree[id].levels).some(
            (levelKey) =>
              goalExercises.indexOf(
                additionalSkillTree[id].levels[Number(levelKey)].id,
              ) > -1,
          )
        ) {
          // DEV skip goal exercise
          continue;
        }
        // isSet
        // possibly also check for exercise ids > -1
        const isSet =
          additionalSkillTree[id].tags &&
          additionalSkillTree[id].tags.length > 0;
        //  already in use
        const inUse =
          branchIdsInUse.includes(id) ||
          workout.some((entry) => {
            return entry.exerciseBranchId === id;
          });

        // get tags for userLevel branch exercise
        const exercise = getUserExerciseFromBranch(
          additionalSkillTree[id],
          userLevel,
          exercises,
          exerciseBranchData[id] ? exerciseBranchData[id] : null,
        );
        if (typeof exercise === "undefined" || exercise === null) continue;

        // filter AGE & GENDER tags
        const age = getTagValues(additionalSkillTree[id].tags, TagGroups.AGE);
        const gender = getTagValues(
          additionalSkillTree[id].tags,
          TagGroups.GENDER,
        );
        //filter by equipment available
        const eq = getTagValues(exercise.tags, TagGroups.EQUIPMENT);
        const exerciseBlocks = getTagValues(exercise.tags, TagGroups.BLOCK);

        // filter adolescents as adults
        let ageFilter =
          userAge === WorkoutConstants.AGE_GROUPS.CHILD
            ? WorkoutConstants.AGE_GROUPS.CHILD
            : WorkoutConstants.AGE_GROUPS.ADULT;
        const matchesAge: boolean =
          age.length === 0 || age.indexOf(ageFilter) > -1;
        const matchesGender: boolean =
          gender.length === 0 || gender.indexOf(userGender) > -1;
        const matchesEquipment =
          eq.length === 0 ||
          eq.every((part) => {
            return equipmentExists(
              part,
              equipment,
              eq,
              Object.keys(additionalSkillTree[id].levels).map(
                (levelKey) =>
                  additionalSkillTree[id].levels[Number(levelKey)].id,
              ),
            );
          });
        const matchesPains =
          pains.length === 0 ||
          pains.every((pain) => exerciseBlocks.indexOf(pain) === -1);

        if (
          isSet &&
          !inUse &&
          matchesAge &&
          matchesGender &&
          matchesEquipment &&
          matchesPains
        ) {
          // keep this branch
          skillTree[id] = additionalSkillTree[id];
        } else {
          if (PlanGenerator.DEBUG) {
            console.log(
              "Branch " + id + " filtered by",
              "is set",
              !isSet,
              "in use",
              inUse,
              "age",
              !matchesAge,
              "gender",
              !matchesGender,
              "equipment",
              !matchesEquipment,
              "pains",
              !matchesPains,
            );
          }
        }
      }
    }
    return skillTree;
  };
}
