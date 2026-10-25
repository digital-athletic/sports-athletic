import type { LevelTag } from "@/constants/workoutConstants";
import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import {
  isPauseExercise,
  PLACEHOLDER_BRANCH_ID,
} from "@/features/training/models/IdTypes";
import {
  DEFAULT_MAX_VALUE,
  DEFAULT_MAX_VALUES,
} from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { generateSupportExercise } from "@test/factories/supportExercise";
import { findCatalogExerciseById } from "@test/factories/valueExercise";
import { createGenerationInput, type GenerationInput } from "./generationInput";
import { buildMaxStrengthSetList } from "./maxStrengthSetListBuilder";
import type { SetListBlock } from "./setListBuilder";

// The barbell back squat; with a 1RM of 100 kg every kg value equals its
// weight percentage.
const SQUAT_ID = "26";

interface MaxStrengthInputOptions {
  level?: LevelTag;
  oneRepMax?: number;
  supportExercises?: ExerciseType[];
  exerciseData?: Record<string, UserExerciseDataType>;
  draws?: number[];
}

/**
 * Builds the input of an adult man at home whose squat has the given 1RM,
 * with the squat and the support exercises as catalog. The random returns
 * the draws in order and fails on one draw more.
 *
 * generateMaxStrengthInput({ oneRepMax: 100, draws: [0] })
 * → { athlete: { workoutData: { tags: { LEVEL: ["ADVANCED"] },
 *       maxValues: { kneeDominant: { barbell: 100, ... }, ... } } },
 *     place: "HOME", exerciseCatalog: [squat], random: () => 0, ... }
 */
const generateMaxStrengthInput = ({
  level = "ADVANCED",
  oneRepMax,
  supportExercises = [],
  exerciseData = {},
  draws = [],
}: MaxStrengthInputOptions = {}): GenerationInput =>
  createGenerationInput({
    athlete: {
      userId: "max-strength-athlete",
      personalData: { gender: "MALE", birthday: "1990-06-15" },
      workoutData: {
        tags: { LEVEL: [level] },
        maxValues:
          oneRepMax === undefined
            ? DEFAULT_MAX_VALUES
            : {
                ...DEFAULT_MAX_VALUES,
                kneeDominant: { ...DEFAULT_MAX_VALUE, barbell: oneRepMax },
              },
      },
      temporalData: [],
    },
    place: "HOME",
    equipment: [],
    exerciseCatalog: [findCatalogExerciseById(SQUAT_ID), ...supportExercises],
    exerciseData: { exerciseData, branchData: {} },
    random: generateSequenceRandom(draws),
  });

/**
 * Builds a max strength block. The builder reads only its skill.
 *
 * generateBlock() → { skill: "MAX_STRENGTH", minutes: 0, sets: 4, rest: { ... } }
 */
const generateBlock = (): SetListBlock => ({
  skill: "MAX_STRENGTH",
  minutes: 0,
  sets: 4,
  rest: { withinSuperset: 0, betweenSets: 180, afterExercise: 120 },
});

/**
 * Builds a pair whose lead is the exercise on the branch.
 *
 * generateLeadPair("b1") → { first: { branchId: "b1", exerciseId: "26", branchTags: ["SIDE_BOTH"] } }
 */
const generateLeadPair = (
  branchId: string,
  exerciseId = SQUAT_ID,
): ExercisePair => ({
  first: { branchId, exerciseId, branchTags: ["SIDE_BOTH"] },
});

/**
 * Builds the set list of one squat pair.
 *
 * buildSquatSetList({ oneRepMax: 100 })
 * → [{ exerciseId: "26", weight: 35, repetition: 6, set: [1, 5], ... }, { exerciseId: "999999", duration: 60, ... }, ...]
 */
const buildSquatSetList = (
  options: MaxStrengthInputOptions = {},
): GeneratedSetListEntry[] =>
  buildMaxStrengthSetList(
    [generateLeadPair("b1")],
    generateBlock(),
    generateMaxStrengthInput(options),
  );

/**
 * Describes each entry as "<exercise> <set>/<sets>" or "pause <seconds>".
 *
 * describeSetList([squat set [1, 5], pause 60]) → ["26 1/5", "pause 60"]
 */
