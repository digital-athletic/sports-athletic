import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { createExercise } from "@/features/training/utils/testFixtures";
import { generateChecklistRow } from "@test/factories/checklistRow";
import { findNextSetRow, findRestAfter } from "./checklistRest";

// A planned rest of the set list, e.g. { exerciseId: "999999", duration: 60 }.
const generateRestEntry = (duration: number, completed = false) =>
  createExercise({ exerciseId: PAUSE_EXERCISE_ID, duration, completed });

describe("findRestAfter: the rest that follows a set", () => {
  it("returns the index and duration of the rest right after the set", () => {
    const exerciseList = [createExercise(), generateRestEntry(60)];

    expect(findRestAfter(exerciseList, 0)).toEqual({ index: 1, duration: 60 });
  });

  it.each([
    ["the next entry is a set", [createExercise(), createExercise()], 0],
    ["the set ends the set list", [generateRestEntry(60), createExercise()], 1],
    [
      "the rest is completed",
      [createExercise(), generateRestEntry(60, true)],
      0,
    ],
    ["the rest lasts 0 seconds", [createExercise(), generateRestEntry(0)], 0],
    ["there is no set list", null, 0],
  ])("returns null when %s", (_case, exerciseList, setIndex) => {
    expect(findRestAfter(exerciseList, setIndex)).toBeNull();
  });
});

describe("findNextSetRow: the set to preview during a rest", () => {
  it("returns the first open row after the finished one", () => {
    const rows = [
      generateChecklistRow({ index: 0 }),
      generateChecklistRow({ index: 2, completed: true }),
      generateChecklistRow({ index: 4 }),
    ];

    expect(findNextSetRow(rows, 0)?.index).toBe(4);
  });

  it("wraps around to an open row before the finished one", () => {
    const rows = [
      generateChecklistRow({ index: 0 }),
      generateChecklistRow({ index: 2 }),
    ];

    expect(findNextSetRow(rows, 2)?.index).toBe(0);
  });

  it("returns null when the finished row is the last open one", () => {
    const rows = [
      generateChecklistRow({ index: 0, completed: true }),
      generateChecklistRow({ index: 2 }),
    ];

    expect(findNextSetRow(rows, 2)).toBeNull();
  });
});
