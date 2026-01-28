import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  SkillBranchType,
  SkillTreeType,
} from "@/schemas/skillTree.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import type { SkillTreesState } from "@/store/skillTreesStore";
import { getTagValues } from "../../../utils/tagUtils";
import { TemporalDataType } from "../models/TemporalData";
import { SkillFocusType } from "../models/Training";
import { hasWeights } from "./equipmentUtils";

/**
 * Gets the appropriate skill tree based on skill and context
 */
export function getSkillTree(
  skillTrees: SkillTreesState["skillTrees"],
  skill: string,
  prevSkills: string[] = [],
  hasWeightsFlag: boolean = false,
  isShortWorkout?: boolean,
  temporalData?: TemporalDataType[],
  replacementCount?: number,
): SkillTreeType {
  // Default: take tree by skill
  let result = skillTrees[skill];

  // Cases requiring conditional selection
  switch (skill) {
    case "GKS":
    case "GKSKG":
      result = hasWeightsFlag ? skillTrees["GKS"] : skillTrees["GKSKG"];
      break;

    case "PLYO":
    case "PLYO_MEDIUM":
    case "PLYO_HIGH":
      result = skillTrees["PLYO"];
      break;

    case "PREVKNEE":
    case "PREVSHOULDER":
    case "PREVANKLE":
    case "PREVSPINE":
    case "PREVWRIST":
      let prevSkillTree = hasWeightsFlag
        ? skillTrees["PREV"]
        : skillTrees["PREVKG"];
      if (isShortWorkout) {
        prevSkillTree = {
          ...skillTrees["PREV"],
          ...skillTrees["PREVKG"],
        };
      }
      if (temporalData && replacementCount) {
        if (prevSkills.length > 0) {
          const prevRegion = getRegionsForPreventionSkills([skill]);
          const branchesToUse = Object.keys(prevSkillTree).filter((s) =>
            getTagValues(prevSkillTree[s].tags, TagGroups.PREVENTION).some(
              (v) => prevRegion.includes(v),
            ),
          );
          const branches = branchesToUse.reduce<SkillTreeType>(
            (acc, branchId) => {
              acc[branchId] = prevSkillTree[branchId];
              return acc;
            },
            {},
          );
          let filteredBranches = filterBySoreness(
            branches,
            temporalData,
            skill,
          ).keep;
          if (Object.keys(filteredBranches).length >= replacementCount) {
            result = filteredBranches;
            break;
          }
          const otherPrevSkills = prevSkills.filter((p) => p !== skill);
          for (const otherSkill of otherPrevSkills) {
            const prevRegion = getRegionsForPreventionSkills([otherSkill]);
            const branchesToUse = Object.keys(prevSkillTree).filter((s) =>
              getTagValues(prevSkillTree[s].tags, TagGroups.PREVENTION).some(
                (v) => prevRegion.includes(v),
              ),
            );
            const branches = branchesToUse.reduce<SkillTreeType>(
              (acc, branchId) => {
                acc[branchId] = prevSkillTree[branchId];
                return acc;
              },
              {},
            );
            let filteredBranches = filterBySoreness(
              branches,
              temporalData,
              skill,
            ).keep;
            if (Object.keys(filteredBranches).length >= replacementCount) {
              result = filteredBranches;
              break;
            }
          }
          if (result === skillTrees[skill]) {
            result = {};
          }
        } else {
          result = {};
        }
      } else {
        if (prevSkills.length > 0) {
          const prevRegions = getRegionsForPreventionSkills(prevSkills);
          const branchesToUse = Object.keys(prevSkillTree).filter((s) =>
            getTagValues(prevSkillTree[s].tags, TagGroups.PREVENTION).some(
              (v) => prevRegions.includes(v),
            ),
          );
          if (branchesToUse.length === 0) {
            result = prevSkillTree;
          } else {
            const prevBranches = branchesToUse.reduce<SkillTreeType>(
              (acc, branchId) => {
                acc[branchId] = prevSkillTree[branchId];
                return acc;
              },
              {},
            );
            result = prevBranches;
          }
        } else {
          result = prevSkillTree;
        }
      }
      break;

    case "SA":
    case "SAKG":
      result = hasWeightsFlag ? skillTrees["SA"] : skillTrees["SAKG"];
      break;

    case "SK":
    case "SKKG":
      result = hasWeightsFlag ? skillTrees["SK"] : skillTrees["SKKG"];
      break;

    case "SWR":
    case "SWR1":
    case "SWR2":
    case "SWR1KG":
    case "SWR2KG":
      result = hasWeightsFlag ? skillTrees["SWR1"] : skillTrees["SWR1KG"];
      break;

    case "WUSPEZIAL":
      let wuSpezialSkillTree = skillTrees["WUSPEZIAL"];
      if (temporalData && replacementCount) {
        if (prevSkills.length > 0) {
          for (const prevSkill of prevSkills) {
            const prevRegion = getRegionsForPreventionSkills([prevSkill]);
            const branchesToUse = Object.keys(wuSpezialSkillTree).filter((s) =>
              getTagValues(wuSpezialSkillTree[s].tags, TagGroups.PAIN).some(
                (v) => prevRegion.includes(v),
              ),
            );
            const branches = branchesToUse.reduce<SkillTreeType>(
              (acc, branchId) => {
                acc[branchId] = wuSpezialSkillTree[branchId];
                return acc;
              },
              {},
            );
            let filteredBranches = filterBySoreness(
              branches,
              temporalData,
              skill,
            ).keep;
            if (Object.keys(filteredBranches).length >= replacementCount) {
              result = filteredBranches;
              break;
            }
          }
          if (result === skillTrees[skill]) {
            result = {};
          }
        } else {
          result = {};
        }
      } else {
        if (prevSkills.length > 0) {
          const prevRegions = getRegionsForPreventionSkills(prevSkills);
          const branchesToUse = Object.keys(wuSpezialSkillTree).filter((s) =>
            getTagValues(wuSpezialSkillTree[s].tags, TagGroups.PAIN).some((v) =>
              prevRegions.includes(v),
            ),
          );
          if (branchesToUse.length === 0) {
            result = wuSpezialSkillTree;
          } else {
            const wuBranches = branchesToUse.reduce<SkillTreeType>(
              (acc, branchId) => {
                acc[branchId] = wuSpezialSkillTree[branchId];
                return acc;
              },
              {},
            );
            result = wuBranches;
          }
        } else {
          result = wuSpezialSkillTree;
        }
      }
      break;

    case "ALL":
      result = Object.keys(skillTrees).reduce(
        (acc, skillName) => Object.assign(acc, skillTrees[skillName]),
        {},
      );
      break;

    default:
      break;
  }

  if (!result) {
    console.log("no skill tree found for", skill);
    result = {};
  }

  // Remove branches without levels
  const filtered = Object.keys(result).reduce<SkillTreeType>(
    (acc, branchId) => {
      if (
        result[branchId].levels &&
        Object.keys(result[branchId].levels).length > 0
      ) {
        acc[branchId] = result[branchId];
      }
      return acc;
    },
    {},
  );

  return filtered;
}

