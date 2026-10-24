import { loadExercises } from "@/data/loadExercises";
import { getSkillTree } from "@/data/skillTreeRegistry";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import {
  mapFitnessLevelToEntryLevel,
  resolveBranchExercise,
  resolveBranchExerciseId,
  resolveBranchLevel,
} from "./branchResolution";

/**
 * Reads a branch of a shipped skill tree and fails the spec when it is gone.
 *
 * readShippedBranch("SKKG", "253")
 * → { tags: [...], levels: { 1: { exerciseId: "290" }, 2: { exerciseId: "516" }, 4: { exerciseId: "234" } } }
 */
const readShippedBranch = (
  skillTreeName: "SKKG",
  branchId: string,
): SkillBranchType => {
  const branch = getSkillTree(skillTreeName)?.[branchId];
  if (!branch) {
    throw new Error(`Unknown branch ${branchId} in ${skillTreeName}`);
  }
  return branch;
};

// The bodyweight squat lane of the branches spec: levels 1, 2 and 4.
const squatLane = readShippedBranch("SKKG", "253");

/**
 * Builds stored branch progress at the given level.
 *
 * generateBranchProgress(4)
 * → { branchId: "253", level: 4 }
 */
const generateBranchProgress = (level: number) => ({ branchId: "253", level });

describe("branchResolution: mapFitnessLevelToEntryLevel", () => {
  it.each([
    ["BEGINNER", 1],
    ["ADVANCED", 2],
    ["PROFESSIONAL", 3],
    ["", 1],
  ])("maps %p to entry level %p", (fitnessLevel, entryLevel) => {
    expect(mapFitnessLevelToEntryLevel(fitnessLevel)).toBe(entryLevel);
  });
});

describe("branchResolution: resolveBranchLevel", () => {
  it.each([
    ["BEGINNER", 1],
    ["ADVANCED", 2],
    ["PROFESSIONAL", 2],
  ])(
    "maps %p without branch progress to level %p, falling back downward",
    (fitnessLevel, level) => {
      expect(resolveBranchLevel(squatLane, fitnessLevel)).toBe(level);
      expect(resolveBranchLevel(squatLane, fitnessLevel, null)).toBe(level);
    },
  );

  it("uses an authored stored level", () => {
    expect(
      resolveBranchLevel(squatLane, "BEGINNER", generateBranchProgress(4)),
    ).toBe(4);
  });

  it("maps the fitness level when the stored level is unauthored or 0", () => {
    expect(
      resolveBranchLevel(squatLane, "PROFESSIONAL", generateBranchProgress(3)),
    ).toBe(2);
    expect(
      resolveBranchLevel(squatLane, "ADVANCED", generateBranchProgress(0)),
    ).toBe(2);
  });

  it("returns null when no level at or below the entry level exists", () => {
    const branch = { tags: [], levels: { 3: { exerciseId: "10" } } };

    expect(resolveBranchLevel(branch, "ADVANCED")).toBeNull();
    expect(resolveBranchLevel({ tags: [], levels: {} }, "BEGINNER")).toBeNull();
  });
});

describe("branchResolution: resolveBranchExerciseId", () => {
  it("returns the exercise ID at the resolved level", () => {
    expect(resolveBranchExerciseId(squatLane, "BEGINNER")).toBe("290");
    expect(resolveBranchExerciseId(squatLane, "PROFESSIONAL")).toBe("516");
    expect(
      resolveBranchExerciseId(squatLane, "BEGINNER", generateBranchProgress(4)),
    ).toBe("234");
  });

  it("reads a legacy id when the exercise ID is empty", () => {
    const legacyLevel = { exerciseId: "", id: "77" };
    const emptyLevel = { exerciseId: "" };

    expect(
      resolveBranchExerciseId(
        { tags: [], levels: { 1: legacyLevel } },
        "BEGINNER",
      ),
    ).toBe("77");
    expect(
      resolveBranchExerciseId(
        { tags: [], levels: { 1: emptyLevel } },
        "BEGINNER",
      ),
    ).toBeNull();
  });

  it("returns null without a resolvable level", () => {
    expect(
      resolveBranchExerciseId({ tags: [], levels: {} }, "PROFESSIONAL"),
    ).toBeNull();
  });
});

describe("branchResolution: resolveBranchExercise", () => {
  const exerciseCatalog = loadExercises();

  it("returns the catalog exercise at the resolved level", () => {
    expect(
      resolveBranchExercise(squatLane, "BEGINNER", exerciseCatalog)?.id,
    ).toBe("290");
    expect(
      resolveBranchExercise(
        squatLane,
        "BEGINNER",
        exerciseCatalog,
        generateBranchProgress(4),
      )?.id,
    ).toBe("234");
  });

  it("returns null for an exercise missing from the catalog", () => {
    const withoutSquat = exerciseCatalog.filter(({ id }) => id !== "290");

    expect(
      resolveBranchExercise(squatLane, "BEGINNER", withoutSquat),
    ).toBeNull();
    expect(
      resolveBranchExercise(
        { tags: [], levels: { 1: { exerciseId: "-1" } } },
        "BEGINNER",
        exerciseCatalog,
      ),
    ).toBeNull();
  });

  it("returns null without a resolvable level", () => {
    expect(
      resolveBranchExercise(
        { tags: [], levels: {} },
        "ADVANCED",
        exerciseCatalog,
      ),
    ).toBeNull();
  });
});
