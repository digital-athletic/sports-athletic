import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Superset } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { importTree, realExercises } from "@test/factories/planWorkout";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSetListBlock } from "@test/factories/setListBlock";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import { pairBranchExercises } from "./exercisePairing";
import { buildStandardSetList } from "./standardSetListBuilder";

const oneSided = (
  id: string,
  side: string,
  otherSideExerciseId: string | null = null,
): ExerciseType =>
  generateTaggedExercise(id, ["SIDE_ONE", side], { otherSideExerciseId });

const catalog: ExerciseType[] = [
  oneSided("aR", "SIDE_RIGHT", "aL"),
  oneSided("aL", "SIDE_LEFT", "aR"),
  oneSided("bL", "SIDE_LEFT", "bR"),
  oneSided("bR", "SIDE_RIGHT", "bL"),
  oneSided("dR", "SIDE_RIGHT"),
  generateTaggedExercise("e", ["SIDE_BOTH"]),
];

const reference = (
  branchId: string,
  exerciseId: string,
  side: string,
): BranchExerciseReference => ({
  branchId,
  exerciseId,
  branchTags: [side, "MUSCLE_GLUTES", "REGION_LOWER_BODY"],
});

const branches = (): BranchExerciseReference[] => [
  reference("a", "aR", "SIDE_ONE"),
  reference("b", "bL", "SIDE_ONE"),
  reference("d", "dR", "SIDE_ONE"),
  reference("e", "e", "SIDE_BOTH"),
];

const MIRROR_PAIRS = [
  ["aR", "aL"],
  ["bL", "bR"],
];

const PAIN_SETS = [
  [["KNEE_LEFT"]],
  [["KNEE_RIGHT"]],
  [["KNEE_LEFT", "KNEE_RIGHT"]],
  [["HIP_LEFT"]],
  [["HIP_LEFT", "HIP_RIGHT"]],
];

/**
 * Builds the set list of the four prevention branches for an athlete with the
 * given pains: pairs them by muscles, then builds the pairs of the skill.
 *
 * buildPreventionSetList("PREVKNEE", ["KNEE_LEFT"])
 * → [{ exerciseId: "aR", set: [1, 2], ... }, { exerciseId: "aL", ... }, ...]
 */
const buildPreventionSetList = (
  skill: "PREVKNEE" | "WUSPEZIAL",
  pains: string[],
): GeneratedSetListEntry[] => {
  const pairs = pairBranchExercises(branches(), catalog, "muscles", () => 0);
  return buildStandardSetList(
    pairs,
    generateSetListBlock(skill, {
      sets: skill === "WUSPEZIAL" ? 1 : 2,
      rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
    }),
    generateRuleFamilyInput({ exerciseCatalog: catalog, place: "HOME", pains }),
  );
};

const listWorkEntries = (setList: GeneratedSetListEntry[]) =>
  setList.filter((entry) => !isPauseExercise(entry.exerciseId));

const listExercisePairs = (pairs: ExercisePair[]) =>
  pairs.map(({ first, second }) => [first.exerciseId, second?.exerciseId]);

describe("prevention sides: pairing", () => {
  it.each<Superset>(["muscles", "drawOrderWithLeftovers"])(
    "pairs each one sided exercise with its other side for pairing %s",
    (superset) => {
      const pairs = pairBranchExercises(branches(), catalog, superset, () => 0);

      expect(listExercisePairs(pairs)).toEqual(
        expect.arrayContaining(MIRROR_PAIRS),
      );
    },
  );
});

describe("prevention sides: branches of one exercise", () => {
  it("does not pair PREVKG branches 103 and 634 with each other", () => {
    const tree = importTree("PREVKG");
    const sameExercise = ["103", "634"].map(
      (branchId): BranchExerciseReference => ({
        branchId,
        branchTags: tree[branchId].tags,
        exerciseId: "170",
      }),
    );

    const pairs = pairBranchExercises(
      sameExercise,
      realExercises,
      "muscles",
      () => 0,
    );

    expect(pairs.map((pair) => pair.second)).toEqual([undefined, undefined]);
  });
});

describe("prevention sides: set list with pains", () => {
  it.each(PAIN_SETS)(
    "gives the same set list for pains %j as without pains",
    (pains) => {
      expect(buildPreventionSetList("PREVKNEE", pains)).toEqual(
        buildPreventionSetList("PREVKNEE", []),
      );
    },
  );

  it.each(PAIN_SETS)(
    "trains both sides of every one sided exercise for pains %j",
    (pains) => {
      // 4 branches plus 2 mirrored sides, 2 sets each
      expect(
        listWorkEntries(buildPreventionSetList("PREVKNEE", pains)),
      ).toHaveLength(12);
    },
  );

  it.each([[[]], [["KNEE_LEFT"]], [["SHOULDER_LEFT"]], [["SPINE"]]])(
    "WUSPEZIAL with pains %j pairs each one sided exercise with its other side",
    (pains: string[]) => {
      const setList = buildPreventionSetList("WUSPEZIAL", pains);
      const ids = listWorkEntries(setList).map((entry) => entry.exerciseId);

      expect(ids).toEqual(expect.arrayContaining(MIRROR_PAIRS.flat()));
      expect(setList).toEqual(buildPreventionSetList("WUSPEZIAL", []));
    },
  );
});
