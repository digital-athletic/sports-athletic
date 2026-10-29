import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type { MigrationMap } from "./createMigrate";
import type { State } from "../exerciseProgressStore";

// Older versions could save a level above the top or in a gap of a branch.
// Such a level moves to the next lower existing level. A level below the
// lowest stays: it already falls back to the athlete's entry level.
const existingLevel = (level: number, levels: number[]): number => {
  if (levels.includes(level)) return level;
  const lower = levels.filter((candidate) => candidate < level);
  return lower.length > 0 ? Math.max(...lower) : level;
};

const branchesById = (): Record<string, SkillBranchType> =>
  Object.assign({}, ...Object.values(getAllSkillTrees()));

const authoredLevelsByBranch = (): Record<string, number[]> => {
  const result: Record<string, number[]> = {};
  for (const [branchId, branch] of Object.entries(branchesById())) {
    const levels = Object.keys(branch.levels ?? {}).map(Number);
    if (levels.length > 0) result[branchId] = levels;
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
  // Reconciliation compares the stored exercise with later content, so each
  // stored level records the exercise the branch holds there today.
  17: (state) => {
    const branches = branchesById();
    const branchData = { ...state.branchData };
    for (const [branchId, entry] of Object.entries(branchData)) {
      const exerciseId =
        entry && branches[branchId]?.levels[entry.level]?.exerciseId;
      if (!entry || !exerciseId) continue;
      branchData[branchId] = { ...entry, exerciseId };
    }
    return { ...state, branchData };
  },
  // The old standard progression changed cardio levels; cardio has entry levels only.
  18: (state) => {
    const cardioBranchIds = Object.entries(getAllSkillTrees())
      .filter(([treeName]) => treeName.startsWith("CARDIO"))
      .flatMap(([, tree]) => Object.keys(tree));
    const branchData = { ...state.branchData };
    for (const branchId of cardioBranchIds) {
      delete branchData[branchId];
    }
    return { ...state, branchData };
  },
  // Progress is kept per skill; each older record moves to the skill it names.
  19: (state) => {
    const exerciseProgress = { ...state.exerciseProgress };
    for (const [exerciseId, record] of Object.entries(state.exerciseData)) {
      if (!record) continue;
      const bySkill = { ...exerciseProgress[record.skill] };
      bySkill[exerciseId] ??= { ...record };
      exerciseProgress[record.skill] = bySkill;
    }
    return { ...state, exerciseProgress };
  },
};
