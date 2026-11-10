import type { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { generateStoredTrainingDay } from "@test/factories/storedTrainingDay";
import {
  findNextSwap,
  holdsExerciseTwice,
  listSwappableBranches,
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

describe("swapSession: replaceSessionBranch", () => {
  it("replaces each entry of the old branch in place with the new values", () => {
    const session = [
      generateSessionEntry("5", "e5", [1, 1]),
      generateSessionEntry("10", "e10", [1, 2]),
      generateSessionEntry("10", "e10", [2, 2]),
      generateSessionEntry("6", "e6", [1, 1]),
    ];
    const replacements = [
      generateSessionEntry("20", "e20", [1, 2]),
      generateSessionEntry("20", "e20", [2, 2]),
    ];

    expect(replaceSessionBranch(session, "10", replacements)).toEqual([
      session[0],
      {
        branchId: "20",
        exerciseId: "e20",
        skill: "SK",
        set: [1, 2],
        repetition: 8,
      },
      {
        branchId: "20",
        exerciseId: "e20",
        skill: "SK",
        set: [2, 2],
        repetition: 8,
      },
      session[3],
    ]);
  });

  it("swaps both sides of a one sided exercise together", () => {
    const session = [
      generateSessionEntry("10", "e10l", [1, 1]),
      generateSessionEntry("10", "e10r", [1, 1]),
    ];
    const replacements = [
      generateSessionEntry("20", "e20l", [1, 1]),
      generateSessionEntry("20", "e20r", [1, 1]),
    ];

    expect(
      replaceSessionBranch(session, "10", replacements)?.map(
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
    const replacements = [
      generateSessionEntry("20", "e20", [1, 2]),
      generateSessionEntry("20", "e20", [2, 2]),
    ];

    expect(
      replaceSessionBranch(session, "10", replacements)?.map(
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
    const replacements = [
      generateSessionEntry("20", "e20", [1, 3], { duration: 45 }),
    ];

    const [entry] = replaceSessionBranch(session, "10", replacements) ?? [];

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
    const replacements = [
      generateSessionEntry("20", "e20", [1, 2]),
      generateSessionEntry("20", "e20", [2, 2]),
    ];

    expect(replaceSessionBranch(session, "10", replacements)).toBeNull();
  });

  it("returns null without replacements", () => {
    const session = [generateSessionEntry("10", "e10", [1, 1])];

    expect(replaceSessionBranch(session, "10", [])).toBeNull();
  });
});

describe("swapSession: holdsExerciseTwice", () => {
  it("finds an exercise of the branch under another branch", () => {
    const session = [
      generateSessionEntry("10", "e1", [1, 1]),
      generateSessionEntry("20", "e1", [1, 1]),
    ];

    expect(holdsExerciseTwice(session, "20")).toBe(true);
  });

  it("allows the repeated sets of one branch", () => {
    const session = [
      generateSessionEntry("20", "e1", [1, 2]),
      generateSessionEntry("20", "e1", [2, 2]),
      generateSessionEntry("10", "e2", [1, 1]),
    ];

    expect(holdsExerciseTwice(session, "20")).toBe(false);
  });
});

describe("swapSession: listSwappableBranches", () => {
  it("lists each plan branch once with its skill", () => {
    const session = [
      generateSessionEntry("10", "e1", [1, 2]),
      generateSessionEntry("10", "e1", [2, 2]),
      { ...generateSessionEntry("20", "e2", [1, 1]), skill: "WU" as const },
    ];
    const day = generateStoredTrainingDay({ SK: ["10"], WU: ["20"] });

    expect(listSwappableBranches(session, day)).toEqual([
      { branchId: "10", skill: "SK" },
      { branchId: "20", skill: "WU" },
    ]);
  });

  it("leaves out a branch held under two skills", () => {
    const session = [
      generateSessionEntry("10", "e1", [1, 1]),
      { ...generateSessionEntry("10", "e1", [1, 1]), skill: "WU" as const },
    ];
    const day = generateStoredTrainingDay({ SK: ["10"], WU: ["10"] });

    expect(listSwappableBranches(session, day)).toEqual([]);
  });

  it("leaves out placeholder entries", () => {
    const session = [generateSessionEntry("-1", "999999", [1, 1])];
    const day = generateStoredTrainingDay({ SK: ["-1"] });

    expect(listSwappableBranches(session, day)).toEqual([]);
  });

  it("leaves out a branch the plan day does not hold under its skill", () => {
    const session = [
      generateSessionEntry("10", "e1", [1, 1]),
      generateSessionEntry("30", "e3", [1, 1]),
    ];
    const day = generateStoredTrainingDay({ SK: ["10"], WU: ["30"] });

    expect(listSwappableBranches(session, day)).toEqual([
      { branchId: "10", skill: "SK" },
    ]);
  });
});

/**
 * Builds a catalog alternative, e.g. branch "20" with exercise 20x1 at level 1:
 * { branchId: "20", branch: { tags: ["SIDE_BOTH"], levels: { 1: { exerciseId: "20x1" } } } }
 */
const generateAlternative = (branchId: string) => ({
  branchId,
  branch: {
    tags: ["SIDE_BOTH"],
    levels: { 1: { exerciseId: `${branchId}x1` } },
  },
});

describe("swapSession: findNextSwap", () => {
  const originalEntries = [generateSessionEntry("10", "e10", [1, 1])];

  it("moves to the first alternative with its generated entries", () => {
    const session = [
      ...originalEntries,
      generateSessionEntry("5", "e5", [1, 1]),
    ];
    const swap = {
      skill: "SK",
      position: 0,
      alternatives: [generateAlternative("20")],
      originalEntries,
    };

    const next = findNextSwap({
      session,
      original: "10",
      swap,
      generateWith: () => [generateGeneratedEntry("20", "e20", [1, 1])],
    });

    expect(next).toEqual({
      position: 1,
      session: [
        {
          branchId: "20",
          exerciseId: "e20",
          skill: "SK",
          set: [1, 1],
          duration: 30,
        },
        session[1],
      ],
    });
  });

  it("restores the original entries without generating again", () => {
    const session = [generateSessionEntry("20", "e20", [1, 1])];
    const generateWith = jest.fn(() => []);
    const swap = {
      skill: "SK",
      position: 1,
      alternatives: [generateAlternative("20")],
      originalEntries,
    };

    const next = findNextSwap({ session, original: "10", swap, generateWith });

    expect([next, generateWith.mock.calls.length]).toEqual([
      { position: 0, session: originalEntries },
      0,
    ]);
  });

  it("skips an alternative whose branch the session already holds", () => {
    const session = [
      ...originalEntries,
      generateSessionEntry("20", "e5", [1, 1]),
    ];
    const swap = {
      skill: "SK",
      position: 0,
      alternatives: [generateAlternative("20"), generateAlternative("30")],
      originalEntries,
    };

    const next = findNextSwap({
      session,
      original: "10",
      swap,
      generateWith: () => [generateGeneratedEntry("30", "e30", [1, 1])],
    });

    expect(next?.position).toBe(2);
  });

  it("skips an alternative that repeats an exercise of another branch", () => {
    const session = [
      ...originalEntries,
      generateSessionEntry("5", "e5", [1, 1]),
    ];
    const swap = {
      skill: "SK",
      position: 0,
      alternatives: [generateAlternative("20"), generateAlternative("30")],
      originalEntries,
    };

    const next = findNextSwap({
      session,
      original: "10",
      swap,
      generateWith: ({ branchId }) => [
        generateGeneratedEntry(
          branchId,
          branchId === "20" ? "e5" : "e30",
          [1, 1],
        ),
      ],
    });

    expect(next?.position).toBe(2);
  });

  it("stays on the original when no alternative fits", () => {
    const swap = {
      skill: "SK",
      position: 0,
      alternatives: [generateAlternative("20")],
      originalEntries,
    };

    const next = findNextSwap({
      session: originalEntries,
      original: "10",
      swap,
      generateWith: () => [],
    });

    expect(next).toEqual({ position: 0, session: originalEntries });
  });
});
