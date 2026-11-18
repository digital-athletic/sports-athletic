import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { generateGenerationInput } from "@test/factories/generationInput";
import {
  generateBranchesBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { lookUpStoredBranchInCatalog } from "../blockHandlers/branches/storedBranchLookup";
import { createEmptyPicksWorkout } from "../blockHandlers/picks/picksWorkoutRules";
import type { GenerationInput } from "../generationInput/generationInput";
import { generateSetList } from "../workoutGeneration";
import { buildBranchSetList } from "./branchSetList";
import { createSetListBlock, readBlockTiming } from "./setListBlockResolution";

const exerciseCatalog = loadExercises();
const SECONDS_PER_MINUTE = 60;

// The equipment filter is off, so a branch needs no equipment of the input.
const generatorOptions = {
  skillTrees: getAllSkillTrees(),
  filters: { equipment: false },
};

/**
 * Builds a generation input of the bundled exercise catalog. Every draw
 * returns 0.5, so a cardio block of two branches draws the second one.
 *
 * generateCatalogInput() → { exerciseCatalog: [...], random: () => 0.5, ... }
 */
const generateCatalogInput = (): GenerationInput =>
  generateGenerationInput({ exerciseCatalog, random: () => 0.5 });

/**
 * Lists the entries of one branch in a generated set list. Pauses and the
 * entries of support exercises carry the placeholder branch, so the filter
 * drops them. A branch without entries throws, so a case never compares two
 * empty lists.
 *
 * listBranchEntries(setList, "510") → [{ branchId: "510", exerciseId: "20", set: [1, 2], ... }, ...]
 */
const listBranchEntries = (
  setList: GeneratedSetListEntry[],
  branchId: string,
): GeneratedSetListEntry[] => {
  const entries = setList.filter((entry) => entry.branchId === branchId);
  if (entries.length === 0) {
    throw new Error(`The block run built no entries for branch ${branchId}`);
  }
  return entries;
};

/**
 * Builds the reference of a branch as the branches handler resolves it: the
 * exercise the block run trained and the tags of that exercise from the
 * catalog.
 *
 * generateCatalogReference(setList, "510")
 * → { branchId: "510", exerciseId: "20", branchTags: ["EQ_TYPE_WEIGHTS", "SIDE_BOTH", ...] }
 */
const generateCatalogReference = (
  setList: GeneratedSetListEntry[],
  branchId: string,
): BranchExerciseReference => {
  const { exerciseId } = listBranchEntries(setList, branchId)[0];
  const exercise = exerciseCatalog.find(({ id }) => id === exerciseId);
  if (!exercise)
    throw new Error(`Exercise ${exerciseId} is not in the catalog`);
  return { branchId, exerciseId, branchTags: exercise.tags };
};

describe("buildBranchSetList: the entries of one branch", () => {
  it("builds the entries of a single exercise as the block run does", () => {
    const input = generateCatalogInput();
    const block = generateBranchesBlock("GKS", ["510"], { superset: "none" });
    const setList = generateSetList(
      generateTemplate([block]),
      lookUpStoredBranchInCatalog,
      input,
      generatorOptions,
    );
    const exercise = generateCatalogReference(setList, "510");

    const entries = buildBranchSetList({
      exercise,
      block: createSetListBlock(
        block,
        readBlockTiming(block, {
          ...input,
          picksWorkout: createEmptyPicksWorkout(),
        }),
      ),
      input,
    });

    expect(entries).toEqual(listBranchEntries(setList, "510"));
  });

  // Branch 16 trains a bodyweight exercise (EQ_TYPE_KG), branch 3 a weighted
  // one (EQ_TYPE_WEIGHTS). The weighted partner adds the warm up set to both.
  it("builds the warm up set of a superset with a weighted partner", () => {
    const input = generateCatalogInput();
    const block = generateBranchesBlock("SWR1", ["16", "3"], {
      superset: "drawOrder",
    });
    const setList = generateSetList(
      generateTemplate([block]),
      lookUpStoredBranchInCatalog,
      input,
      generatorOptions,
    );
    const exercise = generateCatalogReference(setList, "16");
    const partner = generateCatalogReference(setList, "3");

    const entries = buildBranchSetList({
      exercise,
      partner,
      block: createSetListBlock(
        block,
        readBlockTiming(block, {
          ...input,
          picksWorkout: createEmptyPicksWorkout(),
        }),
      ),
      input,
    });

    expect(entries).toEqual(listBranchEntries(setList, "16"));
    expect(entries[0].set).toEqual([1, 3]);
  });

  // Branch 512 trains a one sided exercise (SIDE_ONE) with an other side
  // exercise; branch 510 trains a two sided one.
  it.each(["none", "muscles"] as const)(
    "builds both sides of a one sided branch under superset %s",
    (superset) => {
      const input = generateCatalogInput();
      const block = generateBranchesBlock("GKS", ["512", "510"], { superset });
      const setList = generateSetList(
        generateTemplate([block]),
        lookUpStoredBranchInCatalog,
        input,
        generatorOptions,
      );
      const exercise = generateCatalogReference(setList, "512");

      const entries = buildBranchSetList({
        exercise,
        block: createSetListBlock(
          block,
          readBlockTiming(block, {
            ...input,
            picksWorkout: createEmptyPicksWorkout(),
          }),
        ),
        input,
      });

      expect(entries).toEqual(listBranchEntries(setList, "512"));
    },
  );

  it("builds the entries of one exercise of a max strength block", () => {
    const input = generateCatalogInput();
    const block = generateBranchesBlock("MAX", ["133", "134"]);
    const setList = generateSetList(
      generateTemplate([block]),
      lookUpStoredBranchInCatalog,
      input,
      generatorOptions,
    );
    const exercise = generateCatalogReference(setList, "134");

    const entries = buildBranchSetList({
      exercise,
      block: createSetListBlock(
        block,
        readBlockTiming(block, {
          ...input,
          picksWorkout: createEmptyPicksWorkout(),
        }),
      ),
      input,
    });

    expect(entries).toEqual(listBranchEntries(setList, "134"));
  });

  // The max strength builder reads the first exercise of a pair only, so the
  // other side of branch 512 adds no entries.
  it("builds the first side only of a one sided max strength branch", () => {
    const input = generateCatalogInput();
    const block = generateBranchesBlock("MAX", ["512", "133"]);
    const setList = generateSetList(
      generateTemplate([block]),
      lookUpStoredBranchInCatalog,
      input,
      generatorOptions,
    );
    const exercise = generateCatalogReference(setList, "512");

    const entries = buildBranchSetList({
      exercise,
      block: createSetListBlock(
        block,
        readBlockTiming(block, {
          ...input,
          picksWorkout: createEmptyPicksWorkout(),
        }),
      ),
      input,
    });

    expect(entries).toEqual(listBranchEntries(setList, "512"));
  });

  // Branch 999 is not in the catalog, so the standard builder trains the lead
  // alone, as a block run of branch 510 does.
  it("builds the lead alone when the partner is missing from the catalog", () => {
    const input = generateCatalogInput();
    const block = generateBranchesBlock("GKS", ["510"], { superset: "none" });
    const setList = generateSetList(
      generateTemplate([block]),
      lookUpStoredBranchInCatalog,
      input,
      generatorOptions,
    );
    const exercise = generateCatalogReference(setList, "510");
    const partner: BranchExerciseReference = {
      branchId: "999",
      exerciseId: "missingExercise",
      branchTags: [],
    };

    const entries = buildBranchSetList({
      exercise,
      partner,
      block: createSetListBlock(
        block,
        readBlockTiming(block, {
          ...input,
          picksWorkout: createEmptyPicksWorkout(),
        }),
      ),
      input,
    });

    expect(entries).toEqual(listBranchEntries(setList, "510"));
  });

  // Every draw returns 0.5, so the cardio block draws index floor(0.5 * 2) = 1:
  // branch 584, the second branch of the block, trains for the 20 minutes.
  it("builds the drawn branch of a cardio block from its minutes", () => {
    const input = generateCatalogInput();
    const block = generateBranchesBlock("CARDIO_2", ["582", "584"], {
      duration: 20 * SECONDS_PER_MINUTE,
    });
    const setList = generateSetList(
      generateTemplate([block]),
      lookUpStoredBranchInCatalog,
      input,
      generatorOptions,
    );
    const exercise = generateCatalogReference(setList, "584");

    const entries = buildBranchSetList({
      exercise,
      block: createSetListBlock(
        block,
        readBlockTiming(block, {
          ...input,
          picksWorkout: createEmptyPicksWorkout(),
        }),
      ),
      input,
    });

    expect(entries).toEqual(listBranchEntries(setList, "584"));
  });

  // A duration block carries its minutes in `duration` like a branches block,
  // so the one branch build trains the drawn branch for the 20 minutes too.
  it("builds the drawn branch of a cardio duration block from its minutes", () => {
    const input = generateCatalogInput();
    const block = {
      kind: "duration",
      skill: "CARDIO_2",
      duration: 20 * SECONDS_PER_MINUTE,
    } as const;
    const setList = generateSetList(
      generateTemplate([block]),
      lookUpStoredBranchInCatalog,
      input,
      generatorOptions,
    );
    // the set list opens with a warm-up entry of the placeholder branch
    const drawnBranchId = setList.find(
      ({ branchId }) => !isPlaceholderBranch(branchId),
    )?.branchId;
    if (drawnBranchId === undefined) {
      throw new Error("The block run built no entry of a drawn branch");
    }
    const exercise = generateCatalogReference(setList, drawnBranchId);

    const entries = buildBranchSetList({
      exercise,
      block: createSetListBlock(
        block,
        readBlockTiming(block, {
          ...input,
          picksWorkout: createEmptyPicksWorkout(),
        }),
      ),
      input,
    });

    expect(entries).toEqual(listBranchEntries(setList, drawnBranchId));
  });
});
