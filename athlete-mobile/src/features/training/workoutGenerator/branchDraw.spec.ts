import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  SkillBranchType,
  SkillTreeType,
} from "@/schemas/skillTree.schema";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { type BranchDrawSource, createBranchDraw } from "./branchDraw";

/**
 * Builds a skill tree branch with one exercise per level, starting at level 1.
 *
 * generateTreeBranch(["e1", "e1x"])
 * → { tags: [], levels: { 1: { exerciseId: "e1" }, 2: { exerciseId: "e1x" } } }
 */
const generateTreeBranch = (exerciseIds: string[]): SkillBranchType => ({
  tags: [],
  levels: Object.fromEntries(
    exerciseIds.map((exerciseId, index) => [index + 1, { exerciseId }]),
  ),
});

/**
 * Builds a catalog exercise with the given tags and no values.
 *
 * generateCatalogExercise("e1", ["SIDE_BOTH"])
 * → { id: "e1", name: "e1", tags: ["SIDE_BOTH"], level: { m: 1, w: 1 }, values: null, ... }
 */
const generateCatalogExercise = (id: string, tags: string[]): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name: id,
  displayName: null,
  description: null,
  picture: null,
  video: null,
  values: null,
  tags,
  isAdvanceByReps: true,
  isAdvanceByDuration: false,
  isJump: false,
});

/**
 * Builds the draw source of an ADVANCED athlete without stored branch levels.
 * The pool doubles as the branches the specs draw from.
 *
 * generateDrawSource({ 1: generateTreeBranch(["e1"]) }, [0.5])
 * → { pool: { 1: ... }, fitnessLevel: "ADVANCED", exerciseCatalog: [],
 *     exerciseData: { exerciseData: {}, branchData: {} }, random: <0.5, then throws> }
 */
const generateDrawSource = (
  pool: SkillTreeType,
  draws: number[],
  change: Partial<BranchDrawSource> = {},
): BranchDrawSource => ({
  pool,
  fitnessLevel: "ADVANCED",
  exerciseCatalog: [],
  exerciseData: { exerciseData: {}, branchData: {} },
  random: generateSequenceRandom(draws),
  ...change,
});

describe("branchDraw: single", () => {
  it.each<{
    behaviour: string;
    draws: number[];
    used: string[];
    drawn: string | null;
  }>([
    {
      behaviour: "draws among the candidates through the random source",
      draws: [0.5],
      used: [],
      drawn: "2",
    },
    {
      behaviour:
        "skips a used branch and a branch whose exercise a used branch resolves to",
      draws: [0],
      used: ["1"],
      drawn: "2",
    },
    {
      behaviour: "returns null without a draw once every candidate is used",
      draws: [],
      used: ["1", "2"],
      drawn: null,
    },
  ])("$behaviour", ({ draws, used, drawn }) => {
    const pool = {
      1: generateTreeBranch(["e1", "e1x"]),
      2: generateTreeBranch(["e2"]),
      3: generateTreeBranch(["e1x"]),
    };

    const result = createBranchDraw(generateDrawSource(pool, draws)).single(
      pool,
      used,
    );

    expect(result?.branchId ?? null).toBe(drawn);
  });

  it("resolves the exercise at the fitness level and returns the branch tags", () => {
    const pool = {
      1: { ...generateTreeBranch(["e1", "e1x"]), tags: ["SIDE_BOTH"] },
    };

    expect(
      createBranchDraw(generateDrawSource(pool, [0])).single(pool, []),
    ).toEqual({ branchId: "1", branchTags: ["SIDE_BOTH"], exerciseId: "e1x" });
  });

  it("resolves the stored branch level before the fitness level", () => {
    const pool = { 1: generateTreeBranch(["e1", "e1x", "e1y"]) };
    const source = generateDrawSource(pool, [0], {
      exerciseData: {
        exerciseData: {},
        branchData: { 1: { branchId: "1", level: 3 } },
      },
    });

    expect(createBranchDraw(source).single(pool, [])?.exerciseId).toBe("e1y");
  });

  it("never draws a branch without a level at or below the entry level", () => {
    const pool = {
      1: { tags: [], levels: { 3: { exerciseId: "e3" } } },
      2: generateTreeBranch(["e2"]),
    };

    expect(
      createBranchDraw(generateDrawSource(pool, [0])).single(pool, [])
        ?.branchId,
    ).toBe("2");
  });

  it("resolves used exercises against the workout pool", () => {
    const pool = { 1: generateTreeBranch(["e1"]) };
    const blockBranches = { 2: generateTreeBranch(["e1"]) };

    expect(
      createBranchDraw(generateDrawSource(pool, [])).single(blockBranches, [
        "1",
      ]),
    ).toBeNull();
  });
});

