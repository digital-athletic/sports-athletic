import { Logger } from "@/services/Logger";
import { generateStoredBranch } from "@test/factories/storedBranch";
import { generateSessionEntry } from "@test/factories/swapSession";
import {
  generateAdrPlanDay,
  generatePlanDaySwapWorkout,
  generateShortWorkout,
  generateSwapWorkout,
  generateSyntheticInput,
  generateSyntheticSkillTrees,
} from "@test/factories/swapWorkout";
import {
  generateBranchesBlock,
  generateShortTemplate,
  generateTemplate,
} from "@test/factories/templateBlock";
import { swapBranchFromWorkout } from "./swapWorkout";

// Each case below rejects at its own rule. The entry count and the exercise
// of another branch belong to replaceSessionBranch (swapEntries.spec.ts).
describe("swapBranchFromWorkout: returns null", () => {
  it("when the target is not in the session", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateAdrPlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(
        workout,
        "99999",
        generateStoredBranch("98003", [], "161"),
      ),
    ).toBeNull();
  });

  it("when the target is the placeholder branch", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateAdrPlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(
        workout,
        "-1",
        generateStoredBranch("98003", [], "161"),
      ),
    ).toBeNull();
  });

  it("when the session trains the target under two skills", () => {
    const day = generateTemplate([
      generateBranchesBlock("SYN", ["98001"], { duration: undefined }),
      generateBranchesBlock("SYN2", ["98001"], { duration: undefined }),
    ]);
    const workout = generateSwapWorkout({
      workout: day,
      session: [
        generateSessionEntry("98001", "114", "SYN", [1, 2]),
        generateSessionEntry("98001", "114", "SYN", [2, 2]),
        generateSessionEntry("98001", "114", "SYN2", [1, 2]),
        generateSessionEntry("98001", "114", "SYN2", [2, 2]),
      ],
      input: generateSyntheticInput(),
      skillTrees: generateSyntheticSkillTrees(),
    });

    expect(
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98003", [], "161"),
      ),
    ).toBeNull();
  });

  it("when the alternative branch is already in the session", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateAdrPlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98002", [], "115"),
      ),
    ).toBeNull();
  });

  it("when an exercise of the alternative is not in the catalog", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanDaySwapWorkout(
      generateAdrPlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98003", [], "eMissing"),
      ),
    ).toBeNull();
  });

  it("when a plan day contains two blocks of the skill", () => {
    const day = generateTemplate([
      generateBranchesBlock("SYN", ["98001"], { duration: undefined, sets: 3 }),
      generateBranchesBlock("SYN", ["98002"], { duration: undefined, sets: 2 }),
    ]);
    const workout = generatePlanDaySwapWorkout(
      day,
      generateSyntheticInput(),
      generateSyntheticSkillTrees(),
    );
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const swapped = swapBranchFromWorkout(
      workout,
      "98001",
      generateStoredBranch("98003", [], "161"),
    );

    expect([swapped, logError.mock.calls.length]).toEqual([null, 0]);
    logError.mockRestore();
  });

  // A plan day turns a cardio block into the CARDIO_5 run (branch 576) for a
  // region request, so the day has no block of the skill CARDIO_5.
  it("when the target is the branch of the CARDIO_5 replacement", () => {
    const day = generateTemplate([
      generateBranchesBlock("CARDIO_3", ["580"], { duration: 360 }),
    ]);
    const workout = generateSwapWorkout({
      workout: day,
      session: [generateSessionEntry("576", "eCardioA", "CARDIO_5")],
      input: generateSyntheticInput(),
      skillTrees: generateSyntheticSkillTrees(),
    });

    expect(
      swapBranchFromWorkout(
        workout,
        "576",
        generateStoredBranch("581", [], "eCardioB"),
      ),
    ).toBeNull();
  });

  // The block lists its exercises, so it selects no branch to swap. Two sets
  // match the two entries of the alternative, so only the block kind rejects it.
  it("when the block of the skill is an exercises block", () => {
    const day = generateTemplate([
      { kind: "exercises", skill: "SYN", exercises: ["114"], sets: 2 },
    ]);
    const workout = generateSwapWorkout({
      workout: day,
      session: [
        generateSessionEntry("98001", "114", "SYN", [1, 2]),
        generateSessionEntry("98001", "114", "SYN", [2, 2]),
      ],
      input: generateSyntheticInput(),
      skillTrees: generateSyntheticSkillTrees(),
    });
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const swapped = swapBranchFromWorkout(
      workout,
      "98001",
      generateStoredBranch("98003", [], "161"),
    );

    expect([swapped, logError.mock.calls.length]).toEqual([null, 0]);
    logError.mockRestore();
  });

  it("when the entries of two other branches of the skill interleave with the target", () => {
    const day = generateAdrPlanDay();
    const workout = generateSwapWorkout({
      workout: day,
      session: [
        generateSessionEntry("98001", "114", "SYN", [1, 2]),
        generateSessionEntry("98002", "115", "SYN"),
        generateSessionEntry("98003", "161", "SYN"),
        generateSessionEntry("98001", "114", "SYN", [2, 2]),
      ],
      input: generateSyntheticInput(),
      skillTrees: generateSyntheticSkillTrees(),
    });
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const swapped = swapBranchFromWorkout(
      workout,
      "98001",
      generateStoredBranch("98004", [], "164"),
    );

    expect([swapped, logError.mock.calls.length]).toEqual([null, 1]);
    logError.mockRestore();
  });

  it("when a short workout template contains the skill in two blocks", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const template = generateShortTemplate([
      generateBranchesBlock("SYN", ["98001"], { duration: undefined }),
      generateBranchesBlock("SYN", ["98002"], { duration: undefined }),
    ]);
    const workout = generateShortWorkout(
      template,
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(
        workout,
        "98001",
        generateStoredBranch("98003", [], "161"),
      ),
    ).toBeNull();
  });
});
