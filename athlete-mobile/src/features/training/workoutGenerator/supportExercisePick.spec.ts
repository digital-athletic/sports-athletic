import { PLACEHOLDER_BRANCH_ID } from "@/features/training/models/IdTypes";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateAthlete } from "@test/factories/athlete";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import {
  generateAuthoredWeightSupportExercise,
  generateSupportExercise,
  generateWeightedSupportExercise,
} from "@test/factories/supportExercise";
import { generateMainLiftExercise } from "@test/factories/valueExercise";
import {
  buildSupportSets,
  EMPTY_SUPPORT_EXERCISE_TALLY,
  listSupportExercises,
  pickSupportExercise,
  readWeightedSupportShare,
} from "./supportExercisePick";

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
    generateMainLiftExercise(),
    generateRuleFamilyInput({ ...options, exerciseCatalog }),
  ).map((exercise) => exercise.id);

describe("supportExercisePick: support pool", () => {
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

describe("supportExercisePick: weighted share", () => {
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
    expect(
      readWeightedSupportShare(generateRuleFamilyInput({ place, birthday })),
    ).toBe(share);
  });
});

describe("supportExercisePick: pick", () => {
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

describe("supportExercisePick: support sets", () => {
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
      buildSupportSets(exercise, generateAthlete(), [3, 5], "MAX_STRENGTH"),
    ).toEqual([entry, entry]);
  });

  it("builds sets of 8 repetitions for an exercise advanced by repetitions", () => {
    const setList = buildSupportSets(
      generateSupportExercise("s1", [], {
        isAdvanceByReps: true,
        isAdvanceByDuration: false,
      }),
      generateAthlete(),
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
      generateAthlete(),
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
      generateAthlete(),
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

    it.each<[string, "MALE" | "FEMALE", string, number]>([
      ["an advanced man", "MALE", "1990-06-15", 12],
      ["an advanced woman", "FEMALE", "1990-06-15", 8],
      ["a child", "MALE", "2018-06-15", 4],
    ])("reads the start weight of %s", (_, gender, birthday, weight) => {
      const setList = buildSupportSets(
        generateAuthoredWeightSupportExercise(["EQ_TYPE_WEIGHTS"]),
        generateRuleFamilyInput({ gender, birthday }).athlete,
        [3, 5],
        "MAX",
      );

      expect(setList.map((entry) => entry.weight)).toEqual([weight, weight]);
    });

    it.each<[string, ExerciseType]>([
      [
        "without the weights equipment type",
        generateAuthoredWeightSupportExercise([]),
      ],
      [
        "for an authored weight of -1",
        generateSupportExercise("w1", ["EQ_TYPE_WEIGHTS"], {
          values: {
            weight: { startValue: { m: { advanced: -1 } }, targetValue: {} },
          },
        }),
      ],
      [
        "for the weights equipment type without an authored weight",
        generateSupportExercise("w1", ["EQ_TYPE_WEIGHTS"]),
      ],
    ])("gives no weight %s", (_, exercise) => {
      const setList = buildSupportSets(
        exercise,
        generateAthlete(),
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