describe("branchDraw: pair", () => {
  const pool = {
    1: generateTreeBranch(["e1"]),
    2: generateTreeBranch(["e2"]),
    3: generateTreeBranch(["e3"]),
  };

  it.each<{
    behaviour: string;
    draws: number[];
    tags: Record<string, string[]>;
    lead: string;
    partner?: string;
    branches?: SkillTreeType;
  }>([
    {
      behaviour: "draws no partner for an exercise that is not both sided",
      draws: [0],
      tags: { e1: ["SIDE_ONE"], e2: ["SIDE_BOTH"], e3: ["SIDE_BOTH"] },
      lead: "1",
    },
    {
      behaviour: "stops the partner search at a bare opposite direction tag",
      draws: [0, 0],
      tags: {
        e1: ["SIDE_BOTH", "EXERCISE_DIRECTION_HIP"],
        e2: ["SIDE_BOTH", "KNEE"],
        e3: ["SIDE_BOTH"],
      },
      lead: "1",
      partner: "2",
    },
    {
      behaviour: "keeps searching past a prefixed opposite direction tag",
      draws: [0, 0, 0],
      tags: {
        e1: ["SIDE_BOTH", "EXERCISE_DIRECTION_HIP"],
        e2: ["SIDE_BOTH", "EXERCISE_DIRECTION_KNEE"],
        e3: ["SIDE_BOTH"],
      },
      lead: "1",
      partner: "3",
    },
    {
      behaviour:
        "skips a candidate that resolves to the lead's exercise without a draw",
      draws: [0, 0],
      tags: { e1: ["SIDE_BOTH"], e3: ["SIDE_BOTH"] },
      lead: "1",
      partner: "3",
      branches: {
        1: generateTreeBranch(["e1"]),
        2: generateTreeBranch(["e1"]),
        3: generateTreeBranch(["e3"]),
      },
    },
    {
      behaviour:
        "draws once per unused candidate and keeps the last both sided partner",
      draws: [0.5, 0.9, 0.9],
      tags: { e1: ["SIDE_BOTH"], e2: ["SIDE_BOTH"], e3: ["SIDE_BOTH"] },
      lead: "2",
      partner: "3",
    },
    {
      behaviour: "skips a partner that is not both sided",
      draws: [0, 0, 0],
      tags: { e1: ["SIDE_BOTH"], e2: ["SIDE_BOTH"], e3: ["SIDE_ONE"] },
      lead: "1",
      partner: "2",
    },
  ])("$behaviour", ({ draws, tags, lead, partner, branches = pool }) => {
    const exerciseCatalog = Object.entries(tags).map(([id, exerciseTags]) =>
      generateCatalogExercise(id, exerciseTags),
    );
    const random = generateSequenceRandom([...draws, 0.99]);

    const result = createBranchDraw(
      generateDrawSource(branches, [], { exerciseCatalog, random }),
    ).pair(branches, []);

    expect(result?.lead.branchId).toBe(lead);
    expect(result?.partner?.branchId).toBe(partner);
    // the closing value stays unused, so the row fixes the draw count
    expect(random()).toBe(0.99);
  });

  it("returns null without a draw when no candidate is left", () => {
    expect(
      createBranchDraw(generateDrawSource(pool, [])).pair(pool, [
        "1",
        "2",
        "3",
      ]),
    ).toBeNull();
  });
});
