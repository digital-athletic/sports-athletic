import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import {
  isPauseExercise,
  PAUSE_EXERCISE_ID,
  PLACEHOLDER_BRANCH_ID,
} from "@/features/training/models/IdTypes";
import { buildPauseEntry, removeTrailingPause } from "./setListBuilder";

const exercise: GeneratedSetListEntry = {
  branchId: "b1",
  exerciseId: "e1",
  set: [1, 1],
  skill: "GKS",
};
const pause: GeneratedSetListEntry = {
  branchId: "-1",
  exerciseId: "999999",
  set: [1, 1],
  skill: "GKS",
  duration: 60,
};

describe("setListBuilder: removeTrailingPause", () => {
  it.each([
    ["a closing pause", [exercise, pause], [exercise]],
    [
      "only the last of two pauses",
      [exercise, pause, pause],
      [exercise, pause],
    ],
    ["nothing after a closing exercise", [pause, exercise], [pause, exercise]],
    ["nothing from an empty set list", [], []],
  ])("drops %s", (_label, setList, expected) => {
    expect(removeTrailingPause(setList)).toEqual(expected);
  });

  it("leaves the given set list unchanged", () => {
    const setList = [exercise, pause];

    removeTrailingPause(setList);

    expect(setList).toEqual([exercise, pause]);
  });
});

describe("setListBuilder: buildPauseEntry", () => {
  it("builds a pause entry with the placeholder branch and the given set, skill and duration", () => {
    expect(buildPauseEntry([1, 2], "GKS", 45)).toEqual({
      branchId: PLACEHOLDER_BRANCH_ID,
      exerciseId: PAUSE_EXERCISE_ID,
      set: [1, 2],
      skill: "GKS",
      duration: 45,
    });
  });

  it("builds an entry that is recognised as a pause exercise", () => {
    expect(isPauseExercise(buildPauseEntry([1, 2], "GKS", 45).exerciseId)).toBe(
      true,
    );
  });
});
