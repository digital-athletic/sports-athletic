import { PLACEHOLDER_BRANCH_ID } from "@/features/training/models/IdTypes";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { GenerationInput } from "./generationInput";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { generateSequenceRandom } from "../../../../test/factories/sequenceRandom";
import { generateValueExercise } from "../../../../test/factories/valueExercise";
import {
  buildSupportSets,
  EMPTY_SUPPORT_EXERCISE_TALLY,
  listSupportExercises,
  pickSupportExercise,
  readWeightedSupportShare,
} from "./supportExercisePick";

/**
 * Builds a two sided core support exercise advanced by duration. Extra tags
 * join the default tags; `tags` in the overrides replaces them.
 *
 * generateSupportExercise("s1", ["EQ_DUMBBELL"])
 * → { id: "s1", displayName: "Test Exercise", isAdvanceByReps: false,
 *     tags: ["SKILL_SUPPORT", "REGION_CORE", "MUSCLE_RECTUS_ABDOMINIS", "SIDE_BOTH", "EQ_DUMBBELL"], ... }
 */
const generateSupportExercise = (
  id: string,
  extraTags: string[] = [],
  overrides: Partial<ExerciseType> = {},
): ExerciseType => ({
  ...generateValueExercise("duration"),
  id,
  tags: [
    "SKILL_SUPPORT",
    "REGION_CORE",
    "MUSCLE_RECTUS_ABDOMINIS",
    "SIDE_BOTH",
    ...extraTags,
  ],
  ...overrides,
});

/**
 * Builds a weighted support exercise: dumbbells as equipment and weights as
 * equipment type.
 *
 * generateWeightedSupportExercise("w1")
 * → { id: "w1", tags: [..., "EQ_DUMBBELL", "EQ_TYPE_WEIGHTS"], ... }
 */
const generateWeightedSupportExercise = (
  id: string,
  overrides: Partial<ExerciseType> = {},
): ExerciseType =>
  generateSupportExercise(id, ["EQ_DUMBBELL", "EQ_TYPE_WEIGHTS"], overrides);

/**
 * Builds the main lift the support exercises rest around: a squat on the
 * quadriceps.
 *
 * generateMainLift()
 * → { id: "26", tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "MUSCLE_QUADRICEPS", "REGION_LOWER_BODY"], ... }
 */
const generateMainLift = (): ExerciseType => ({
  ...generateValueExercise("repetition", {
    tags: ["MUSCLE_QUADRICEPS", "REGION_LOWER_BODY"],
  }),
  id: "26",
});

/**
 * Lists the IDs of the support exercises for the main lift.
 *
 * listSupportExerciseIds([s1], { equipment: ["DUMBBELL"] }) → ["s1"]
 */
const listSupportExerciseIds = (
  exerciseCatalog: ExerciseType[],
  options: { soreMuscles?: string[]; equipment?: string[] } = {},
): string[] =>
  listSupportExercises(
    generateMainLift(),
    generateRuleFamilyInput({ ...options, exerciseCatalog }),
  ).map((exercise) => exercise.id);

/**
 * Builds a generation input at a place, for an athlete born on the birthday.
 *
 * generatePlaceInput("HOME", "1990-06-15")
 * → { place: "HOME", athlete: { personalData: { birthday: "1990-06-15", ... } }, ... }
 */
const generatePlaceInput = (
  place: string,
  birthday: string,
): GenerationInput => ({ ...generateRuleFamilyInput({ birthday }), place });

