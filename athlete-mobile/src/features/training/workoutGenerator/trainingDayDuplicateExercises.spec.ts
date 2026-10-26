import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserType } from "@/schemas/user.schema";
import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import {
  buildPlanUser,
  generatePlanWorkoutForWeekday,
  importTree,
  importTrees,
  PAUSE_ID,
} from "@test/factories/planWorkout";

// Stored day entry of a real branch
// planBranch("SWR1KG", "79") → { branchId: "79", tags: [...], exercises: { "1": { exerciseId: "269" }, ... } }
const planBranch = (skillTree: string, branchId: string) => {
  const branch = importTree(skillTree)[branchId];
  return {
    branchId,
    tags: branch.tags,
    exercises: Object.fromEntries(
      Object.entries(branch.levels).map(([level, data]) => [
        level,
        { exerciseId: data.exerciseId },
      ]),
    ),
  };
};

const generate = (
  user: UserType,
  trees: string[],
  place = "HALL",
  equipment: string[] = [],
) =>
  generatePlanWorkoutForWeekday(user, {
    place,
    equipment,
    skillTrees: importTrees("WU", "CARDIO_4", "CARDIO_5", ...trees),
  });

const exerciseBranchPairs = (entries: GeneratedSetListEntry[], skill: string) =>
  entries
    .filter((entry) => entry.skill === skill && entry.exerciseId !== PAUSE_ID)
    .map((entry) => [entry.exerciseId, entry.branchId]);

setUpAiwlGeneratorFlag(true);

beforeEach(() => {
  jest.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("training day duplicate exercises: kept branches with the same exercise", () => {
  it("replaces the second branch of SWR1KG 79 and 80, which both hold exercise 269", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        SWR1KG: [planBranch("SWR1KG", "79"), planBranch("SWR1KG", "80")],
      },
      lengths: { SWR1KG: 10 },
    });
    const pairs = exerciseBranchPairs(
      generate(user, ["SWR1KG"], "HALL", ["CHAIR"]),
      "SWR1KG",
    );
    const branchesPerExercise = new Map<string, Set<string>>();
    for (const [exerciseId, branchId] of pairs) {
      branchesPerExercise.set(
        exerciseId,
        (branchesPerExercise.get(exerciseId) ?? new Set()).add(branchId),
      );
    }
    expect(branchesPerExercise.size).toBeGreaterThan(1);
    expect(
      [...branchesPerExercise.values()].every(
        (branches) => branches.size === 1,
      ),
    ).toBe(true);
  });
});

describe("training day duplicate exercises: home place with foam roller and chair", () => {
  it("never repeats an exercise right after itself", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        SWR1KG: [planBranch("SWR1KG", "79"), planBranch("SWR1KG", "80")],
        GKSKG: ["939", "940", "941", "942"].map((id) =>
          planBranch("GKSKG", id),
        ),
      },
      lengths: { SWR1KG: 10, GKSKG: 10 },
    });
    const result = generate(user, ["SWR1KG", "GKSKG"], "HOME", [
      "FOAM_ROLLER",
      "CHAIR",
    ]).filter((entry) => entry.exerciseId !== PAUSE_ID);

    const repeats = result.filter((entry, index) => {
      const previous = result[index - 1];
      return (
        previous !== undefined &&
        previous.exerciseId === entry.exerciseId &&
        entry.set[0] <= previous.set[0]
      );
    });
    expect(result.length).toBeGreaterThan(0);
    expect(repeats).toEqual([]);
  });
});
