import { loadExercises } from "@/data/loadExercises";
import { loadTemplates } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { deepFreeze } from "@test/factories/deepFreeze";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { generateOneExerciseBranch } from "@test/factories/skillTree";
import {
  generateStoredBranch,
  generateStoredDayEntry,
} from "@test/factories/storedBranch";
import {
  listExerciseIdsOfBranch,
  listSetsOfBranch,
} from "@test/factories/swapSession";
import {
  generateAdrPlanDay,
  generatePlanDaySwapWorkout,
  generateShortWorkout,
  generateSyntheticInput,
  generateSyntheticSkillTrees,
} from "@test/factories/swapWorkout";
import {
  generatePicksBlock,
  generateShortTemplate,
} from "@test/factories/templateBlock";
import { listDistinctSessionBranchIds } from "./swapEntries";
import { listBranchAlternatives, swapBranchFromWorkout } from "./swapWorkout";

describe("swapBranchFromWorkout: the ADR example on a plan day", () => {
  it("writes the entries of the alternative at the set positions of the target", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateAdrPlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98003", [], "161"),
      ) ?? [];

    expect(listSetsOfBranch(swapped, "98003")).toEqual(
      listSetsOfBranch(workout.session, "98001"),
    );
    expect(listExerciseIdsOfBranch(swapped, "98003")).toEqual(["161", "161"]);
    expect(swapped.map(({ branchId }) => branchId)).toEqual(
      workout.session.map(({ branchId }) =>
        branchId === "98001" ? "98003" : branchId,
      ),
    );
  });

  it("leaves every entry of another branch unchanged", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateAdrPlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98003", [], "161"),
      ) ?? [];

    expect(swapped.filter(({ branchId }) => branchId !== "98003")).toEqual(
      workout.session.filter(({ branchId }) => branchId !== "98001"),
    );
  });

  it("does not mutate the session of the workout", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const day = deepFreeze(generateAdrPlanDay());
    const workout = generatePlanDaySwapWorkout(
      day,
      generateSyntheticInput(),
      skillTrees,
    );
    const sessionBefore = workout.session.map((entry) => ({ ...entry }));
    deepFreeze(workout.session);

    const swapped = swapBranchFromWorkout(
      workout,
      "98001",
      generateStoredBranch("98003", [], "161"),
    );

    expect(swapped).not.toBeNull();
    expect(workout.session).toEqual(sessionBefore);
  });
});

describe("swapBranchFromWorkout: the ADR example on a short workout", () => {
  it("writes the entries of the alternative in place of the drawn branch of a picks block", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const template = generateShortTemplate([
      generatePicksBlock("SYN"),
      generatePicksBlock("SYN2"),
    ]);
    const workout = generateShortWorkout(
      template,
      generateSyntheticInput(),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98003", [], "161"),
      ) ?? [];

    expect(swapped.map(({ branchId }) => branchId)).toEqual(
      workout.session.map(({ branchId }) =>
        branchId === "98001" ? "98003" : branchId,
      ),
    );
  });

  it("gives each exercise of a picks block three sets when the block asks for sets 3", () => {
    const skillTrees = {
      ...generateSyntheticSkillTrees(),
      SYN: { "98001": generateOneExerciseBranch("114") },
    };
    const template = generateShortTemplate([
      generatePicksBlock("SYN", { sets: 3 }),
    ]);
    const workout = generateShortWorkout(
      template,
      generateSyntheticInput({ skillTrees }),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98003", [], "161"),
      ) ?? [];

    expect(listSetsOfBranch(swapped, "98003")).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });
});

describe("swapBranchFromWorkout: bundled knee prevention training", () => {
  // Pins the bundled PREVKNEE template, skill trees and exercises, so a data
  // change fails this case even when the logic is unchanged.
  it("moves every exercise of the knee prevention training to its first alternative", () => {
    const skillTrees = getAllSkillTrees();
    const input = generateGenerationInput({
      exerciseCatalog: loadExercises(),
      equipment: ["DUMBBELL", "BARBELL", "BENCH", "FOAM_ROLLER", "TOWEL"],
      random: generateSeededRandom(1),
    });
    const workout = generateShortWorkout(
      loadTemplates().PREVKNEE,
      input,
      skillTrees,
    );
    const trainedBranchIds = listDistinctSessionBranchIds(workout.session);
    const offered = trainedBranchIds.flatMap((target) => {
      const [first] = listBranchAlternatives(workout, target);
      return first ? [{ target, first }] : [];
    });

    const moves = offered.map(({ target, first }) => {
      const swapped = swapBranchFromWorkout(workout, target, first);
      const branchIds = listDistinctSessionBranchIds(swapped ?? []);
      return {
        target,
        isSession: swapped !== null,
        includesAlternative: branchIds.includes(first.branchId),
        includesOriginal: branchIds.includes(target),
      };
    });

    expect(offered.map(({ target }) => target).sort()).toEqual(
      [...trainedBranchIds].sort(),
    );
    expect(moves).toEqual(
      moves.map(({ target }) => ({
        target,
        isSession: true,
        includesAlternative: true,
        includesOriginal: false,
      })),
    );
  });
});

describe("swapBranchFromWorkout: legacy stored day", () => {
  it("leaves the first alternative of the skill unchanged in a second swap", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const input = generateSyntheticInput();
    const day = {
      skills: {
        SYN: [
          generateStoredDayEntry("98001", ["SIDE_BOTH"], "114"),
          generateStoredDayEntry("98002", ["SIDE_BOTH"], "115"),
        ],
      },
      lengths: {},
    };
    const workout = generatePlanDaySwapWorkout(day, input, skillTrees);
    const first =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98003", [], "161"),
      ) ?? [];

    const second =
      swapBranchFromWorkout(
        { ...workout, session: first },
        "98002",
        generateStoredBranch("98004", [], "164"),
      ) ?? [];

    // the saved day stores 98001 and 98002 only, so 98003 comes from the catalog
    expect(listExerciseIdsOfBranch(second, "98004")).toEqual(["164", "164"]);
    expect(listExerciseIdsOfBranch(second, "98003")).toEqual(["161", "161"]);
    expect(second.filter(({ branchId }) => branchId === "98003")).toEqual(
      first.filter(({ branchId }) => branchId === "98003"),
    );
  });
});