/**
 * Gets branch ID for given exercise name and skill
 */
export function getBranchIdByNameAndSkill(name: string, skill: string): string {
  let result: string = "-1";
  switch (name) {
    case "SQUAT":
      if (skill.includes("SWR")) {
        result = "25";
      } else if (skill.includes("MAX")) {
        result = "143";
      } else if (skill.includes("SK")) {
        result = "219";
      } else if (skill.includes("SA")) {
        result = "316";
      }
      break;
    case "DEADLIFT":
      if (skill.includes("SWR")) {
        result = "663";
      } else if (skill.includes("MAX")) {
        result = "145";
      } else if (skill.includes("SK")) {
        result = "661";
      } else if (skill.includes("SA")) {
        result = "662";
      }
      break;
    case "BENCH_PRESS":
      if (skill.includes("SWR")) {
        result = "26";
      } else if (skill.includes("MAX")) {
        result = "134";
      } else if (skill.includes("SK")) {
        result = "215";
      } else if (skill.includes("SA")) {
        result = "314";
      }
      break;
    case "ROWING":
      if (skill.includes("SWR")) {
        result = "664";
      } else if (skill.includes("MAX")) {
        result = "141";
      } else if (skill.includes("SK")) {
        result = "665";
      } else if (skill.includes("SA")) {
        result = "666";
      }
      break;
    case "SHOULDER_PRESS":
      if (skill.includes("SWR")) {
        result = "5";
      } else if (skill.includes("MAX")) {
        result = "140";
      } else if (skill.includes("SK")) {
        result = "667";
      } else if (skill.includes("SA")) {
        result = "668";
      }
      break;
    case "CALFLIFT":
      result = "53";
      break;
    default:
      break;
  }
  return result;
}

/**
 * Gets exercise IDs for given branch names and skill
 */
export function getBranchIdsByNames(
  exerciseNames: string[],
  skill: string,
): string[] {
  return exerciseNames.map((name) => getBranchIdByNameAndSkill(name, skill));
}

/**
 * Gets the appropriate exercise from a skill branch based on user level/progress
 */
