import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { removeTrailingPause } from "./setListBuilder";

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
