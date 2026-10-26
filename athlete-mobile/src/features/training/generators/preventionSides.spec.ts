import type { SkillTypes } from "@/constants/workoutConstants";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { Superset } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserType } from "@/schemas/user.schema";
import {
  importTrees,
  noExerciseData,
  PAUSE_ID,
  realExercises,
} from "../../../../test/factories/planWorkout";
import PlacesData from "../../../../assets/data/generator/places.json";
import TrainingGenerator from "./TrainingGenerator";

const landing = realExercises.find(
  (exercise) => exercise.id === "1107",
) as ExerciseType;

const exercise = (
  id: string,
  sides: string[],
  otherSideExerciseId: string | null = null,
): ExerciseType => ({
  ...landing,
  id,
  tags: [...landing.tags.filter((tag) => !tag.startsWith("SIDE_")), ...sides],
  otherSideExerciseId,
});

const catalog: ExerciseType[] = [
  exercise("aR", ["SIDE_ONE", "SIDE_RIGHT"], "aL"),
  exercise("aL", ["SIDE_ONE", "SIDE_LEFT"], "aR"),
  exercise("bL", ["SIDE_ONE", "SIDE_LEFT"], "bR"),
  exercise("bR", ["SIDE_ONE", "SIDE_RIGHT"], "bL"),
  exercise("dR", ["SIDE_ONE", "SIDE_RIGHT"]),
  exercise("e", ["SIDE_BOTH"]),
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

const userWithPains = (pains: string[]): UserType => ({
  userId: "prevention-sides-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"], PAIN: pains },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
});

const setList = (skill: SkillTypes, pains: string[]) =>
  new TrainingGenerator().createSetList(
    [{ skill, length: 10, branches: branches() }],
    catalog,
    {},
    userWithPains(pains),
    "HOME",
    [],
    null,
  );

const workEntries = (skill: SkillTypes, pains: string[]) =>
  setList(skill, pains).filter((entry) => entry.exerciseId !== PAUSE_ID);

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

beforeEach(() => {
  jest.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getExercisePairs: prevention sides", () => {
  it.each(
    ["PREVKNEE", "WUSPEZIAL", "PREV"].flatMap((skill) =>
      [undefined, "drawOrderWithLeftovers" as Superset].map((pairing) => ({
        skill,
        pairing,
        label: pairing ?? "muscles default",
      })),
    ),
  )(
    "$skill pairs each one sided exercise with its other side for pairing $label",
    ({ skill, pairing }) => {
      const pairs = new TrainingGenerator()
        .getExercisePairs(skill, branches(), catalog, pairing)
        .map(({ first, second }) => [first.exerciseId, second?.exerciseId]);

      expect(pairs).toEqual(expect.arrayContaining(MIRROR_PAIRS));
    },
  );
});

describe("createSetList: prevention sides with pains", () => {
  it.each(PAIN_SETS)(
    "gives the same set list for pains %j as without pains",
    (pains) => {
      expect(setList("PREVKNEE", pains)).toEqual(setList("PREVKNEE", []));
    },
  );

  it.each(PAIN_SETS)(
    "trains both sides of every one sided exercise for pains %j",
    (pains) => {
      // 4 branches plus 2 mirrored sides, 2 sets each
      expect(workEntries("PREVKNEE", pains)).toHaveLength(12);
    },
  );

  it.each([[[]], [["KNEE_LEFT"]], [["SHOULDER_LEFT"]], [["SPINE"]]])(
    "WUSPEZIAL with pains %j pairs each one sided exercise with its other side",
    (pains: string[]) => {
      const ids = workEntries("WUSPEZIAL", pains).map(
        (entry) => entry.exerciseId,
      );

      expect(ids).toEqual(expect.arrayContaining(MIRROR_PAIRS.flat()));
      expect(setList("WUSPEZIAL", pains)).toEqual(setList("WUSPEZIAL", []));
    },
  );
});

describe("generateTraining: prevention sides in a short workout", () => {
  it("contains both sides of each one sided exercise for a right knee pain", () => {
    const exerciseById = new Map(
      realExercises.map((entry) => [entry.id, entry]),
    );
    const entries = new TrainingGenerator()
      .generateTraining(
        "PREVKNEE",
        userWithPains(["KNEE_RIGHT"]),
        "STUDIO",
        realExercises,
        importTrees("WUSPEZIAL", "PREV", "PREVKG"),
        1,
        PlacesData.STUDIO.EQUIPMENT,
        undefined,
        0,
        noExerciseData,
      )
      .filter(
        (entry) =>
          entry.exerciseId !== PAUSE_ID && entry.skill.startsWith("PREV"),
      );
    const ids = new Set(entries.map((entry) => entry.exerciseId));
    const oneSided = entries
      .map((entry) => exerciseById.get(entry.exerciseId))
      .filter((entry) => entry?.otherSideExerciseId);

    expect(oneSided.length).toBeGreaterThan(0);
    for (const entry of oneSided) {
      expect(ids.has(entry?.otherSideExerciseId ?? "")).toBe(true);
    }
  });
});
