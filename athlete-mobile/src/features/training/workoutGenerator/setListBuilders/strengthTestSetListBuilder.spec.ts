import { generateExercisesBlock } from "@test/factories/exercisesBlock";
import { generateMaxValues } from "@test/factories/maxValues";
import { describeSetListEntries } from "@test/factories/setListDescription";
import { generateStrengthTestInput } from "@test/factories/strengthTestInput";
import { generatePrescribedLifts } from "@test/factories/strengthTestLifts";
import {
  generateAuthoredTestSets,
  generateOneRepMaxShares,
  generateTestSetLoads,
} from "@test/factories/testSets";
import { createStrengthTestSetListBuilder } from "./strengthTestSetListBuilder";

// 1RM shares of 0.5, 0.6 and 0.7 differ from the bundled 0.75, 0.8 and 0.85.
const ONE_REP_MAX_SHARES = generateOneRepMaxShares({
  advanced: 0.6,
  professional: 0.7,
});

describe("strengthTestSetListBuilder: createStrengthTestSetListBuilder", () => {
  it("reads only the testSets block setting", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    expect(builder.blockSettings).toEqual(["testSets"]);
  });

  it("builds one set and one rest per authored test set from the block", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput({
        level: "BEGINNER",
        maxValues: generateMaxValues({ kneeDominant: 100 }),
      }),
    );

    expect(setList).toEqual([
      {
        branchId: "-1",
        exerciseId: "25",
        set: [1, 2],
        weight: 25,
        repetition: 8,
        skill: "TEST",
      },
      {
        branchId: "-1",
        exerciseId: "999999",
        set: [1, 2],
        duration: 45,
        skill: "TEST",
      },
      {
        branchId: "-1",
        exerciseId: "25",
        set: [2, 2],
        weight: 50,
        repetition: -1,
        skill: "TEST",
      },
      {
        branchId: "-1",
        exerciseId: "999999",
        set: [2, 2],
        duration: 90,
        skill: "TEST",
      },
    ]);
  });

  it("numbers the sets by the length of the authored test sets", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: [
          { share: 0.3, repetitions: 5, rest: 20 },
          { share: 0.6, repetitions: 3, rest: 30 },
          { share: 0.9, repetitions: 1, rest: 40 },
        ],
      }),
      generateStrengthTestInput({
        level: "BEGINNER",
        maxValues: generateMaxValues({ kneeDominant: 100 }),
      }),
    );

    expect(describeSetListEntries(setList)).toEqual([
      "25 1/3",
      "pause 20",
      "25 2/3",
      "pause 30",
      "25 3/3",
      "pause 40",
    ]);
  });

  it("multiplies the rounded test set load by the authored share of each test set", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: [
          { share: 0.3, repetitions: 5, rest: 20 },
          { share: 0.6, repetitions: 3, rest: 30 },
          { share: 0.9, repetitions: 1, rest: 40 },
        ],
      }),
      generateStrengthTestInput({
        level: "BEGINNER",
        maxValues: generateMaxValues({ kneeDominant: 100 }),
      }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId === "25")
        .map((entry) => entry.weight),
    ).toEqual([15, 30, 45]);
  });

  it("builds the repetitions of an authored number of repetitions", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: [{ share: 1, repetitions: 11, rest: 10 }],
      }),
      generateStrengthTestInput(),
    );

    expect(setList[0].repetition).toBe(11);
  });

  it("builds the repetition -1 for the repetitions amrap", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: [{ share: 1, repetitions: "amrap", rest: 10 }],
      }),
      generateStrengthTestInput(),
    );

    expect(setList[0].repetition).toBe(-1);
  });

  it("builds the lifts one after the other in the given order", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["54", "25"]),
      generateExercisesBlock(["54", "25"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput(),
    );

    expect(describeSetListEntries(setList)).toEqual([
      "54 1/2",
      "pause 45",
      "54 2/2",
      "pause 90",
      "25 1/2",
      "pause 45",
      "25 2/2",
      "pause 90",
    ]);
  });

  it("keeps the authored rest after the last test set", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput(),
    );

    expect(setList.at(-1)).toEqual({
      branchId: "-1",
      exerciseId: "999999",
      set: [2, 2],
      duration: 90,
      skill: "TEST",
    });
  });

  it.each([
    ["BEGINNER", [25, 50]],
    ["ADVANCED", [30, 60]],
    ["PROFESSIONAL", [35, 70]],
  ] as const)(
    "takes the bound 1RM share of a %s athlete as test set load, with the loads %j for a 1RM of 100",
    (level, expectedWeights) => {
      const builder = createStrengthTestSetListBuilder({
        testSetLoads: generateTestSetLoads(),
        oneRepMaxShares: ONE_REP_MAX_SHARES,
      });

      const setList = builder.build(
        generatePrescribedLifts(["25"]),
        generateExercisesBlock(["25"], "TEST", {
          testSets: generateAuthoredTestSets(),
        }),
        generateStrengthTestInput({
          level,
          maxValues: generateMaxValues({ kneeDominant: 100 }),
        }),
      );

      expect(
        setList
          .filter((entry) => entry.exerciseId === "25")
          .map((entry) => entry.weight),
      ).toEqual(expectedWeights);
    },
  );

  it("takes the 1RM of the movement direction of each lift", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25", "54"]),
      generateExercisesBlock(["25", "54"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput({
        level: "ADVANCED",
        maxValues: generateMaxValues({ kneeDominant: 100, verticalPush: 50 }),
      }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId === "54")
        .map((entry) => entry.weight),
    ).toEqual([15, 30]);
  });

  it("prefers the 1RM over the authored test set load", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput({
        level: "BEGINNER",
        gender: "MALE",
        maxValues: generateMaxValues({ kneeDominant: 41.3 }),
      }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId === "25")
        .map((entry) => entry.weight),
    ).toEqual([10, 20]);
  });

  it("takes the authored load of a man for a lift without a 1RM", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput({ level: "BEGINNER", gender: "MALE" }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId === "25")
        .map((entry) => entry.weight),
    ).toEqual([20, 40]);
  });

  it("takes the authored load of a woman for a lift without a 1RM", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput({ level: "ADVANCED", gender: "FEMALE" }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId === "25")
        .map((entry) => entry.weight),
    ).toEqual([22.5, 45]);
  });

  it("takes the authored load for the lift whose direction has no 1RM", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["54"]),
      generateExercisesBlock(["54"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput({
        level: "BEGINNER",
        gender: "MALE",
        maxValues: generateMaxValues({ kneeDominant: 100 }),
      }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId === "54")
        .map((entry) => entry.weight),
    ).toEqual([12.5, 25]);
  });

  it("throws for a man when no test set load is authored for the lift", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: {},
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    expect(() =>
      builder.build(
        generatePrescribedLifts(["25"]),
        generateExercisesBlock(["25"], "TEST", {
          testSets: generateAuthoredTestSets(),
        }),
        generateStrengthTestInput({ level: "ADVANCED", gender: "MALE" }),
      ),
    ).toThrow("TEST: lift 25 has no test set load for m");
  });

  it("throws for a woman when the lift has test set loads for men only", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: { "25": { m: generateTestSetLoads()["25"].m } },
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    expect(() =>
      builder.build(
        generatePrescribedLifts(["25"]),
        generateExercisesBlock(["25"], "TEST", {
          testSets: generateAuthoredTestSets(),
        }),
        generateStrengthTestInput({ level: "ADVANCED", gender: "FEMALE" }),
      ),
    ).toThrow("TEST: lift 25 has no test set load for w");
  });

  it("builds a lift with a 1RM and no authored test set load", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: {},
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput({
        level: "BEGINNER",
        maxValues: generateMaxValues({ kneeDominant: 100 }),
      }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId === "25")
        .map((entry) => entry.weight),
    ).toEqual([25, 50]);
  });

  // 50 % of 22 kg is 11 kg and rounds to a 10 kg test set load; half of that
  // is 5 kg, below the 20 kg empty bar.
  it("rounds the ramp up loads from the rounded test set load without an empty bar minimum", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["25"]),
      generateExercisesBlock(["25"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput({
        level: "BEGINNER",
        maxValues: generateMaxValues({ kneeDominant: 22 }),
      }),
    );

    expect(
      setList
        .filter((entry) => entry.exerciseId === "25")
        .map((entry) => entry.weight),
    ).toEqual([5, 10]);
  });

  it("throws for an unknown fitness level", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });
    const input = generateStrengthTestInput();

    expect(() =>
      builder.build(
        generatePrescribedLifts(["25"]),
        generateExercisesBlock(["25"], "TEST", {
          testSets: generateAuthoredTestSets(),
        }),
        {
          ...input,
          athlete: {
            ...input.athlete,
            workoutData: { tags: { LEVEL: ["INVALID"] } },
          },
        },
      ),
    ).toThrow("Invalid userLevel for TEST_WORKOUT: INVALID");
  });

  it("builds nothing for a lift missing from the exercise catalog", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    const setList = builder.build(
      generatePrescribedLifts(["NOT_IN_CATALOG"]),
      generateExercisesBlock(["NOT_IN_CATALOG"], "TEST", {
        testSets: generateAuthoredTestSets(),
      }),
      generateStrengthTestInput(),
    );

    expect(setList).toEqual([]);
  });

  it("throws for a block without testSets", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    expect(() =>
      builder.build(
        generatePrescribedLifts(["25"]),
        generateExercisesBlock(["25"], "TEST"),
        generateStrengthTestInput(),
      ),
    ).toThrow("TEST: the strengthTest builder needs testSets");
  });

  it("names the skill of the block in the missing testSets error", () => {
    const builder = createStrengthTestSetListBuilder({
      testSetLoads: generateTestSetLoads(),
      oneRepMaxShares: ONE_REP_MAX_SHARES,
    });

    expect(() =>
      builder.build(
        generatePrescribedLifts(["25"]),
        generateExercisesBlock(["25"], "MAX"),
        generateStrengthTestInput(),
      ),
    ).toThrow("MAX: the strengthTest builder needs testSets");
  });
});
