import { loadExercises } from "@/data/loadExercises";
import { generateBranchLevel } from "@test/factories/generationInput";
import { generateSkillTreeBranches } from "@test/factories/ruleFamilyInput";
import { generateSkillBranch } from "@test/factories/skillTree";
import {
  mapFitnessLevelToEntryLevel,
  resolveBranchExercise,
  resolveBranchExerciseId,
  resolveBranchLevel,
} from "./branchResolution";

const SQUAT_BRANCH_ID = "253";

// The bodyweight squat branch, authored at levels 1, 2 and 4.
const squatBranch = generateSkillTreeBranches("SKKG", [SQUAT_BRANCH_ID])[
  SQUAT_BRANCH_ID
];

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
    "maps %p without an athlete branch level to level %p, falling back downward",
    (fitnessLevel, level) => {
      expect(resolveBranchLevel(squatBranch, fitnessLevel)).toBe(level);
      expect(resolveBranchLevel(squatBranch, fitnessLevel, null)).toBe(level);
    },
  );

  it("uses an authored stored level", () => {
    expect(
      resolveBranchLevel(
        squatBranch,
        "BEGINNER",
        generateBranchLevel(SQUAT_BRANCH_ID, 4),
      ),
    ).toBe(4);
  });

  it("maps the fitness level when the stored level is unauthored or 0", () => {
    expect(
      resolveBranchLevel(
        squatBranch,
        "PROFESSIONAL",
        generateBranchLevel(SQUAT_BRANCH_ID, 3),
      ),
    ).toBe(2);
    expect(
      resolveBranchLevel(
        squatBranch,
        "ADVANCED",
        generateBranchLevel(SQUAT_BRANCH_ID, 0),
      ),
    ).toBe(2);
  });

  it("returns null when no level at or below the entry level exists", () => {
    const branch = generateSkillBranch([], { 3: { exerciseId: "10" } });

    expect(resolveBranchLevel(branch, "ADVANCED")).toBeNull();
    expect(
      resolveBranchLevel(generateSkillBranch([], {}), "BEGINNER"),
    ).toBeNull();
  });
});

describe("branchResolution: resolveBranchExerciseId", () => {
  it("returns the exercise ID at the resolved level", () => {
    expect(resolveBranchExerciseId(squatBranch, "BEGINNER")).toBe("290");
    expect(resolveBranchExerciseId(squatBranch, "PROFESSIONAL")).toBe("516");
    expect(
      resolveBranchExerciseId(
        squatBranch,
        "BEGINNER",
        generateBranchLevel(SQUAT_BRANCH_ID, 4),
      ),
    ).toBe("234");
  });

  it("reads a legacy id when the exercise ID is empty", () => {
    const legacyLevel = { exerciseId: "", id: "77" };
    const emptyLevel = { exerciseId: "" };

    expect(
      resolveBranchExerciseId(
        generateSkillBranch([], { 1: legacyLevel }),
        "BEGINNER",
      ),
    ).toBe("77");
    expect(
      resolveBranchExerciseId(
        generateSkillBranch([], { 1: emptyLevel }),
        "BEGINNER",
      ),
    ).toBeNull();
  });

  it("returns null without a resolvable level", () => {
    expect(
      resolveBranchExerciseId(generateSkillBranch([], {}), "PROFESSIONAL"),
    ).toBeNull();
  });

  it("reads a stored day entry whose level names no exercise", () => {
    const storedLevels: Record<string, { exerciseId?: string }> = {
      "1": {},
      "2": { exerciseId: "516" },
    };

    expect(
      resolveBranchExerciseId({ levels: storedLevels }, "BEGINNER"),
    ).toBeNull();
    expect(resolveBranchExerciseId({ levels: storedLevels }, "ADVANCED")).toBe(
      "516",
    );
  });
});

describe("branchResolution: resolveBranchExercise", () => {
  const exerciseCatalog = loadExercises();

  it("returns the catalog exercise at the resolved level", () => {
    expect(
      resolveBranchExercise(squatBranch, "BEGINNER", exerciseCatalog)?.id,
    ).toBe("290");
    expect(
      resolveBranchExercise(
        squatBranch,
        "BEGINNER",
        exerciseCatalog,
        generateBranchLevel(SQUAT_BRANCH_ID, 4),
      )?.id,
    ).toBe("234");
  });

  it("returns null for an exercise missing from the catalog", () => {
    const withoutSquat = exerciseCatalog.filter(({ id }) => id !== "290");

    expect(
      resolveBranchExercise(squatBranch, "BEGINNER", withoutSquat),
    ).toBeNull();
    expect(
      resolveBranchExercise(
        generateSkillBranch([], { 1: { exerciseId: "-1" } }),
        "BEGINNER",
        exerciseCatalog,
      ),
    ).toBeNull();
  });

  it("returns null without a resolvable level", () => {
    expect(
      resolveBranchExercise(
        generateSkillBranch([], {}),
        "ADVANCED",
        exerciseCatalog,
      ),
    ).toBeNull();
  });
});
