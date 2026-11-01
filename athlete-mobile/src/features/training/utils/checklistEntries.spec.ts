import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { createExercise } from "@/features/training/utils/testFixtures";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import {
  findFirstOpenSetIndex,
  groupChecklistEntries,
} from "./checklistEntries";

// One set of an exercise, e.g. generateSetEntry("squat", 2, 3) is
// { exerciseId: "squat", set: [2, 3] }. Overrides replace any field.
const generateSetEntry = (
  exerciseId: string,
  current: number,
  total: number,
  overrides: Partial<UserExerciseDataType> = {},
): UserExerciseDataType =>
  createExercise({ exerciseId, set: [current, total], ...overrides });

// A rest between sets, e.g. { exerciseId: "999999" }.
const generateRestEntry = (): UserExerciseDataType =>
  createExercise({ exerciseId: PAUSE_EXERCISE_ID });

describe("groupChecklistEntries: one entry per exercise", () => {
  it("returns no blocks for an empty list", () => {
    expect(groupChecklistEntries([])).toEqual([]);
  });

  it("groups the sets of a single exercise into one entry keyed by its first set", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 3),
      generateRestEntry(),
      generateSetEntry("squat", 2, 3),
      generateRestEntry(),
      generateSetEntry("squat", 3, 3),
    ];

    expect(groupChecklistEntries(exerciseList)).toEqual([
      {
        isSuperset: false,
        entries: [{ key: 0, exerciseId: "squat", setIndices: [0, 2, 4] }],
      },
    ]);
  });

  it("counts a warm up set toward its exercise", () => {
    // The generator numbers the warm up as set 1 of 4 and the work sets 2 to 4 of 4.
    const exerciseList = [
      generateSetEntry("squat", 1, 4),
      generateRestEntry(),
      generateSetEntry("squat", 2, 4),
      generateRestEntry(),
      generateSetEntry("squat", 3, 4),
      generateRestEntry(),
      generateSetEntry("squat", 4, 4),
    ];

    const blocks = groupChecklistEntries(exerciseList);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].entries).toEqual([
      { key: 0, exerciseId: "squat", setIndices: [0, 2, 4, 6] },
    ]);
  });

  it("ignores rest entries", () => {
    const exerciseList = [
      generateRestEntry(),
      generateSetEntry("squat", 1, 1),
      generateRestEntry(),
    ];

    const blocks = groupChecklistEntries(exerciseList);

    expect(blocks[0].entries[0].setIndices).toEqual([1]);
    expect(blocks[0].entries[0].key).toBe(1);
  });

  it("puts exercises that do not alternate into separate blocks", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 1),
      generateRestEntry(),
      generateSetEntry("lunge", 1, 1),
    ];

    expect(groupChecklistEntries(exerciseList)).toEqual([
      {
        isSuperset: false,
        entries: [{ key: 0, exerciseId: "squat", setIndices: [0] }],
      },
      {
        isSuperset: false,
        entries: [{ key: 2, exerciseId: "lunge", setIndices: [2] }],
      },
    ]);
  });
});

describe("groupChecklistEntries: supersets", () => {
  it("groups alternating exercises with rests between into one superset block", () => {
    // Order: squat 1, rest, lunge 1, rest, squat 2, rest, lunge 2.
    const exerciseList = [
      generateSetEntry("squat", 1, 2),
      generateRestEntry(),
      generateSetEntry("lunge", 1, 2),
      generateRestEntry(),
      generateSetEntry("squat", 2, 2),
      generateRestEntry(),
      generateSetEntry("lunge", 2, 2),
    ];

    expect(groupChecklistEntries(exerciseList)).toEqual([
      {
        isSuperset: true,
        entries: [
          { key: 0, exerciseId: "squat", setIndices: [0, 4] },
          { key: 2, exerciseId: "lunge", setIndices: [2, 6] },
        ],
      },
    ]);
  });

  it("starts a new block when the same exercise follows a finished block", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 2),
      generateSetEntry("squat", 2, 2),
      generateSetEntry("squat", 1, 2),
      generateSetEntry("squat", 2, 2),
    ];

    expect(groupChecklistEntries(exerciseList)).toEqual([
      {
        isSuperset: false,
        entries: [{ key: 0, exerciseId: "squat", setIndices: [0, 1] }],
      },
      {
        isSuperset: false,
        entries: [{ key: 2, exerciseId: "squat", setIndices: [2, 3] }],
      },
    ]);
  });

  it("starts a new block after a superset has all its sets", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 1),
      generateSetEntry("lunge", 1, 1),
      generateSetEntry("plank", 1, 1),
    ];

    const blocks = groupChecklistEntries(exerciseList);

    expect(blocks.map((block) => block.entries.length)).toEqual([1, 1, 1]);
  });
});

describe("groupChecklistEntries: entries without set data", () => {
  it("treats a missing set as a single set", () => {
    const exerciseList = [
      createExercise({ exerciseId: "plank" }),
      createExercise({ exerciseId: "bridge" }),
    ];

    expect(groupChecklistEntries(exerciseList)).toEqual([
      {
        isSuperset: false,
        entries: [{ key: 0, exerciseId: "plank", setIndices: [0] }],
      },
      {
        isSuperset: false,
        entries: [{ key: 1, exerciseId: "bridge", setIndices: [1] }],
      },
    ]);
  });

  it("gives each strength test entry its own block", () => {
    const exerciseList = [
      createExercise({ exerciseId: "pullup", repetition: -1, skill: "TEST" }),
      generateRestEntry(),
      createExercise({ exerciseId: "pullup", repetition: -1, skill: "TEST" }),
    ];

    const blocks = groupChecklistEntries(exerciseList);

    expect(blocks.map((block) => block.entries[0].key)).toEqual([0, 2]);
  });
});

describe("findFirstOpenSetIndex: first open set of an entry", () => {
  it("returns the first set that is not completed", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 3, { completed: true }),
      generateRestEntry(),
      generateSetEntry("squat", 2, 3),
      generateRestEntry(),
      generateSetEntry("squat", 3, 3),
    ];

    expect(findFirstOpenSetIndex(exerciseList, [0, 2, 4])).toBe(2);
  });

  it("returns null when every set of the entry is completed", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 2, { completed: true }),
      generateSetEntry("squat", 2, 2, { completed: true }),
    ];

    expect(findFirstOpenSetIndex(exerciseList, [0, 1])).toBeNull();
  });

  it("looks only at the given set indices", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 1),
      generateSetEntry("lunge", 1, 1, { completed: true }),
    ];

    expect(findFirstOpenSetIndex(exerciseList, [1])).toBeNull();
  });
});

describe("findFirstOpenSetIndex: first open set of the whole list", () => {
  it("skips completed sets and rests", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 1, { completed: true }),
      generateRestEntry(),
      generateSetEntry("lunge", 1, 1),
      generateRestEntry(),
      generateSetEntry("plank", 1, 1),
    ];

    expect(findFirstOpenSetIndex(exerciseList)).toBe(2);
  });

  it("returns an open set before a later completed one, as the step by step view does", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 1),
      generateSetEntry("lunge", 1, 1, { completed: true }),
      generateSetEntry("plank", 1, 1),
    ];

    expect(findFirstOpenSetIndex(exerciseList)).toBe(0);
  });

  it("returns null when every set is completed", () => {
    const exerciseList = [
      generateSetEntry("squat", 1, 1, { completed: true }),
      generateRestEntry(),
      generateSetEntry("lunge", 1, 1, { completed: true }),
    ];

    expect(findFirstOpenSetIndex(exerciseList)).toBeNull();
  });
});
