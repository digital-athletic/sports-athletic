import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import {
  type CopiedBranchesType,
  readCopiedBranches,
  type UserTrainingType,
} from "@/features/training/models/UserTraining";

const SKILL_TAG_RENAME_MAP: Record<string, string> = {
  SKILL_SCHNELLKRAFT: "SKILL_EXPLOSIVE_POWER",
  SKILL_MAX_KRAFT: "SKILL_MAX_STRENGTH",
  SKILL_MAX_KRAFT_TEST: "SKILL_MAX_STRENGTH_TEST",
  // A correction, not a translation: these tags mark the power endurance
  // (Schnellkraftausdauer) trees SA, SAKG and SAS, but named speed
  // endurance (Schnelligkeitsausdauer), a different training concept.
  SKILL_SCHNELLIGKEITSAUSDAUER: "SKILL_POWER_ENDURANCE",
  SKILL_SCHNELLIGKEITSAUSDAUER_SPECIAL: "SKILL_POWER_ENDURANCE_SPECIAL",
};

/** Renames German skill tags to their English equivalents. */
export function migrateSkillTags(tags: string[]): string[] {
  return tags.map((tag) => SKILL_TAG_RENAME_MAP[tag] ?? tag);
}

const migrateTrainingSkills = (
  skills: CopiedBranchesType,
): CopiedBranchesType =>
  Object.fromEntries(
    Object.entries(skills).map(([skillKey, branches]) => [
      skillKey,
      branches?.map((branch) => ({
        ...branch,
        tags: migrateSkillTags(branch.tags ?? []),
      })),
    ]),
  );

/**
 * Renames the skill tags of an old training's branches. A training without
 * copied branches, such as one stored as an AIWL workout, stays unchanged.
 */
const migrateTraining = (training: UserTrainingType): UserTrainingType => {
  const skills = readCopiedBranches(training);
  return skills
    ? { ...training, skills: migrateTrainingSkills(skills) }
    : training;
};

/** Renames the skill tags of every branch the stored plan copied from the skill trees. */
export function migratePlanSkillTags(
  plan: TrainingPlanType | null,
): TrainingPlanType | null {
  if (!plan) return plan;

  return {
    ...plan,
    sections: plan.sections.map((section) => ({
      ...section,
      trainings: section.trainings.map(migrateTraining),
    })),
  };
}
