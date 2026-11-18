import { generateGenerationInput } from "@test/factories/generationInput";
import { generateResolvedPicksBlock } from "@test/factories/resolvedPicksBlock";
import {
  generateBranchesBlock,
  generatePicksBlock,
} from "@test/factories/templateBlock";
import {
  createEmptyPicksWorkout,
  type PicksWorkout,
} from "../blockHandlers/picks/picksWorkoutRules";
import type { ResolvedBlockTiming } from "./blockTiming";
import { createSetListBlock, readBlockTiming } from "./setListBlockResolution";

// One resolved timing: 2 sets, no superset, 10 seconds between sets.
const TIMING: ResolvedBlockTiming = {
  sets: 2,
  superset: "none",
  rest: {
    withinSuperset: 10,
    betweenSets: 10,
    afterExercise: 15,
    afterBlock: 30,
  },
  setDuration: undefined,
  values: undefined,
};

describe("readBlockTiming: timing of a block", () => {
  it("reads the timing that workout setup resolved for a picks block", () => {
    const block = generatePicksBlock("WU");
    const picksWorkout: PicksWorkout = {
      ...createEmptyPicksWorkout(),
      blocks: new Map([[block, generateResolvedPicksBlock("WU", TIMING)]]),
    };

    const timing = readBlockTiming(block, {
      ...generateGenerationInput(),
      picksWorkout,
    });

    expect(timing).toEqual({
      sets: 2,
      superset: "none",
      rest: {
        withinSuperset: 10,
        betweenSets: 10,
        afterExercise: 15,
        afterBlock: 30,
      },
      setDuration: undefined,
      values: undefined,
    });
  });

  it("throws when the picks workout resolved no timing for the picks block", () => {
    const block = generatePicksBlock("WU");

    expect(() =>
      readBlockTiming(block, {
        ...generateGenerationInput(),
        picksWorkout: createEmptyPicksWorkout(),
      }),
    ).toThrow("Workout setup resolved no picks block");
  });
});

describe("createSetListBlock: minutes of a block", () => {
  it("gives a duration block of 1200 seconds 20 minutes", () => {
    const block = {
      kind: "duration",
      skill: "CARDIO_2",
      duration: 1200,
    } as const;

    const setListBlock = createSetListBlock(block, TIMING);

    expect(setListBlock.minutes).toBe(20);
  });

  it("gives a branches block without a duration 0 minutes", () => {
    const block = generateBranchesBlock("GKS", ["510"], {
      duration: undefined,
    });

    const setListBlock = createSetListBlock(block, TIMING);

    expect(setListBlock.minutes).toBe(0);
  });

  it("gives a picks block 0 minutes", () => {
    const block = generatePicksBlock("WU");

    const setListBlock = createSetListBlock(block, TIMING);

    expect(setListBlock.minutes).toBe(0);
  });
});
