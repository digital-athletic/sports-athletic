import type { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { generateStoredTrainingDay } from "@test/factories/storedTrainingDay";
import {
  raiseSwapStartLevel,
  replaceSessionBranch,
  swapBranchInStoredDay,
} from "./swapSession";

/**
 * Builds a catalog branch for a swap, e.g. branch "20" with levels 1 to 3:
 * { branchId: "20", tags: ["SIDE_BOTH"], exercises: { 1: { exerciseId: "20a" }, 2: ..., 3: ... } }
 */
const generateSwapBranch = (
  branchId: string,
  levels: number[] = [1, 2, 3],
): ExerciseBranchType => ({
  branchId,
  tags: ["SIDE_BOTH"],
  exercises: Object.fromEntries(
    levels.map((level) => [level, { exerciseId: `${branchId}x${level}` }]),
  ),
});

/**
 * Builds a session entry, e.g. { branchId: "10", exerciseId: "e10", skill: "SK", set: [1, 2], repetition: 8 }.
 */
const generateSessionEntry = (
  branchId: string,
  exerciseId: string,
  set: [number, number],
  values: Partial<UserExerciseDataType> = { repetition: 8 },
): UserExerciseDataType => ({
  branchId,
  exerciseId,
  skill: "SK",
  set,
  ...values,
});

/**
 * Builds a generated entry, e.g. { branchId: "20", exerciseId: "e20", skill: "SK", set: [1, 3], duration: 30 }.
 */
const generateGeneratedEntry = (
  branchId: string,
  exerciseId: string,
  set: [number, number],
  values: Partial<GeneratedSetListEntry> = { duration: 30 },
): GeneratedSetListEntry => ({
  branchId,
  exerciseId,
  skill: "SK",
  set,
  ...values,
});

describe("swapSession: swapBranchInStoredDay", () => {
  it("replaces the branch entry under its skill", () => {
    const day = generateStoredTrainingDay({ SK: ["10", "11"], WU: ["10"] });

    const swapped = swapBranchInStoredDay(
      day,
      "SK",
      "10",
      generateSwapBranch("20"),
    );

    expect(swapped.skills.SK?.map(({ branchId }) => branchId)).toEqual([
      "20",
      "11",
    ]);
  });

  it("leaves the same branch under another skill unchanged", () => {
    const day = generateStoredTrainingDay({ SK: ["10"], WU: ["10"] });

    const swapped = swapBranchInStoredDay(
      day,
      "SK",
      "10",
      generateSwapBranch("20"),
    );

    expect(swapped.skills.WU?.map(({ branchId }) => branchId)).toEqual(["10"]);
  });

  it("does not change the given day", () => {
    const day = generateStoredTrainingDay({ SK: ["10"] });

    swapBranchInStoredDay(day, "SK", "10", generateSwapBranch("20"));

    expect(day.skills.SK?.[0].branchId).toBe("10");
  });
});

describe("swapSession: raiseSwapStartLevel", () => {
  it("starts an untrained branch at the entry level of the fitness level", () => {
    const branchData = raiseSwapStartLevel(
      {},
      generateSwapBranch("20"),
      "ADVANCED",
    );

    expect(branchData["20"]).toBeUndefined();
  });

  it("raises a stored level below the entry level to the entry level", () => {
    const branchData = raiseSwapStartLevel(
      { "20": { branchId: "20", level: 1, exerciseId: "20x1" } },
      generateSwapBranch("20"),
      "ADVANCED",
    );

    expect(branchData["20"]?.level).toBe(2);
  });

  it("keeps a stored level above the entry level", () => {
    const branchData = raiseSwapStartLevel(
      { "20": { branchId: "20", level: 3, exerciseId: "20x3" } },
      generateSwapBranch("20"),
      "BEGINNER",
    );

    expect(branchData["20"]?.level).toBe(3);
  });

  it("keeps the level of the other branches", () => {
    const stored = { "10": { branchId: "10", level: 4, exerciseId: "10x4" } };

    const branchData = raiseSwapStartLevel(
      stored,
      generateSwapBranch("20"),
      "ADVANCED",
    );

    expect(branchData["10"]).toEqual(stored["10"]);
  });
});

describe("swapSession: replaceSessionBranch", () => {
  it("replaces each entry of the old branch in place with the new values", () => {
    const session = [
      generateSessionEntry("5", "e5", [1, 1]),
      generateSessionEntry("10", "e10", [1, 2]),
      generateSessionEntry("10", "e10", [2, 2]),
      generateSessionEntry("6", "e6", [1, 1]),
    ];
    const generated = [
      generateGeneratedEntry("20", "e20", [1, 2]),
      generateGeneratedEntry("20", "e20", [2, 2]),
    ];

    expect(replaceSessionBranch(session, "10", generated, "20")).toEqual([
      session[0],
      {
        branchId: "20",
        exerciseId: "e20",
        skill: "SK",
        set: [1, 2],
        duration: 30,
      },
      {
        branchId: "20",
        exerciseId: "e20",
        skill: "SK",
        set: [2, 2],
        duration: 30,
      },
      session[3],
    ]);
  });

  it("swaps both sides of a one sided exercise together", () => {
    const session = [
      generateSessionEntry("10", "e10l", [1, 1]),
      generateSessionEntry("10", "e10r", [1, 1]),
    ];
    const generated = [
      generateGeneratedEntry("20", "e20l", [1, 1]),
      generateGeneratedEntry("20", "e20r", [1, 1]),
    ];

    expect(
      replaceSessionBranch(session, "10", generated, "20")?.map(
        ({ exerciseId }) => exerciseId,
      ),
    ).toEqual(["e20l", "e20r"]);
  });

  it("keeps the set positions of the session", () => {
    const session = [
      generateSessionEntry("10", "e10", [1, 2]),
      generateSessionEntry("6", "e6", [1, 2]),
      generateSessionEntry("10", "e10", [2, 2]),
    ];
    const generated = [
      generateGeneratedEntry("20", "e20", [1, 2]),
      generateGeneratedEntry("20", "e20", [2, 2]),
    ];

    expect(
      replaceSessionBranch(session, "10", generated, "20")?.map(
        ({ exerciseId, set }) => [exerciseId, set],
      ),
    ).toEqual([
      ["e20", [1, 2]],
      ["e6", [1, 2]],
      ["e20", [2, 2]],
    ]);
  });

  it("drops the values of the old exercise", () => {
    const session = [
      generateSessionEntry("10", "e10", [1, 1], { repetition: 8, weight: 20 }),
    ];
    const generated = [
      generateGeneratedEntry("20", "e20", [1, 1], { duration: 45 }),
    ];

    const [entry] = replaceSessionBranch(session, "10", generated, "20") ?? [];

    expect(entry).toEqual({
      branchId: "20",
      exerciseId: "e20",
      skill: "SK",
      set: [1, 1],
      duration: 45,
    });
  });

  it("returns null when the entry counts differ", () => {
    const session = [generateSessionEntry("10", "e10", [1, 1])];
    const generated = [
      generateGeneratedEntry("20", "e20", [1, 2]),
      generateGeneratedEntry("20", "e20", [2, 2]),
    ];

    expect(replaceSessionBranch(session, "10", generated, "20")).toBeNull();
  });

  it("returns null when the generated list lacks the new branch", () => {
    const session = [generateSessionEntry("10", "e10", [1, 1])];
    const generated = [generateGeneratedEntry("30", "e30", [1, 1])];

    expect(replaceSessionBranch(session, "10", generated, "20")).toBeNull();
  });
});
