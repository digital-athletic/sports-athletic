import { generateStoredBranch } from "@test/factories/storedBranch";
import { listExerciseIdsOfBranch } from "@test/factories/swapSession";
import {
  generateAdrPlanDay,
  generatePlanDaySwapWorkout,
  generateShortWorkout,
  generateSyntheticInput,
  generateSyntheticSkillTrees,
} from "@test/factories/swapWorkout";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
  generateTemplate,
} from "@test/factories/templateBlock";
import { swapBranchFromWorkout } from "./swapWorkout";

describe("swapBranchFromWorkout: blocks of the plan day", () => {
  it("returns a session when another block of the workout throws on muscle soreness", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const day = generateTemplate([
      generateBranchesBlock("MOB", ["98201"], { duration: undefined }),
      generateBranchesBlock("SYN", ["98001"], { duration: undefined }),
    ]);
    const workout = generatePlanDaySwapWorkout(
      day,
      generateSyntheticInput(),
      skillTrees,
    );
    // the mobility skill ignores soreness; the SYN block throws for two sore regions
    const soreInput = generateSyntheticInput({
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    const swapped = swapBranchFromWorkout(
      { ...workout, input: { ...workout.input, ...soreInput } },
      "98201",
      generateStoredBranch("98202", [], "161"),
    );

    expect(listExerciseIdsOfBranch(swapped ?? [], "98202")).toEqual([
      "161",
      "161",
    ]);
  });
});

describe("swapBranchFromWorkout: filters apply when the alternatives are listed", () => {
  it("returns a session when muscle soreness appears after the draw", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateAdrPlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );
    // the athlete reports soreness in two regions after the session is drawn
    const soreInput = generateSyntheticInput({
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    const swapped = swapBranchFromWorkout(
      { ...workout, input: { ...workout.input, ...soreInput } },
      "98001",
      generateStoredBranch("98003", [], "161"),
    );

    expect(listExerciseIdsOfBranch(swapped ?? [], "98003")).toEqual([
      "161",
      "161",
    ]);
  });

  it("returns a session when knee pain empties the picks pool after the draw", () => {
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
    // knee pain empties the picks pool when every branch blocks the knee
    const blockedTrees = generateSyntheticSkillTrees([
      "SIDE_BOTH",
      "BLOCK_KNEE",
    ]);
    const painInput = generateSyntheticInput({
      pains: ["KNEE_LEFT"],
      skillTrees: blockedTrees,
    });

    const swapped = swapBranchFromWorkout(
      { ...workout, input: { ...workout.input, ...painInput } },
      "98001",
      generateStoredBranch("98003", [], "161"),
    );

    expect(listExerciseIdsOfBranch(swapped ?? [], "98003")).toEqual([
      "161",
      "161",
    ]);
  });
});
