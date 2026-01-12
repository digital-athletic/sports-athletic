import { type UserSkills } from "@/features/statistics/models/WorkoutsData";
import { type TrainingTimeType } from "../models/Training";

/**
 * Converts skill time data from milliseconds to seconds for display
 * Matches legacy SharedFunctions.getSkillCounts behavior
 */
export const calculateSkillsFromTime = (
  skillTime: TrainingTimeType["skill"],
): UserSkills => ({
  PREVENTION: skillTime.PREVENTION
    ? Math.floor(skillTime.PREVENTION / 1000)
    : 0,
  MOBILITY: skillTime.MOBILITY ? Math.floor(skillTime.MOBILITY / 1000) : 0,
  SWR: skillTime.SWR ? Math.floor(skillTime.SWR / 1000) : 0,
  WARMUP: skillTime.WARMUP ? Math.floor(skillTime.WARMUP / 1000) : 0,
  STABILITY: skillTime.STABILITY ? Math.floor(skillTime.STABILITY / 1000) : 0,
  CARDIO: skillTime.CARDIO ? Math.floor(skillTime.CARDIO / 1000) : 0,
});
