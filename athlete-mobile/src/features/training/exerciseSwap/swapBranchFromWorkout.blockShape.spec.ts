import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateTreeCatalogEntry } from "@test/factories/skillCatalog";
import { generateOneExerciseBranch } from "@test/factories/skillTree";
import { generateStoredBranch } from "@test/factories/storedBranch";
import {
  listEntriesOfBranch,
  listSetsOfBranch,
} from "@test/factories/swapSession";
import {
  generatePlanDaySwapWorkout,
  generateShortWorkout,
  generateSyntheticExerciseCatalog,
  generateSyntheticInput,
  generateSyntheticSkillTrees,
} from "@test/factories/swapWorkout";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
  generateTemplate,
} from "@test/factories/templateBlock";
import { listDistinctSessionBranchIds } from "./swapEntries";
import { listBranchAlternatives, swapBranchFromWorkout } from "./swapWorkout";

// The builder cases of branchSetList.spec.ts prove the entries of one branch.
// These cases prove that the swap passes the timing of each block kind to it.
describe("swapBranchFromWorkout: the shape of the block", () => {
  it("builds the intervals of a cardio alternative from the minutes of a plan day block", () => {
    const skillTrees = getAllSkillTrees();
    const input = generateGenerationInput({
      exerciseCatalog: generateSyntheticExerciseCatalog(),
      random: () => 0,
    });
    // 360 seconds are 6 minutes: two intervals of 2 minutes with a pause of 1 minute
    const day = generateTemplate([
      generateBranchesBlock("CARDIO_3", ["580"], { duration: 360 }),
    ]);
    const workout = generatePlanDaySwapWorkout(day, input, skillTrees);

    const swapped =
      swapBranchFromWorkout(
        workout,
        "580",
        generateStoredBranch("581", [], "eCardioB"),
      ) ?? [];

    expect(listSetsOfBranch(swapped, "581")).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it("takes the sets that workout setup resolved for a picks block without sets", () => {
    const skillTrees = {
      ...generateSyntheticSkillTrees(),
      SYN: { "98001": generateOneExerciseBranch("114") },
    };
    const input = generateSyntheticInput({ skillTrees });
    const workoutInput: GenerationInput = {
      ...input,
      skillCatalog: {
        ...input.skillCatalog,
        SYN: generateTreeCatalogEntry({
          skillTree: { withWeights: ["SYN"], withoutWeights: ["SYN"] },
          sets: 4,
        }),
      },
    };
    const workout = generateShortWorkout(
      generateShortTemplate([generatePicksBlock("SYN")]),
      workoutInput,
      skillTrees,
    );

    const swapped = swapBranchFromWorkout(
      workout,
      "98001",
      generateStoredBranch("98003", [], "161"),
    );

    expect(listSetsOfBranch(swapped ?? [], "98003")).toEqual([
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
    ]);
  });

  // The listing always filters by equipment. The last draw skips branch 582,
  // which carries no side tag and so matches no other CARDIO_2 branch.
  it("builds the entries of a cardio alternative within the minute budget of the duration block", () => {
    const skillTrees = getAllSkillTrees();
    const input = generateGenerationInput({
      exerciseCatalog: generateSyntheticExerciseCatalog(),
      random: () => 0.99,
      equipment: ["EQ_AREA_20", "EQ_AREA_10", "EQ_MARKERS", "EQ_TRACK_20"],
    });
    const workout = generateShortWorkout(
      generateShortTemplate([
        { kind: "duration", skill: "CARDIO_2", duration: 1200 },
      ]),
      input,
      skillTrees,
    );
    const [drawn] = listDistinctSessionBranchIds(workout.session);
    const [alternative] = listBranchAlternatives(workout, drawn);

    const swapped = swapBranchFromWorkout(workout, drawn, alternative) ?? [];

    const reference = generateShortWorkout(
      generateShortTemplate([
        generateBranchesBlock("CARDIO_2", [alternative.branchId], {
          duration: 1200,
        }),
      ]),
      input,
      skillTrees,
    );
    const readTiming = ({
      exerciseId,
      duration,
      set,
    }: UserExerciseDataType) => ({
      exerciseId,
      duration,
      set,
    });
    expect(
      listEntriesOfBranch(swapped, alternative.branchId).map(readTiming),
    ).toEqual(
      listEntriesOfBranch(reference.session, alternative.branchId).map(
        readTiming,
      ),
    );
  });
});
