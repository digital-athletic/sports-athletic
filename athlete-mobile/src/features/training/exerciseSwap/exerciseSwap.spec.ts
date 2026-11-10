import type { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { generateLowerBodyBranch } from "@test/factories/skillTree";
import { generateStoredTrainingDay } from "@test/factories/storedTrainingDay";
import {
  findNextSwap,
  listSwappableBranches,
  swapBranchInStoredDay,
  toExerciseBranch,
} from "./exerciseSwap";

/**
 * Builds a plan branch, e.g. branch "20" with levels 1 to 3:
 * { branchId: "20", tags: ["SIDE_BOTH"], exercises: { 1: { exerciseId: "20x1" }, ... } }
 */
const generatePlanBranch = (branchId: string): ExerciseBranchType => ({
  branchId,
  tags: ["SIDE_BOTH"],
  exercises: Object.fromEntries(
    [1, 2, 3].map((level) => [level, { exerciseId: `${branchId}x${level}` }]),
  ),
});

/**
 * Builds a catalog alternative, e.g. branch "20" with the exercises 20x1 to
 * 20x3 at levels 1 to 3: { branchId: "20", branch: { tags, levels } }.
 */
const generateAlternative = (branchId: string) => ({
  branchId,
  branch: generateLowerBodyBranch({
    1: { exerciseId: `${branchId}x1` },
    2: { exerciseId: `${branchId}x2` },
    3: { exerciseId: `${branchId}x3` },
  }),
});

/**
 * Builds a session entry, e.g. { branchId: "10", exerciseId: "e10", skill: "SK", set: [1, 2], repetition: 8 }.
 */
const generateSessionEntry = (
  branchId: string,
  exerciseId: string,
  set: [number, number],
): UserExerciseDataType => ({
  branchId,
  exerciseId,
  skill: "SK",
  set,
  repetition: 8,
});

/**
 * Builds a generated entry, e.g. { branchId: "20", exerciseId: "e20", skill: "SK", set: [1, 3], duration: 30 }.
 */
const generateGeneratedEntry = (
  branchId: string,
  exerciseId: string,
  set: [number, number],
): GeneratedSetListEntry => ({
  branchId,
  exerciseId,
  skill: "SK",
  set,
  duration: 30,
});

/**
 * Builds the swap of branch "10" at a position, e.g. position 1 shows
 * branch "20": { skill: "SK", position: 1, alternatives: [...], originalEntries }.
 */
const generateSwap = (
  position: number,
  alternativeIds: string[] = ["20"],
  originalEntries: UserExerciseDataType[] = [],
) => ({
  skill: "SK",
  position,
  alternatives: alternativeIds.map(generateAlternative),
  originalEntries,
});

describe("exerciseSwap: toExerciseBranch", () => {
  it("names the catalog levels as plan exercises", () => {
    const branch = generateLowerBodyBranch({ 1: { exerciseId: "e1" } });

    expect(toExerciseBranch({ branchId: "7", branch })).toEqual({
      branchId: "7",
      tags: branch.tags,
      exercises: { 1: { exerciseId: "e1" } },
    });
  });
});

describe("exerciseSwap: swapBranchInStoredDay", () => {
  it("replaces the branch entry under its skill", () => {
    const day = generateStoredTrainingDay({ SK: ["10", "11"], WU: ["10"] });

    const swapped = swapBranchInStoredDay(
      day,
      "SK",
      "10",
      generatePlanBranch("20"),
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
      generatePlanBranch("20"),
    );

    expect(swapped.skills.WU?.map(({ branchId }) => branchId)).toEqual(["10"]);
  });

  it("leaves the given day unchanged", () => {
    const day = generateStoredTrainingDay({ SK: ["10"] });

    swapBranchInStoredDay(day, "SK", "10", generatePlanBranch("20"));

    expect(day.skills.SK?.[0].branchId).toBe("10");
  });
});

describe("exerciseSwap: listSwappableBranches", () => {
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

  it("leaves out a branch under two skills", () => {
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

  it("leaves out a branch the plan day stores under another skill", () => {
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

describe("exerciseSwap: findNextSwap", () => {
  const originalEntries = [
    generateSessionEntry("10", "e10", [1, 2]),
    generateSessionEntry("10", "e10", [2, 2]),
  ];
  const other = generateSessionEntry("5", "e5", [1, 1]);
  const session = [originalEntries[0], other, originalEntries[1]];

  it("puts the generated entries of the alternative in place with the session sets", () => {
    const next = findNextSwap({
      session,
      original: "10",
      swap: generateSwap(0, ["20"], originalEntries),
      generateWith: () => [
        generateGeneratedEntry("20", "e20", [1, 3]),
        generateGeneratedEntry("20", "e20", [2, 3]),
      ],
    });

    expect(next).toEqual({
      position: 1,
      session: [
        { ...generateGeneratedEntry("20", "e20", [1, 2]) },
        other,
        { ...generateGeneratedEntry("20", "e20", [2, 2]) },
      ],
    });
  });

  it("restores the original entries without generating again", () => {
    const swapped = [
      generateSessionEntry("20", "e20", [1, 2]),
      other,
      generateSessionEntry("20", "e20", [2, 2]),
    ];
    const generateWith = jest.fn(() => []);

    const next = findNextSwap({
      session: swapped,
      original: "10",
      swap: generateSwap(1, ["20"], originalEntries),
      generateWith,
    });

    expect([next, generateWith.mock.calls.length]).toEqual([
      { position: 0, session },
      0,
    ]);
  });

  it("skips an alternative whose branch the session already holds", () => {
    const next = findNextSwap({
      session: [...session, generateSessionEntry("20", "e6", [1, 1])],
      original: "10",
      swap: generateSwap(0, ["20", "30"], originalEntries),
      generateWith: ({ branchId }) => [
        generateGeneratedEntry(branchId, "e30", [1, 2]),
        generateGeneratedEntry(branchId, "e30", [2, 2]),
      ],
    });

    expect(next?.position).toBe(2);
  });

  it("skips an alternative that repeats an exercise of another branch", () => {
    const next = findNextSwap({
      session,
      original: "10",
      swap: generateSwap(0, ["20", "30"], originalEntries),
      generateWith: ({ branchId }) => {
        const exerciseId = branchId === "20" ? "e5" : "e30";
        return [
          generateGeneratedEntry(branchId, exerciseId, [1, 2]),
          generateGeneratedEntry(branchId, exerciseId, [2, 2]),
        ];
      },
    });

    expect(next?.position).toBe(2);
  });

  it("skips an alternative with another number of entries", () => {
    const next = findNextSwap({
      session,
      original: "10",
      swap: generateSwap(0, ["20", "30"], originalEntries),
      generateWith: ({ branchId }) =>
        branchId === "20"
          ? [generateGeneratedEntry("20", "e20", [1, 1])]
          : [
              generateGeneratedEntry("30", "e30", [1, 2]),
              generateGeneratedEntry("30", "e30", [2, 2]),
            ],
    });

    expect(next?.position).toBe(2);
  });

  it("stays on the original when no alternative fits", () => {
    const next = findNextSwap({
      session,
      original: "10",
      swap: generateSwap(0, ["20"], originalEntries),
      generateWith: () => [],
    });

    expect(next).toEqual({ position: 0, session });
  });
});
