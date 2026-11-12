import { type ChecklistEntryBlock } from "@/features/training/hooks/useTrainingListRows";
import { generateChecklistEntry } from "@test/factories/checklistEntry";
import { findFeaturedEntryKey } from "./featuredEntry";

// A pending entry with open sets at the given list indices, e.g.
// generateOpenEntry([2, 6]) is keyed 2 and starts on set 2.
const generateOpenEntry = (setIndices: number[]) =>
  generateChecklistEntry({
    key: setIndices[0],
    firstOpenSetIndex: setIndices[0],
    sets: setIndices.map((index) => ({
      index,
      label: undefined,
      completed: false,
      skipped: false,
    })),
  });

// A squat (set 0), then a superset of press (sets 2 and 6) and row (sets 4 and 8).
const generateBlocks = (): ChecklistEntryBlock[] => [
  { key: 0, skill: "WU", isSuperset: false, entries: [generateOpenEntry([0])] },
  {
    key: 2,
    skill: "SWR2",
    isSuperset: true,
    entries: [generateOpenEntry([2, 6]), generateOpenEntry([4, 8])],
  },
];

const neverPaused = () => undefined;

describe("findFeaturedEntryKey: the exercise with the filled start button", () => {
  it("features the exercise of the set that comes next", () => {
    expect(findFeaturedEntryKey(generateBlocks(), 0, neverPaused)).toBe(0);
  });

  it("features the superset exercise whose set comes next", () => {
    expect(findFeaturedEntryKey(generateBlocks(), 4, neverPaused)).toBe(4);
  });

  it("features the first superset exercise again after one round", () => {
    expect(findFeaturedEntryKey(generateBlocks(), 6, neverPaused)).toBe(2);
  });

  it("features the paused exercise over the exercise that comes next", () => {
    const resumeSecondsOf = (setIndex: number) =>
      setIndex === 4 ? 42 : undefined;

    expect(findFeaturedEntryKey(generateBlocks(), 0, resumeSecondsOf)).toBe(4);
  });

  it("features the first of two paused exercises", () => {
    const resumeSecondsOf = (setIndex: number) =>
      setIndex === 2 || setIndex === 4 ? 42 : undefined;

    expect(findFeaturedEntryKey(generateBlocks(), 0, resumeSecondsOf)).toBe(2);
  });

  it("features no exercise when no set comes next", () => {
    expect(
      findFeaturedEntryKey(generateBlocks(), null, neverPaused),
    ).toBeNull();
  });
});