export function getUserExerciseFromBranch(
  branchData: SkillBranchType,
  userLevel: string,
  exercises: ExerciseType[],
  userBranchData?: UserExerciseBranchDataType | null,
  log = false,
): ExerciseType | null {
  let exerciseId: string | null = null;

  // First try user's specific progress level
  if (userBranchData?.level && branchData.levels[userBranchData.level]) {
    const levelData = branchData.levels[userBranchData.level] as any;
    exerciseId = levelData.exerciseId ? levelData.exerciseId : levelData.id;
  } else {
    // Fall back to user's general skill level
    let level = 1; // BEGINNER
    if (userLevel === "ADVANCED") {
      level = 2;
    }
    if (userLevel === "PROFESSIONAL") {
      level = 3;
    }

    // Use most specific available level
    for (; level > 0; level--) {
      if (branchData.levels[level]) {
        const levelData = branchData.levels[level] as any;
        exerciseId = levelData.exerciseId ? levelData.exerciseId : levelData.id;
        break;
      }
    }
  }

  if (exerciseId === null) {
    if (log) {
      console.log("Could not find matching level from branch", branchData);
      console.log("userBranchData", userBranchData);
      console.log("userLevel", userLevel);
    }
    return null;
  }

  const result = exercises.find((ex) => ex.id === exerciseId);

  if (!result && exerciseId !== "-1") {
    if (log) {
      console.log("Could not find exercise from branch", branchData);
      console.log("exerciseId", exerciseId);
      console.log("userLevel", userLevel);
    }
    return null;
  }

  return result || null;
}

/**
 * Filters exercises by equipment type (kg vs weights)
 */
export function getNextTypeFiltered<T extends { tags: string[] }>(
  type: "kg" | "weight",
  listWithTags: T[],
): T[] {
  return listWithTags.filter((possEx) => {
    const exEq = getTagValues(possEx.tags, TagGroups.EQUIPMENT);
    const exHasWeights = hasWeights(exEq);
    return type === "kg" ? !exHasWeights : exHasWeights;
  });
}

/**
 * Returns regions for given prevention skills
 */
function getRegionsForPreventionSkills(preventionSkills: string[]): string[] {
  let prevRegions: string[] = [];
  for (const skill of preventionSkills) {
    switch (skill) {
      case "PREVANKLE":
        prevRegions = prevRegions.concat(["ANKLE"]);
        break;
      case "PREVKNEE":
        prevRegions = prevRegions.concat(["KNEE", "HIP", "KNEE_HIP"]);
        break;
      case "PREVSHOULDER":
        prevRegions = prevRegions.concat(["SHOULDER"]);
        break;
      case "PREVSPINE":
        prevRegions = prevRegions.concat(["SPINE"]);
        break;
      case "PREVWRIST":
        prevRegions = prevRegions.concat(["WRIST", "ELBOW", "WRIST_ELBOW"]);
        break;
    }
  }
  return prevRegions;
}

/**
 * Filters branches by soreness/temporal data
 */
function filterBySoreness(
  branches: SkillTreeType,
  temporalData: TemporalDataType[] | undefined,
  skill: string,
  isShortWorkout = false,
): { keep: SkillTreeType; replace: string[] } {
  if (
    !temporalData ||
    temporalData.length === 0 ||
    WorkoutConstants.IGNORE_SORENESS_SKILLS.includes(skill)
  ) {
    return {
      keep: branches,
      replace: [],
    };
  }

  const areas = getAreasFor(temporalData.map((entry) => entry.tag));

  if (isShortWorkout && skill.includes("PREV")) {
    let soreInArea = false;
    switch (skill) {
      case "PREVSHOULDER":
      case "PREVWRIST":
        soreInArea = areas.some((area) => area.toUpperCase() === "UPPER_BODY");
        break;
      case "PREVSPINE":
        soreInArea = areas.some((area) => area.toUpperCase() === "CORE");
        break;
      case "PREVKNEE":
      case "PREVANKLE":
        soreInArea = areas.some((area) => area.toUpperCase() === "LOWER_BODY");
        break;
      default:
        break;
    }
    if (soreInArea) {
      throw {
        type: "TOO_MUCH_SORENESS",
        subtype: "PREV_SHORT_TRAINING_SORENESS",
        params: areas.map((area) => area.toUpperCase()),
      };
    }
  }

  if (areas.length > 1) {
    throw {
      type: "TOO_MUCH_SORENESS",
      subtype: "MULTIPLE_REGIONS",
      params: areas.map((area) => area.toUpperCase()),
    };
  }

  if (skill.includes("CARDIO") && areas.includes("lower_body")) {
    return {
      keep: {},
      replace: [WorkoutConstants.EXERCISE_DIRECTIONS.LOWER_BODY],
    };
  }

  const keep: SkillTreeType = {};
  const replace: string[] = [];
  const areasUpper = areas.map((area) => area.toUpperCase());

  for (const branchId of Object.keys(branches)) {
    const branchRegions = getTagValues(
      branches[branchId].tags,
      TagGroups.REGION,
    );
    const matchesArea = branchRegions.some((region) =>
      areasUpper.includes(region.toUpperCase()),
    );

    if (matchesArea) {
      replace.push(...branchRegions);
    } else {
      keep[branchId] = branches[branchId];
    }
  }

  return {
    keep,
    replace,
  };
}