describe("listSupportExercises", () => {
  it("keeps the support exercises in catalog order", () => {
    expect(
      listSupportExerciseIds([
        generateSupportExercise("s2"),
        generateSupportExercise("s1"),
      ]),
    ).toEqual(["s2", "s1"]);
  });

  it.each<[string, ExerciseType, string[]]>([
    ["the left side", generateSupportExercise("s1", ["SIDE_LEFT"]), []],
    [
      "dumbbells at a place with dumbbells",
      generateSupportExercise("s1", ["EQ_DUMBBELL"]),
      ["DUMBBELL"],
    ],
  ])("keeps %s", (_, exercise, equipment) => {
    expect(listSupportExerciseIds([exercise], { equipment })).toEqual(["s1"]);
  });

  it.each<[string, ExerciseType, string[]]>([
    [
      "an exercise without the support skill",
      generateSupportExercise("s1", [], {
        tags: ["REGION_CORE", "MUSCLE_RECTUS_ABDOMINIS", "SIDE_BOTH"],
      }),
      [],
    ],
    ["the right side", generateSupportExercise("s1", ["SIDE_RIGHT"]), []],
    [
      "a sore region",
      generateSupportExercise("s1", [], {
        tags: ["SKILL_SUPPORT", "REGION_UPPER_BODY", "MUSCLE_CHEST"],
      }),
      ["CHEST"],
    ],
    [
      "a primary muscle of the main lift",
      generateSupportExercise("s1", ["MUSCLE_QUADRICEPS"]),
      [],
    ],
    [
      "dumbbells at a place without them",
      generateSupportExercise("s1", ["EQ_DUMBBELL"]),
      [],
    ],
  ])("drops %s", (_, exercise, soreMuscles) => {
    expect(listSupportExerciseIds([exercise], { soreMuscles })).toEqual([]);
  });

  it.each([null, ""])("drops an exercise with display name %p", (name) => {
    expect(
      listSupportExerciseIds([
        generateSupportExercise("s1", [], { displayName: name }),
      ]),
    ).toEqual([]);
  });
});

describe("readWeightedSupportShare", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ["a child in a studio", 0.3, "STUDIO", "2018-06-15"],
    ["an adult in a studio", 0.6, "STUDIO", "1990-06-15"],
    ["an adult at home", 0.5, "HOME", "1990-06-15"],
  ])("gives %s a weighted share of %p", (_, share, place, birthday) => {
    expect(readWeightedSupportShare(generatePlaceInput(place, birthday))).toBe(
      share,
    );
  });
});

describe("pickSupportExercise", () => {
  it("draws the first pick among the weighted exercises", () => {
    const pick = pickSupportExercise(
      [
        generateSupportExercise("b1"),
        generateWeightedSupportExercise("w1"),
        generateWeightedSupportExercise("w2"),
      ],
      EMPTY_SUPPORT_EXERCISE_TALLY,
      0.5,
      generateSequenceRandom([0.5]),
    );

    expect(pick?.exercise.id).toBe("w2");
    expect(pick?.tally).toEqual({
      usedExerciseIds: ["w2"],
      weightedCount: 1,
      bodyweightCount: 0,
    });
  });

  it.each([
    ["above the share, a bodyweight exercise", 2, 1, "b1"],
    ["at the share, a weighted exercise", 1, 1, "w1"],
  ])("picks with a weighted count %s", (_, weighted, bodyweight, id) => {
    const pick = pickSupportExercise(
      [generateSupportExercise("b1"), generateWeightedSupportExercise("w1")],
      {
        usedExerciseIds: [],
        weightedCount: weighted,
        bodyweightCount: bodyweight,
      },
      0.5,
      generateSequenceRandom([0]),
    );

    expect(pick?.exercise.id).toBe(id);
  });

  it("falls back to the other type and counts that type", () => {
    const pick = pickSupportExercise(
      [generateSupportExercise("b1")],
      EMPTY_SUPPORT_EXERCISE_TALLY,
      0.5,
      generateSequenceRandom([0]),
    );

    expect(pick?.tally).toEqual({
      usedExerciseIds: ["b1"],
      weightedCount: 0,
      bodyweightCount: 1,
    });
  });

  it("skips exercises the block used before", () => {
    const pick = pickSupportExercise(
      [
        generateWeightedSupportExercise("w1"),
        generateWeightedSupportExercise("w2"),
      ],
      { usedExerciseIds: ["w1"], weightedCount: 0, bodyweightCount: 1 },
      0.5,
      generateSequenceRandom([0]),
    );

    expect(pick?.exercise.id).toBe("w2");
    expect(pick?.tally.usedExerciseIds).toEqual(["w1", "w2"]);
  });

  it("picks nothing and draws nothing once every exercise is used", () => {
    expect(
      pickSupportExercise(
        [generateSupportExercise("b1")],
        { usedExerciseIds: ["b1"], weightedCount: 0, bodyweightCount: 1 },
        0.5,
        generateSequenceRandom([]),
      ),
    ).toBeUndefined();
  });
});

