import { SharedConstants } from "@/constants/sharedConstants";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type {
  BranchDataMapType,
  UserExerciseBranchDataType,
} from "@/store/exerciseProgressStore";
import { maintainBranchLevels } from "./branchMaintenance";

const WEEK = 7 * SharedConstants.TIME_IN_MS.DAY;
const now = new Date(2026, 9, 12, 12).getTime();

const branchOf = (exercises: Record<number, string>): SkillBranchType => ({
  tags: ["REGION_CORE", "SIDE_BOTH"],
  levels: Object.fromEntries(
    Object.entries(exercises).map(([level, exerciseId]) => [
      level,
      { exerciseId },
    ]),
  ),
});

const maintain = (
  branch: SkillBranchType,
  stored: UserExerciseBranchDataType,
  options: {
    fitnessLevel?: string;
    lastSessionAt?: number | null;
    now?: number;
  } = {},
): UserExerciseBranchDataType | undefined =>
  maintainBranchLevels({
    branchData: { [stored.branchId]: stored },
    branches: { [stored.branchId]: branch },
    fitnessLevel: options.fitnessLevel ?? "BEGINNER",
    lastSessionAt: options.lastSessionAt ?? now,
    now: options.now ?? now,
  })[stored.branchId];

describe("maintainBranchLevels: reconciliation", () => {
  it("keeps a stored level that is still authored", () => {
    const result = maintain(branchOf({ 1: "A", 2: "B", 3: "C" }), {
      branchId: "1",
      level: 2,
      exerciseId: "B",
    });
    expect(result).toMatchObject({ level: 2, exerciseId: "B" });
  });

  it("moves the progress to the level that now holds the stored exercise", () => {
    const result = maintain(branchOf({ 1: "A", 2: "X", 4: "B" }), {
      branchId: "1",
      level: 3,
      exerciseId: "B",
    });
    expect(result).toMatchObject({ level: 4, exerciseId: "B" });
  });

  it("falls back to the next lower authored level when the stored exercise is gone", () => {
    const result = maintain(branchOf({ 1: "A", 2: "X", 4: "Y" }), {
      branchId: "1",
      level: 3,
      exerciseId: "B",
    });
    expect(result).toMatchObject({ level: 2, exerciseId: "X" });
  });

  it("falls back to the next lower authored level when the stored exercise has no unique level", () => {
    const result = maintain(branchOf({ 1: "A", 2: "B", 4: "B" }), {
      branchId: "1",
      level: 3,
      exerciseId: "B",
    });
    expect(result).toMatchObject({ level: 2, exerciseId: "B" });
  });

  it("falls back to the next lower authored level when the stored record has no exercise", () => {
    const result = maintain(branchOf({ 1: "A", 2: "B", 4: "C" }), {
      branchId: "1",
      level: 3,
    });
    expect(result).toMatchObject({ level: 2, exerciseId: "B" });
  });

  it("keeps the record of a branch that no skill tree holds", () => {
    const stored = { branchId: "9", level: 3, exerciseId: "B" };
    const result = maintainBranchLevels({
      branchData: { "9": stored },
      branches: {},
      fitnessLevel: "BEGINNER",
      lastSessionAt: now,
      now,
    });
    expect(result["9"]).toEqual(stored);
  });
});

describe("maintainBranchLevels: decay", () => {
  const BRANCH = branchOf({ 1: "A", 2: "B", 3: "B", 4: "C", 5: "D" });
  const atLevel5 = { branchId: "1", level: 5, exerciseId: "D" };

  it("keeps the level before 12 weeks without a session", () => {
    const result = maintain(BRANCH, atLevel5, {
      lastSessionAt: now - 12 * WEEK + 1,
    });
    expect(result?.level).toBe(5);
  });

  it("drops one level after 12 weeks without a session", () => {
    const result = maintain(BRANCH, atLevel5, {
      lastSessionAt: now - 12 * WEEK,
    });
    expect(result).toMatchObject({ level: 4, exerciseId: "C" });
  });

  it("skips repeated exercises like a level down", () => {
    const result = maintain(
      BRANCH,
      { branchId: "1", level: 4, exerciseId: "C" },
      { lastSessionAt: now - 12 * WEEK },
    );
    expect(result).toMatchObject({ level: 3, exerciseId: "B" });
  });

  it("drops one level per 12 week pause", () => {
    const result = maintain(BRANCH, atLevel5, {
      lastSessionAt: now - 24 * WEEK,
    });
    expect(result).toMatchObject({ level: 3, exerciseId: "B" });
  });

  it("never drops below the entry level of the fitness level", () => {
    const result = maintain(BRANCH, atLevel5, {
      fitnessLevel: "PROFESSIONAL",
      lastSessionAt: now - 48 * WEEK,
    });
    expect(result?.level).toBe(3);
  });

  it("applies the decay of a pause only once", () => {
    const lastSessionAt = now - 12 * WEEK;
    const first = maintainBranchLevels({
      branchData: { "1": atLevel5 },
      branches: { "1": BRANCH },
      fitnessLevel: "BEGINNER",
      lastSessionAt,
      now,
    });
    const second = maintainBranchLevels({
      branchData: first,
      branches: { "1": BRANCH },
      fitnessLevel: "BEGINNER",
      lastSessionAt,
      now: now + WEEK,
    });
    expect(second["1"]?.level).toBe(4);
  });

  it("applies the next step of the same pause after another 12 weeks", () => {
    const lastSessionAt = now - 12 * WEEK;
    const first = maintainBranchLevels({
      branchData: { "1": atLevel5 },
      branches: { "1": BRANCH },
      fitnessLevel: "BEGINNER",
      lastSessionAt,
      now,
    });
    const second = maintainBranchLevels({
      branchData: first,
      branches: { "1": BRANCH },
      fitnessLevel: "BEGINNER",
      lastSessionAt,
      now: now + 12 * WEEK,
    });
    expect(second["1"]?.level).toBe(3);
  });

  it("does not decay without any completed session", () => {
    const result = maintain(BRANCH, atLevel5, { lastSessionAt: null });
    expect(result?.level).toBe(5);
  });

  it("returns the same map when nothing changes", () => {
    const branchData: BranchDataMapType = { "1": atLevel5 };
    const result = maintainBranchLevels({
      branchData,
      branches: { "1": BRANCH },
      fitnessLevel: "BEGINNER",
      lastSessionAt: now,
      now,
    });
    expect(result).toBe(branchData);
  });
});
