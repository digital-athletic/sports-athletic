import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";

export interface BranchMaintenanceInput {
  branchData: BranchDataMapType;
  branches: Record<string, SkillBranchType>;
  fitnessLevel: string;
  lastSessionAt: number | null;
  now: number;
}

export const maintainBranchLevels = (
  _input: BranchMaintenanceInput,
): BranchDataMapType => {
  throw new Error("not implemented");
};