function getAreasFor(muscles: string[]): string[] {
  const areaMap: Record<"upper_body" | "lower_body" | "core", string[]> = {
    upper_body: [
      "CHEST",
      "NECK",
      "UPPER_BACK",
      "SHOULDER_RIGHT",
      "SHOULDER_LEFT",
      "SHOULDER_FRONT",
      "SHOULDER_REAR",
      "SHOULDER",
      "SCAPULAR_STABILIZER_REAR",
      "SCAPULAR_STABILIZER_FRONT",
      "BICEPS_RIGHT",
      "BICEPS_LEFT",
      "BICEPS",
      "TRICEPS",
      "TRICEPS_RIGHT",
      "TRICEPS_LEFT",
      "WRIST_FLEXOR_RIGHT",
      "WRIST_FLEXOR_LEFT",
      "WRIST_FLEXOR",
      "FINGER_WRIST_FLEXOR_RIGHT",
      "FINGER_WRIST_FLEXOR_LEFT",
      "FINGER_WRIST_FLEXOR",
      "FINGER_WRIST_MUSCLES_RIGHT",
      "FINGER_WRIST_MUSCLES_LEFT",
      "FINGER_WRIST_MUSCLES",
      "LATISSIMUS_RIGHT",
      "LATISSIMUS_LEFT",
      "LATISSIMUS",
      "WRIST_EXTENSOR_RIGHT",
      "WRIST_EXTENSOR_LEFT",
      "WRIST_EXTENSOR",
    ],
    lower_body: [
      "ADDUCTORS",
      "QUADRICEPS_LEFT",
      "QUADRICEPS_RIGHT",
      "QUADRICEPS",
      "ABDUCTORS_RIGHT",
      "ABDUCTORS_LEFT",
      "ABDUCTORS",
      "CALF_RIGHT",
      "CALF_LEFT",
      "CALF",
      "CALVES",
      "HAMSTRINGS_RIGHT",
      "HAMSTRINGS_LEFT",
      "HAMSTRINGS",
      "INNER_THIGH_REAR_RIGHT",
      "INNER_THIGH_REAR_LEFT",
      "INNER_THIGH",
      "OUTER_THIGH",
      "HAMSTRINGS",
      "SHIN",
      "SHIN_LEFT",
      "SHIN_RIGHT",
      "ANKLE",
      "GLUTES",
      "HIP_FLEXOR",
      "HIP_INTERNAL_ROTATOR",
      "HIP_EXTERNAL_ROTATOR",
    ],
    core: ["RECTUS_ABDOMINIS", "OBLIQUES", "LOWER_BACK"],
  };

  const normalized = muscles.map((muscle) => muscle.toUpperCase());

  return (Object.keys(areaMap) as (keyof typeof areaMap)[]).filter((area) =>
    areaMap[area].some((muscle) => normalized.includes(muscle)),
  );
}

export const mapSkillToFocusArea = (
  skill: string,
): SkillFocusType | undefined => {
  switch (skill) {
    case "PREVSHOULDER":
    case "PREVKNEE":
    case "PREVWRIST":
    case "PREVANKLE":
    case "PREVSPINE":
    case "PREV":
      return "PREVENTION";
    case "WU":
    case "WUSKSA":
    case "WUSPEZIAL":
    case "CD":
      return "WARMUP";
    case "STABILITY":
    case "BAS":
    case "GKS":
      return "STABILITY";
    case "MOBILITY":
    case "MOB":
    case "BR":
      return "MOBILITY";
    case "SWR1":
    case "SWR1KG":
    case "SWR2":
    case "SWR2KG":
    case "MAX_KRAFT":
    case "MAX":
    case "SK":
    case "SKKG":
    case "SWR":
      return "SWR";
    case "SA":
    case "SAKG":
    case "CARDIO_1K":
    case "CARDIO_1L":
    case "CARDIO_2":
    case "CARDIO_3":
    case "CARDIO_4":
    case "CARDIO_5":
    case "HBCARDIO":
      return "CARDIO";
    default:
      return undefined;
  }
};
