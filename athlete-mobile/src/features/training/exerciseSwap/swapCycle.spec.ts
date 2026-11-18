import type { StoredBranch } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import { Logger } from "@/services/Logger";
import { generateStoredBranch } from "@test/factories/storedBranch";
import {
  listEntriesOfBranch,
  listExerciseIdsOfBranch,
} from "@test/factories/swapSession";
import {
  generateAdrPlanDay,
  generatePlanDaySwapWorkout,
  generateSyntheticExerciseCatalog,
  generateSyntheticInput,
  generateSyntheticSkillTrees,
} from "@test/factories/swapWorkout";
import { generateOneExerciseBranch } from "@test/factories/skillTree";
import {
  generateBranchesBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import {
  generatePlainExercises,
  generateTaggedExercise,
} from "@test/factories/valueExercise";
import {
  branchIdAt,
  type BranchSwap,
  findNextStep,
  findOriginalBranchId,
  listBranchSwaps,
} from "./swapCycle";
import {
  listBranchAlternatives,
  swapBranchFromWorkout,
  type SwapWorkout,
} from "./swapWorkout";

/**
 * Builds the swap workout of the ADR plan day over the synthetic trees, e.g.
 * generateAdrWorkout().session
 * → [{ branchId: "98001", ... }, { branchId: "98002", ... }, { branchId: "98101", ... }, ...].
 */
const generateAdrWorkout = (): SwapWorkout =>
  generatePlanDaySwapWorkout(
    generateAdrPlanDay(),
    generateSyntheticInput(),
    generateSyntheticSkillTrees(),
  );

/**
 * Builds a swap cycle at position 0 of the original branch, e.g.
 * generateBranchSwap(workout, "98001", [generateStoredBranch("98003", [], "161")])
 * → { alternatives: [{ branchId: "98003", ... }], position: 0, originalEntries: [...] }.
 */
const generateBranchSwap = (
  workout: SwapWorkout,
  original: string,
  alternatives: readonly StoredBranch[],
  position = 0,
): BranchSwap => ({
  alternatives,
  position,
  originalEntries: listEntriesOfBranch(workout.session, original),
});

/**
 * Builds the plan day workout of a SYN block that trains the two sided branch
 * 98001 (exercise eA) and a SYN2 block that trains the one sided branch 98101
 * (exercise eB, other side eB2). The catalog adds the one sided eL, whose other
 * side is eA, e.g. generateOneSidedPairWorkout().session
 * → [{ branchId: "98001", exerciseId: "eA", ... }, { branchId: "98101", exerciseId: "eB", ... }, ...].
 */
const generateOneSidedPairWorkout = (): SwapWorkout => {
  const skillTrees = {
    ...generateSyntheticSkillTrees(),
    SYN: { "98001": generateOneExerciseBranch("eA") },
    SYN2: { "98101": generateOneExerciseBranch("eB", ["SIDE_ONE"]) },
  };
  const input = generateSyntheticInput({
    skillTrees,
    exerciseCatalog: [
      ...generateSyntheticExerciseCatalog(),
      generateTaggedExercise("eA", ["SIDE_BOTH"]),
      generateTaggedExercise("eB", ["SIDE_ONE"], {
        otherSideExerciseId: "eB2",
      }),
      generateTaggedExercise("eB2", ["SIDE_ONE"]),
      generateTaggedExercise("eL", ["SIDE_ONE"], { otherSideExerciseId: "eA" }),
    ],
  });
  const day = generateTemplate([
    generateBranchesBlock("SYN", ["98001"], { duration: undefined }),
    generateBranchesBlock("SYN2", ["98101"], { duration: undefined }),
  ]);
  return generatePlanDaySwapWorkout(day, input, skillTrees);
};

/**
 * Builds the plan day workout of one SYN block that trains 98001 (exercise
 * 114, two sided), over a SYN tree that holds 98001 and the given candidates.
 * The catalog holds the exercises eS1 to eS3 one sided with an other side, and
 * the two sided exercises ePlainA to ePlainC, e.g.
 * generateCandidateWorkout({ "98002": generateOneExerciseBranch("eS1") })
 * → a workout whose branch 98002 ranks as candidate but builds twice the entries of 98001.
 */
const generateCandidateWorkout = (
  candidates: Record<string, SkillBranchType>,
): SwapWorkout => {
  const skillTrees = {
    ...generateSyntheticSkillTrees(),
    SYN: {
      "98001": generateOneExerciseBranch("114", [
        "SIDE_BOTH",
        "REGION_LOWER_BODY",
      ]),
      ...candidates,
    },
  };
  const input = generateSyntheticInput({
    skillTrees,
    exerciseCatalog: [
      ...generateSyntheticExerciseCatalog(),
      ...["eS1", "eS2", "eS3"].flatMap((id) => [
        generateTaggedExercise(id, ["SIDE_ONE"], {
          otherSideExerciseId: `${id}b`,
        }),
        generateTaggedExercise(`${id}b`, ["SIDE_ONE"]),
      ]),
      ...generatePlainExercises(),
    ],
  });
  const day = generateTemplate([
    generateBranchesBlock("SYN", ["98001"], { duration: undefined }),
  ]);
  return generatePlanDaySwapWorkout(day, input, skillTrees);
};

describe("branchIdAt", () => {
  it("returns the original branch at position 0", () => {
    const swap: BranchSwap = {
      alternatives: [
        generateStoredBranch("98003", [], "161"),
        generateStoredBranch("98004", [], "164"),
      ],
      position: 0,
      originalEntries: [],
    };

    expect(branchIdAt(swap, "98001")).toBe("98001");
  });

  it("returns the nth alternative at position n", () => {
    const swap: BranchSwap = {
      alternatives: [
        generateStoredBranch("98003", [], "161"),
        generateStoredBranch("98004", [], "164"),
      ],
      position: 2,
      originalEntries: [],
    };

    expect(branchIdAt(swap, "98001")).toBe("98004");
  });
});

describe("findOriginalBranchId", () => {
  it("finds the original branch from the shown alternative", () => {
    const swaps: Record<string, BranchSwap> = {
      "98001": {
        alternatives: [generateStoredBranch("98003", [], "161")],
        position: 1,
        originalEntries: [],
      },
      "98002": {
        alternatives: [generateStoredBranch("98004", [], "164")],
        position: 0,
        originalEntries: [],
      },
    };

    expect(findOriginalBranchId(swaps, "98003")).toBe("98001");
  });

  it("returns undefined for a branch that no swap shows", () => {
    const swaps: Record<string, BranchSwap> = {
      "98001": {
        alternatives: [generateStoredBranch("98003", [], "161")],
        position: 0,
        originalEntries: [],
      },
    };

    expect(findOriginalBranchId(swaps, "99999")).toBeUndefined();
  });
});

describe("findNextStep", () => {
  it("moves to the next alternative", () => {
    const workout = generateAdrWorkout();
    const swap = generateBranchSwap(workout, "98001", [
      generateStoredBranch("98003", [], "161"),
    ]);

    const step = findNextStep(workout, "98001", swap);

    expect(step?.position).toBe(1);
    expect(listExerciseIdsOfBranch(step?.session ?? [], "98003")).toEqual([
      "161",
      "161",
    ]);
  });

  it("restores the original entries at position 0 after the last alternative", () => {
    const workout = generateAdrWorkout();
    const alternative = generateStoredBranch("98003", [], "161");
    const showingAlternative: SwapWorkout = {
      ...workout,
      session: swapBranchFromWorkout(workout, "98001", alternative) ?? [],
    };
    const swap = generateBranchSwap(workout, "98001", [alternative], 1);

    const step = findNextStep(showingAlternative, "98001", swap);

    expect(step?.position).toBe(0);
    expect(step?.session).toEqual(workout.session);
  });

  it("skips an alternative that returns no session", () => {
    const workout = generateAdrWorkout();
    // exercise 164 trains in branch 98101, so the first alternative returns no session
    const swap = generateBranchSwap(workout, "98001", [
      generateStoredBranch("98003", [], "164"),
      generateStoredBranch("98004", [], "161"),
    ]);

    const step = findNextStep(workout, "98001", swap);

    expect(step?.position).toBe(2);
    expect(listExerciseIdsOfBranch(step?.session ?? [], "98004")).toEqual([
      "161",
      "161",
    ]);
  });

  it("returns null when no step fits", () => {
    const workout = generateAdrWorkout();
    // exercise 164 trains in branch 98101, so the only alternative returns no session
    const swap = generateBranchSwap(workout, "98001", [
      generateStoredBranch("98003", [], "164"),
    ]);

    expect(findNextStep(workout, "98001", swap)).toBeNull();
  });

  // B moves to eL and its other side eA, which A trained before its swap.
  it("returns null when the restore would train an exercise that another branch shows", () => {
    const workout = generateOneSidedPairWorkout();
    const first = generateStoredBranch("98003", [], "161");
    const afterA = swapBranchFromWorkout(workout, "98001", first) ?? [];
    const afterB =
      swapBranchFromWorkout(
        { ...workout, session: afterA },
        "98101",
        generateStoredBranch("98201", ["SIDE_ONE"], "eL"),
      ) ?? [];
    const swap = generateBranchSwap(workout, "98001", [first], 1);

    const step = findNextStep({ ...workout, session: afterB }, "98001", swap);

    expect(listExerciseIdsOfBranch(afterB, "98201")).toHaveLength(4);
    expect(step).toBeNull();
  });

  it("skips the restore of the original and moves to the first alternative", () => {
    const workout = generateOneSidedPairWorkout();
    const first = generateStoredBranch("98003", [], "161");
    const second = generateStoredBranch("98004", [], "164");
    const afterA = swapBranchFromWorkout(workout, "98001", second) ?? [];
    const afterB =
      swapBranchFromWorkout(
        { ...workout, session: afterA },
        "98101",
        generateStoredBranch("98201", ["SIDE_ONE"], "eL"),
      ) ?? [];
    const swap = generateBranchSwap(workout, "98001", [first, second], 2);

    const step = findNextStep({ ...workout, session: afterB }, "98001", swap);

    expect(step?.position).toBe(1);
    expect(listExerciseIdsOfBranch(step?.session ?? [], "98003")).toEqual([
      "161",
      "161",
    ]);
  });
});

describe("listBranchSwaps", () => {
  it("starts the cycle of a branch with alternatives at position 0", () => {
    const workout = generateAdrWorkout();

    const swaps = listBranchSwaps(workout);

    // branch 98003 of the tree SYN is free, so 98001 offers an alternative
    expect(swaps["98001"].position).toBe(0);
    expect(swaps["98001"].alternatives.length).toBeGreaterThan(0);
  });

  it("returns the session entries of the branch as original entries", () => {
    const workout = generateAdrWorkout();

    const swaps = listBranchSwaps(workout);

    expect(swaps["98001"].originalEntries).toEqual(
      listEntriesOfBranch(workout.session, "98001"),
    );
  });

  // The ranking reads the sides from the branch tags, so it keeps 98002, 98004
  // and 98005. The build pairs their one sided exercises and writes twice the entries.
  it("offers the fourth candidate when the three closest candidates fail the build", () => {
    const workout = generateCandidateWorkout({
      "98002": generateOneExerciseBranch("eS1"),
      "98004": generateOneExerciseBranch("eS2"),
      "98005": generateOneExerciseBranch("eS3"),
      "98009": generateOneExerciseBranch("161"),
    });

    const ranked = listBranchAlternatives(workout, "98001");
    const swaps = listBranchSwaps(workout);

    expect(ranked.map(({ branchId }) => branchId)).toEqual([
      "98002",
      "98004",
      "98005",
      "98009",
    ]);
    expect(swaps["98001"].alternatives.map(({ branchId }) => branchId)).toEqual(
      ["98009"],
    );
  });

  it("keeps the three closest of five buildable candidates", () => {
    const lowerBody = ["SIDE_BOTH", "REGION_LOWER_BODY"];
    const upperBody = ["SIDE_BOTH", "REGION_UPPER_BODY"];
    const workout = generateCandidateWorkout({
      "98002": generateOneExerciseBranch("115", upperBody),
      "98003": generateOneExerciseBranch("161", upperBody),
      "98004": generateOneExerciseBranch("ePlainA", lowerBody),
      "98005": generateOneExerciseBranch("ePlainB", lowerBody),
      "98006": generateOneExerciseBranch("ePlainC", lowerBody),
    });

    const swaps = listBranchSwaps(workout);

    expect(swaps["98001"].alternatives.map(({ branchId }) => branchId)).toEqual(
      ["98004", "98005", "98006"],
    );
  });

  it("returns no cycle for a branch whose candidates all fail the build", () => {
    const workout = generateCandidateWorkout({
      "98002": generateOneExerciseBranch("eS1"),
      "98004": generateOneExerciseBranch("eS2"),
      "98005": generateOneExerciseBranch("eS3"),
    });
    const ranked = listBranchAlternatives(workout, "98001");
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const swaps = listBranchSwaps(workout);

    expect(ranked).toHaveLength(3);
    expect([swaps, logError.mock.calls.length]).toEqual([{}, 0]);
    logError.mockRestore();
  });
});
