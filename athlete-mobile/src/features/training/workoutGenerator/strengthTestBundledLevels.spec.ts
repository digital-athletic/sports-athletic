import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { generateMaxValues } from "@test/factories/maxValues";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { generateStrengthTestInput } from "@test/factories/strengthTestInput";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { roundWeight } from "./exerciseValues/weightRounding";
import { generateStrengthTest } from "./strengthTestGeneration";

const LEVELS = ["BEGINNER", "ADVANCED", "PROFESSIONAL"] as const;
const GENDERS = ["MALE", "FEMALE"] as const;
const LEVEL_GENDER_CASES = LEVELS.flatMap((level) =>
  GENDERS.map((gender) => ({ level, gender })),
);
const BUNDLED_LIFT_IDS = ["25", "50", "342", "297", "54"];
const SQUAT_ID = "25";
const SETS_PER_LIFT = 4;
const BARBELL = { tags: ["EQ_BARBELL"] };

// The strength test keeps its ramp up loads below the empty bar.
const roundBarbellLoad = (load: number): number =>
  roundWeight(load, BARBELL, { emptyBarMinimum: false });

const skillTrees = getAllSkillTrees();

const generateBundledTest = (
  options: Parameters<typeof generateStrengthTestInput>[0] = {},
): GeneratedSetListEntry[] =>
  generateStrengthTest(
    generateStrengthTestInput({ random: generateSeededRandom(7), ...options }),
    skillTrees,
  );

const listTestSets = (setList: GeneratedSetListEntry[]) =>
  setList.filter(
    (entry) => entry.skill === "TEST" && !isPauseExercise(entry.exerciseId),
  );

const listLiftSets = (setList: GeneratedSetListEntry[], exerciseId: string) =>
  listTestSets(setList).filter((entry) => entry.exerciseId === exerciseId);

describe("strengthTestBundledLevels: bundled lifts per level and gender", () => {
  it.each(LEVEL_GENDER_CASES)(
    "tests the five bundled lifts with 4 sets each for $level $gender",
    ({ level, gender }) => {
      const testSets = listTestSets(generateBundledTest({ level, gender }));

      expect({
        exerciseIds: [...new Set(testSets.map((entry) => entry.exerciseId))],
        totalSets: testSets.length,
      }).toEqual({
        exerciseIds: BUNDLED_LIFT_IDS,
        totalSets: BUNDLED_LIFT_IDS.length * SETS_PER_LIFT,
      });
    },
  );

  it.each(LEVEL_GENDER_CASES)(
    "numbers the sets 1 to 4 with 6, 4, 2 and amrap repetitions for $level $gender",
    ({ level, gender }) => {
      const setList = generateBundledTest({ level, gender });

      BUNDLED_LIFT_IDS.forEach((exerciseId) => {
        expect(
          listLiftSets(setList, exerciseId).map(({ set, repetition }) => ({
            set,
            repetition,
          })),
        ).toEqual([
          { set: [1, SETS_PER_LIFT], repetition: 6 },
          { set: [2, SETS_PER_LIFT], repetition: 4 },
          { set: [3, SETS_PER_LIFT], repetition: 2 },
          { set: [4, SETS_PER_LIFT], repetition: -1 },
        ]);
      });
    },
  );

  it.each(LEVEL_GENDER_CASES)(
    "raises the weight across the sets of every lift for $level $gender",
    ({ level, gender }) => {
      const setList = generateBundledTest({ level, gender });

      BUNDLED_LIFT_IDS.forEach((exerciseId) => {
        const weights = listLiftSets(setList, exerciseId).map(
          (entry) => entry.weight ?? 0,
        );

        expect(weights[0]).toBeLessThan(weights[1]);
        expect(weights[1]).toBeLessThanOrEqual(weights[2]);
        expect(weights[2]).toBeLessThanOrEqual(weights[3]);
      });
    },
  );
});

describe("strengthTestBundledLevels: loads", () => {
  it("loads every test set with a weight above 0 without tested 1RMs", () => {
    const testSets = listTestSets(
      generateBundledTest({
        level: "BEGINNER",
        maxValues: generateMaxValues(),
      }),
    );

    expect(testSets.every((entry) => (entry.weight ?? 0) > 0)).toBe(true);
  });

  it.each([
    ["BEGINNER", 0.75],
    ["ADVANCED", 0.8],
    ["PROFESSIONAL", 0.85],
  ] as const)(
    "%s: loads the test set with %p of the 1RM and the ramp up sets with 40, 60 and 85 percent of that load",
    (level, share) => {
      const maxKneeValue = 100;

      const squatSets = listLiftSets(
        generateBundledTest({
          level,
          maxValues: generateMaxValues({ kneeDominant: maxKneeValue }),
        }),
        SQUAT_ID,
      );

      const testWeight = roundBarbellLoad(maxKneeValue * share);
      expect(squatSets.map((entry) => entry.weight)).toEqual([
        roundBarbellLoad(testWeight * 0.4),
        roundBarbellLoad(testWeight * 0.6),
        roundBarbellLoad(testWeight * 0.85),
        testWeight,
      ]);
    },
  );

  it("derives the ramp up loads from the rounded test set load with barbell rounding", () => {
    const squatSets = listLiftSets(
      generateBundledTest({
        level: "BEGINNER",
        maxValues: generateMaxValues({ kneeDominant: 41.3 }),
      }),
      SQUAT_ID,
    );

    // 75% of 41.3 kg is 30.975 kg, rounded to a 30 kg test set load; the
    // strength test keeps ramp-up loads below the empty bar
    expect(squatSets.map((entry) => entry.weight)).toEqual([
      12.5, 17.5, 25, 30,
    ]);
  });
});

describe("strengthTestBundledLevels: edge cases", () => {
  it("tests the bundled lifts of a BEGINNER for an athlete without a level tag", () => {
    const input = generateStrengthTestInput({
      random: generateSeededRandom(7),
    });
    const withoutLevel = {
      ...input,
      athlete: { ...input.athlete, workoutData: { tags: {} } },
    };

    const testSets = listTestSets(
      generateStrengthTest(withoutLevel, skillTrees),
    );

    expect([...new Set(testSets.map((entry) => entry.exerciseId))]).toEqual(
      BUNDLED_LIFT_IDS,
    );
  });

  it("gives every entry the skill WU or TEST", () => {
    const setList = generateBundledTest();

    expect([...new Set(setList.map((entry) => entry.skill))].sort()).toEqual([
      "TEST",
      "WU",
    ]);
  });

  it("ends the set list on a lift and not on a pause", () => {
    const setList = generateBundledTest();

    expect(isPauseExercise(setList[setList.length - 1].exerciseId)).toBe(false);
  });

  it("starts the set list with the warm-up and ends the warm-up on a 30 second transition pause", () => {
    const setList = generateBundledTest();
    const warmUp = setList.filter((entry) => entry.skill === "WU");

    expect({
      firstEntrySkill: setList[0].skill,
      lastWarmUpDuration: warmUp[warmUp.length - 1].duration,
      lastWarmUpIsPause: isPauseExercise(warmUp[warmUp.length - 1].exerciseId),
      firstTestIndex: setList.findIndex((entry) => entry.skill === "TEST"),
      warmUpLength: warmUp.length,
    }).toEqual({
      firstEntrySkill: "WU",
      lastWarmUpDuration: 30,
      lastWarmUpIsPause: true,
      firstTestIndex: warmUp.length,
      warmUpLength: warmUp.length,
    });
  });
});
