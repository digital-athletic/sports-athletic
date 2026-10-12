import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { MigrationMap } from "./createMigrate";
import type { State } from "../exerciseProgressStore";

// Older versions could save a level above the top or in a gap of a branch.
// Such a level moves to the next lower existing level, else to the lowest.
const existingLevel = (level: number, levels: number[]): number => {
  if (levels.includes(level)) return level;
  const lower = levels.filter((candidate) => candidate < level);
  return lower.length > 0 ? Math.max(...lower) : Math.min(...levels);
};

const authoredLevelsByBranch = (): Record<string, number[]> => {
  const result: Record<string, number[]> = {};
  for (const tree of Object.values(getAllSkillTrees())) {
    for (const [branchId, branch] of Object.entries(tree)) {
      const levels = Object.keys(branch.levels ?? {}).map(Number);
      if (levels.length > 0) result[branchId] = levels;
    }
  }
  return result;
};

// Jump squats with authored test-based weights. Their stored weights were
// 15-25% of the old base and would override the new 5-20% squat 1RM range.
const JUMP_SQUAT_IDS_WITH_RESET_WEIGHT = ["292", "294"];

export const exerciseProgressStoreMigrations: MigrationMap<State> = {
  14: (state) => {
    const testHistory = state.testHistory;
    if (!testHistory || testHistory.length === 0) return state;

    const migratedHistory = testHistory.map((entry) => {
      const raw = entry as Record<string, unknown>;
      const { testDate, knee, hip, ...rest } = raw;
      return {
        ...rest,
        testAt: testDate ?? 0,
        kneeDominant: knee ?? {},
        hipHinge: hip ?? {},
      };
    });

    return {
      ...state,
      testHistory: migratedHistory,
    } as State;
  },
  15: (state) => {
    const exerciseData = { ...state.exerciseData };
    for (const exerciseId of JUMP_SQUAT_IDS_WITH_RESET_WEIGHT) {
      const entry = exerciseData[exerciseId];
      if (entry?.weight === undefined) continue;
      const withoutWeight = { ...entry };
      delete withoutWeight.weight;
      exerciseData[exerciseId] = withoutWeight;
    }
    return { ...state, exerciseData };
  },
  16: (state) => {
    const levelsByBranch = authoredLevelsByBranch();
    const branchData = { ...state.branchData };
    for (const [branchId, entry] of Object.entries(branchData)) {
      const levels = levelsByBranch[branchId];
      if (!entry || !levels) continue;
      branchData[branchId] = {
        ...entry,
        level: existingLevel(entry.level, levels),
      };
    }
    return { ...state, branchData };
  },
};