const describeSetList = (setList: GeneratedSetListEntry[]): string[] =>
  setList.map((entry) =>
    isPauseExercise(entry.exerciseId)
      ? `pause ${entry.duration}`
      : `${entry.exerciseId} ${entry.set[0]}/${entry.set[1]}`,
  );

/**
 * Describes each squat set, warm-up sets included, as kg times repetitions.
 *
 * describeSquatSets([squat 35 kg x 6, pause 60, squat 70 kg x 5]) → ["35x6", "70x5"]
 */
const describeSquatSets = (setList: GeneratedSetListEntry[]): string[] =>
  setList
    .filter((entry) => entry.exerciseId === SQUAT_ID)
    .map((entry) => `${entry.weight}x${entry.repetition}`);

/**
 * Lists the entries of each rest between two working sets, after the two
 * warm-up sets.
 *
 * listRestsBetweenWorkingSets([warm-ups, squat 3/5, pause 180, squat 4/5, pause 180, squat 5/5, pause 120])
 * → [[pause 180], [pause 180]]
 */
const listRestsBetweenWorkingSets = (
  setList: GeneratedSetListEntry[],
): GeneratedSetListEntry[][] => {
  const workingSetIndexes = setList
    .map((entry, index) => (entry.exerciseId === SQUAT_ID ? index : -1))
    .filter((index) => index > -1)
    .slice(2);
  return workingSetIndexes
    .slice(0, -1)
    .map((start, i) => setList.slice(start + 1, workingSetIndexes[i + 1]));
};

/**
 * Runs the function and returns what it throws, or undefined. The workout
 * data check throws a plain object, which `toThrow` cannot compare.
 *
 * readThrownValue(() => { throw { type: "NO_ANAMNESIS" }; }) → { type: "NO_ANAMNESIS" }
 */
const readThrownValue = (run: () => unknown): unknown => {
  try {
    run();
  } catch (thrown) {
    return thrown;
  }
  return undefined;
};