describe("buildSupportSets", () => {
  const athlete = () => generateRuleFamilyInput().athlete;

  it("builds two timed sets of 30 s for an exercise advanced by duration", () => {
    const exercise = generateSupportExercise("s1");
    const entry = {
      branchId: PLACEHOLDER_BRANCH_ID,
      exerciseId: "s1",
      tags: exercise.tags,
      set: [3, 5],
      skill: "MAX_STRENGTH",
      duration: 30,
      weight: undefined,
    };

    expect(
      buildSupportSets(exercise, athlete(), [3, 5], "MAX_STRENGTH"),
    ).toEqual([entry, entry]);
  });

  it("builds sets of 8 repetitions for an exercise advanced by repetitions", () => {
    const setList = buildSupportSets(
      generateSupportExercise("s1", [], {
        isAdvanceByReps: true,
        isAdvanceByDuration: false,
      }),
      athlete(),
      [3, 5],
      "MAX",
    );

    expect(setList.map((entry) => [entry.repetition, entry.duration])).toEqual([
      [8, undefined],
      [8, undefined],
    ]);
  });

  it("gives each set its own tags array", () => {
    const exercise = generateSupportExercise("s1");
    const [first, second] = buildSupportSets(
      exercise,
      athlete(),
      [3, 5],
      "MAX",
    );

    expect(first.tags).not.toBe(exercise.tags);
    expect(first.tags).not.toBe(second.tags);
  });

  it.each<[string, Partial<ExerciseType>, string[]]>([
    [
      "the other side second for a one sided exercise",
      { tags: ["SKILL_SUPPORT", "SIDE_ONE"], otherSideExerciseId: "s1r" },
      ["s1", "s1r"],
    ],
    [
      "one side twice without an other side exercise",
      { tags: ["SKILL_SUPPORT", "SIDE_ONE"], otherSideExerciseId: null },
      ["s1", "s1"],
    ],
    [
      "one exercise twice for a two sided exercise",
      { otherSideExerciseId: "s1r" },
      ["s1", "s1"],
    ],
  ])("trains %s", (_, overrides, exerciseIds) => {
    const setList = buildSupportSets(
      generateSupportExercise("s1", [], overrides),
      athlete(),
      [3, 5],
      "MAX",
    );

    expect(setList.map((entry) => entry.exerciseId)).toEqual(exerciseIds);
  });

  describe("weight", () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date("2026-10-24") });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    /**
     * Builds a weighted support exercise whose start weight is 12 kg for an
     * advanced man, 8 kg for an advanced woman and 4 kg for a child.
     *
     * generateAuthoredWeightExercise(["EQ_TYPE_WEIGHTS"])
     * → { id: "w1", tags: [..., "EQ_TYPE_WEIGHTS"],
     *     values: { weight: { startValue: { m: { advanced: 12 }, ... } } }, ... }
     */
    const generateAuthoredWeightExercise = (tags: string[]): ExerciseType =>
      generateSupportExercise("w1", tags, {
        values: {
          weight: {
            startValue: {
              m: { advanced: 12 },
              w: { advanced: 8 },
              k: { default: 4 },
            },
            targetValue: {},
          },
        },
      });

    it.each<[string, "MALE" | "FEMALE", string, number]>([
      ["an advanced man", "MALE", "1990-06-15", 12],
      ["an advanced woman", "FEMALE", "1990-06-15", 8],
      ["a child", "MALE", "2018-06-15", 4],
    ])("reads the start weight of %s", (_, gender, birthday, weight) => {
      const setList = buildSupportSets(
        generateAuthoredWeightExercise(["EQ_TYPE_WEIGHTS"]),
        generateRuleFamilyInput({ gender, birthday }).athlete,
        [3, 5],
        "MAX",
      );

      expect(setList.map((entry) => entry.weight)).toEqual([weight, weight]);
    });

    it("gives no weight without the weights equipment type", () => {
      const setList = buildSupportSets(
        generateAuthoredWeightExercise([]),
        athlete(),
        [3, 5],
        "MAX",
      );

      expect(setList.map((entry) => entry.weight)).toEqual([
        undefined,
        undefined,
      ]);
    });
  });
});
