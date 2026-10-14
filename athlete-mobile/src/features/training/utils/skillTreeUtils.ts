import { TagGroups } from "@/constants/tagGroups";
import { areaToRegion } from "./exerciseUtils";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { SkillTreesState } from "@/data/skillTreeRegistry";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  SkillBranchType,
  SkillTreeType,
} from "@/schemas/skillTree.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import { getTagValues } from "../../../utils/tagUtils";
import { TemporalDataType } from "../models/TemporalData";
import type { FocusArea } from "../models/Training";
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
      result = skillTrees["PLYO"];
      break;

    // plyometric intensities are tags inside the PLYO tree
    case "PLYO_HIGH":
    case "PLYO_MEDIUM":
    case "PLYO_LOW":
      result = Object.fromEntries(
        Object.entries(skillTrees["PLYO"] ?? {}).filter(([, branch]) =>
          branch.tags.includes(`SKILL_${skill}`),
        ),
      );
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

    // User-facing skill types mapped to internal skill tree names
    case "MOBILITY":
      result = skillTrees["MOB"];
      break;

    case "WARMUP":
      result = skillTrees["WU"];
      break;

    case "FOAM_ROLLER":
      result = skillTrees["BR"];
      break;

    case "STABILITY":
      result = hasWeightsFlag ? skillTrees["BAS"] : skillTrees["GKS"];
      break;

    case "CARDIO":
      result = skillTrees["CD"];
      break;

    case "PREVENTION":
      result = hasWeightsFlag ? skillTrees["PREV"] : skillTrees["PREVKG"];
      break;

    case "SUPPORT":
      result = skillTrees["SUPPORT"];
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
 * Resolves the branch level from the stored branch level, otherwise from the
 * entry level of the user's fitness level, falling back downward.
 */
export function resolveBranchLevel(
  branchData: SkillBranchType,
  userLevel: string,
  userBranchData?: UserExerciseBranchDataType | null,
): number | null {
  if (userBranchData?.level && branchData.levels[userBranchData.level]) {
    return userBranchData.level;
  }

  let level = 1; // BEGINNER
  if (userLevel === "ADVANCED") {
    level = 2;
  }
  if (userLevel === "PROFESSIONAL") {
    level = 3;
  }

  for (; level > 0; level--) {
    if (branchData.levels[level]) {
      return level;
    }
  }
  return null;
}

/**
 * Resolves the exercise ID of a branch at its resolved level.
 */
export function resolveBranchExerciseId(
  branchData: SkillBranchType,
  userLevel: string,
  userBranchData?: UserExerciseBranchDataType | null,
): string | null {
  const level = resolveBranchLevel(branchData, userLevel, userBranchData);
  if (level === null) {
    return null;
  }
  const levelData: { exerciseId?: string; id?: string } =
    branchData.levels[level];
  return levelData.exerciseId || levelData.id || null;
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
  const exerciseId = resolveBranchExerciseId(
    branchData,
    userLevel,
    userBranchData,
  );

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

  if (areas.length > 1) {
    throw {
      type: "TOO_MUCH_SORENESS",
      subtype: "MULTIPLE_REGIONS",
      params: areas.map(areaToRegion),
    };
  }

  if (skill.includes("CARDIO") && areas.includes("lowerBody")) {
    return {
      keep: {},
      replace: [WorkoutConstants.EXERCISE_DIRECTIONS.LOWER_BODY],
    };
  }

  const keep: SkillTreeType = {};
  const replace: string[] = [];
  const areasAsRegions = areas.map(areaToRegion);

  for (const branchId of Object.keys(branches)) {
    const branchRegions = getTagValues(
      branches[branchId].tags,
      TagGroups.REGION,
    );
    const matchesArea = branchRegions.some((region) =>
      areasAsRegions.includes(region),
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
  const areaMap: Record<"upperBody" | "lowerBody" | "core", string[]> = {
    upperBody: [
      "CHEST",
      "NECK",
      "UPPER_BACK",
      "SHOULDER_RIGHT",
      "SHOULDER_LEFT",
      "SHOULDER_FRONT",
      "SHOULDER_FRONT_LEFT",
      "SHOULDER_FRONT_RIGHT",
      "SHOULDER_REAR",
      "SHOULDER_REAR_LEFT",
      "SHOULDER_REAR_RIGHT",
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
    lowerBody: [
      "ADDUCTORS",
      "ADDUCTORS_LEFT",
      "ADDUCTORS_RIGHT",
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
      "GLUTES_LEFT",
      "GLUTES_RIGHT",
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

/**
 * Maps any skill code to a FocusArea.
 * This is the SINGLE conversion point for the entire codebase.
 *
 * Handles:
 * - FocusArea pass-through (e.g., "MOBILITY" -> "MOBILITY")
 * - SkillCode conversion (e.g., "MOB" -> "MOBILITY")
 * - Legacy SkillType (e.g., "FOAM_ROLLER" -> "MOBILITY")
 */
export const mapSkillCodeToFocusArea = (
  skillCode: string,
): FocusArea | undefined => {
  switch (skillCode) {
    // Focus areas pass through unchanged
    case "PREVENTION":
    case "MOBILITY":
    case "SWR":
    case "WARMUP":
    case "STABILITY":
    case "CARDIO":
      return skillCode;

    // Prevention codes
    case "PREV":
    case "PREVKNEE":
    case "PREVSHOULDER":
    case "PREVWRIST":
    case "PREVANKLE":
    case "PREVSPINE":
      return "PREVENTION";

    // Warmup codes (including cooldown)
    case "WU":
    case "WUPREV":
    case "WUSPEZIAL":
    case "WUSKSA":
    case "CD":
      return "WARMUP";

    // Mobility codes (including foam roller)
    case "MOB":
    case "BR":
    case "FOAM_ROLLER":
      return "MOBILITY";

    // Stability codes
    case "BAS":
    case "GKS":
    case "GKSKG":
      return "STABILITY";

    // SWR/Strength codes
    case "SWR1":
    case "SWR1KG":
    case "SWR2":
    case "SWR2KG":
    case "SK":
    case "SKKG":
    case "MAX":
    case "MAX_STRENGTH":
    case "main":
    case "PHASE":
    case "TEST":
      return "SWR";

    // Cardio codes
    case "SA":
    case "SAKG":
    case "SAS":
    case "SASKG":
    case "CARDIO_1":
    case "CARDIO_1_SHORT":
    case "CARDIO_1_LAKTAT":
    case "CARDIO_2":
    case "CARDIO_3":
    case "CARDIO_4":
    case "CARDIO_5":
    case "HBCARDIO":
      return "CARDIO";

    // Non-focus skill types (excluded from radar chart)
    case "SUPPORT":
    case "POWER_ENDURANCE_SPECIAL":
      return undefined;

    default:
      return undefined;
  }
};

const PREVENTION_PREFIX = "PREV";

export const isPreventionSkill = (skill: string): boolean =>
  skill.startsWith(PREVENTION_PREFIX);
