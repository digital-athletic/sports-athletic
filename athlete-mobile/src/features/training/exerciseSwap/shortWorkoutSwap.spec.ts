import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { freezeShortWorkout } from "./shortWorkoutSwap";

/**
 * Builds a session entry of a skill, e.g. a first set of exercise "e10"
 * drawn from branch "10": { skill: "BAS", branchId: "10", exerciseId: "e10", set: [1, 2] }.
 */
const generateSkillSessionEntry = (
  skill: string,
  branchId: string | undefined,
  exerciseId: string,
  set: [number, number] = [1, 2],
): UserExerciseDataType => ({ skill, branchId, exerciseId, set });

describe("shortWorkoutSwap: freezeShortWorkout", () => {
  it("turns a picks block into a branches block that lists each session branch of its skill once, in session order", () => {
    const template = generateTemplate([generatePicksBlock("BAS")]);
    const session = [
      generateSkillSessionEntry("BAS", "12", "e12", [1, 2]),
      generateSkillSessionEntry("BAS", "10", "e10", [1, 2]),
      generateSkillSessionEntry("BAS", "12", "e12", [2, 2]),
    ];

    const frozen = freezeShortWorkout(template, session);

    expect(frozen.blocks).toStrictEqual([
      { kind: "branches", skill: "BAS", branches: ["12", "10"] },
    ]);
  });

  it("copies only the timing settings of the block", () => {
    const template = generateTemplate([
      generatePicksBlock("BAS", {
        superset: "muscles",
        sets: 3,
        setDuration: 40,
        values: "exercise",
        rest: { betweenSets: 20 },
        picks: [{ tags: ["REGION_CORE"], count: 2 }],
        bodyParts: { regions: ["core"] },
        countBy: "pairs",
        fallbackToWholeTree: true,
        order: "muscleGroups",
      }),
    ]);
    const session = [generateSkillSessionEntry("BAS", "10", "e10")];

    const frozen = freezeShortWorkout(template, session);

    expect(frozen.blocks).toStrictEqual([
      {
        kind: "branches",
        skill: "BAS",
        superset: "muscles",
        sets: 3,
        setDuration: 40,
        values: "exercise",
        rest: { betweenSets: 20 },
        branches: ["10"],
      },
    ]);
  });

  it("keeps only the session branches of a branches block", () => {
    const template = generateTemplate([
      generateBranchesBlock("GKS", ["20", "21", "22"], { duration: undefined }),
    ]);
    const session = [
      generateSkillSessionEntry("GKS", "22", "e22"),
      generateSkillSessionEntry("GKS", "20", "e20"),
    ];

    const frozen = freezeShortWorkout(template, session);

    expect(frozen.blocks).toStrictEqual([
      { kind: "branches", skill: "GKS", branches: ["22", "20"] },
    ]);
  });

  it("leaves placeholder branches and entries without a branch out of the branch list", () => {
    const template = generateTemplate([generatePicksBlock("BAS")]);
    const session = [
      generateSkillSessionEntry("BAS", undefined, "e1"),
      generateSkillSessionEntry("BAS", "10", "e10"),
      generateSkillSessionEntry("BAS", "-1", "999999"),
      generateSkillSessionEntry("BAS", "11", "e11"),
    ];

    const frozen = freezeShortWorkout(template, session);

    expect(frozen.blocks).toStrictEqual([
      { kind: "branches", skill: "BAS", branches: ["10", "11"] },
    ]);
  });

  it("drops a block whose skill has no session branch", () => {
    const template = generateTemplate([
      generatePicksBlock("WU"),
      generatePicksBlock("BAS"),
    ]);
    const session = [generateSkillSessionEntry("BAS", "10", "e10")];

    const frozen = freezeShortWorkout(template, session);

    expect(frozen.blocks).toStrictEqual([
      { kind: "branches", skill: "BAS", branches: ["10"] },
    ]);
  });

  it("drops blocks that share a skill", () => {
    const template = generateTemplate([
      generatePicksBlock("BAS"),
      generatePicksBlock("WU"),
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [
      generateSkillSessionEntry("BAS", "10", "e10"),
      generateSkillSessionEntry("WU", "30", "e30"),
    ];

    const frozen = freezeShortWorkout(template, session);

    expect(frozen.blocks).toStrictEqual([
      { kind: "branches", skill: "WU", branches: ["30"] },
    ]);
  });

  it("drops duration and exercises blocks", () => {
    const template = generateTemplate([
      { kind: "duration", skill: "CARDIO_3", duration: 600 },
      { kind: "exercises", skill: "MAX", exercises: ["26"] },
      generatePicksBlock("BAS"),
    ]);
    const session = [
      generateSkillSessionEntry("CARDIO_3", "580", "e580"),
      generateSkillSessionEntry("MAX", "40", "26"),
      generateSkillSessionEntry("BAS", "10", "e10"),
    ];

    const frozen = freezeShortWorkout(template, session);

    expect(frozen.blocks).toStrictEqual([
      { kind: "branches", skill: "BAS", branches: ["10"] },
    ]);
  });
});