describe("maxStrengthSetListBuilder: set list", () => {
  it("builds two warm-up sets and the working sets of an Advanced squat", () => {
    const setList = buildSquatSetList({ oneRepMax: 100 });

    expect(describeSetList(setList)).toEqual([
      "26 1/5",
      "pause 60",
      "26 2/5",
      "pause 60",
      "26 3/5",
      "pause 180",
      "26 4/5",
      "pause 180",
      "26 5/5",
      "pause 120",
    ]);
    expect(describeSquatSets(setList)).toEqual([
      "35x6",
      "52.5x5",
      "70x5",
      "72.5x2",
      "75x2",
    ]);
  });

  it("writes the branch, its own tags and the ladder entry on each squat set", () => {
    const pair = generateLeadPair("b1");
    const setList = buildMaxStrengthSetList(
      [pair],
      generateBlock(),
      generateMaxStrengthInput({ oneRepMax: 100 }),
    );

    expect(setList[0]).toEqual({
      branchId: "b1",
      exerciseId: SQUAT_ID,
      tags: ["SIDE_BOTH"],
      set: [1, 5],
      skill: "MAX_STRENGTH",
      weight: 35,
      repetition: 6,
      repetitionMAX: { level: "WARMUP", repetitions: 6 },
    });
    expect(setList[4]).toEqual({
      branchId: "b1",
      exerciseId: SQUAT_ID,
      tags: ["SIDE_BOTH"],
      set: [3, 5],
      skill: "MAX_STRENGTH",
      weight: 70,
      repetition: 5,
      repetitionMAX: { level: "MEDIUM", repetitions: 5, weightPercentage: 70 },
    });
    expect(setList[0].tags).not.toBe(pair.first.branchTags);
    expect(setList[1]).toEqual({
      branchId: PLACEHOLDER_BRANCH_ID,
      exerciseId: "999999",
      set: [1, 5],
      skill: "MAX_STRENGTH",
      duration: 60,
    });
  });

  it("rounds the warm-up sets from the displayed first working set", () => {
    const setList = buildSquatSetList({
      oneRepMax: 121,
      exerciseData: {
        [SQUAT_ID]: {
          exerciseId: SQUAT_ID,
          skill: "MAX_STRENGTH",
          maxFRepetitions: [
            { level: "MEDIUM", repetitions: 5, weightPercentage: 67.5 },
            { level: "EASY", repetitions: 3, weightPercentage: 70 },
            { level: "EASY", repetitions: 2, weightPercentage: 72.5 },
          ],
          feedback: { difficulty: null },
        },
      },
    });

    // 82.5 kg first working set: 41.25 and 61.875 kg round to 40 and 62.5 kg.
    expect(describeSquatSets(setList).slice(0, 3)).toEqual([
      "40x6",
      "62.5x5",
      "82.5x5",
    ]);
  });

  it("loads the working sets with 0 kg and the warm-up sets with the empty bar without a 1RM", () => {
    expect(describeSquatSets(buildSquatSetList())).toEqual([
      "20x6",
      "20x5",
      "0x5",
      "0x2",
      "0x2",
    ]);
  });

  it.each<[LevelTag, number, number]>([
    ["ADVANCED", 5, 180],
    ["PROFESSIONAL", 6, 240],
  ])(
    "%s: builds %i sets and rests %i s between working sets without a support exercise",
    (level, sets, rest) => {
      const rests = listRestsBetweenWorkingSets(
        buildSquatSetList({ level, oneRepMax: 100 }),
      );

      expect(rests).toHaveLength(sets - 3);
      for (const entries of rests) {
        expect(describeSetList(entries)).toEqual([`pause ${rest}`]);
      }
    },
  );

  it.each<[LevelTag, number, number[]]>([
    ["ADVANCED", 30, [0, 0]],
    ["PROFESSIONAL", 90, [0, 0, 0]],
  ])(
    "%s: rests 30 s, 60 s and %i s around the two support sets",
    (level, finalRest, draws) => {
      const setList = buildSquatSetList({
        level,
        oneRepMax: 100,
        supportExercises: [
          generateSupportExercise("s1"),
          generateSupportExercise("s2"),
          generateSupportExercise("s3"),
        ],
        draws,
      });
      const sets = draws.length + 3;

      expect(describeSetList(listRestsBetweenWorkingSets(setList)[0])).toEqual([
        "pause 30",
        `s1 3/${sets}`,
        "pause 60",
        `s1 3/${sets}`,
        `pause ${finalRest}`,
      ]);
    },
  );

  it("draws once per rest and rests without a support exercise once the pool runs out", () => {
    const setList = buildSquatSetList({
      oneRepMax: 100,
      supportExercises: [generateSupportExercise("s1")],
      draws: [0.99],
    });

    expect(listRestsBetweenWorkingSets(setList).map(describeSetList)).toEqual([
      ["pause 30", "s1 3/5", "pause 60", "s1 3/5", "pause 30"],
      ["pause 180"],
    ]);
  });

  it("uses each support exercise once per block, across its exercises", () => {
    const setList = buildMaxStrengthSetList(
      [generateLeadPair("b1"), generateLeadPair("b2")],
      generateBlock(),
      generateMaxStrengthInput({
        oneRepMax: 100,
        supportExercises: [
          generateSupportExercise("s1"),
          generateSupportExercise("s2"),
        ],
        draws: [0.5, 0],
      }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId.startsWith("s"))
        .map((entry) => entry.exerciseId),
    ).toEqual(["s2", "s2", "s1", "s1"]);
    expect(setList.filter((entry) => entry.duration === 180)).toHaveLength(2);
  });

  it("skips a pair whose lead is unresolved or missing from the catalog", () => {
    const setList = buildMaxStrengthSetList(
      [generateLeadPair("b1", "-1"), generateLeadPair("b2", "missing")],
      generateBlock(),
      generateMaxStrengthInput({ oneRepMax: 100 }),
    );

    expect(setList).toEqual([]);
  });

  it("throws for an athlete without workout data, even without pairs", () => {
    const input = generateMaxStrengthInput();

    expect(
      readThrownValue(() =>
        buildMaxStrengthSetList([], generateBlock(), {
          ...input,
          athlete: { ...input.athlete, workoutData: undefined },
        }),
      ),
    ).toEqual({
      type: "NO_ANAMNESIS",
      subtype: "MISSING_WORKOUT_DATA",
      params: [],
    });
  });
});
