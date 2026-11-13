import * as v from "valibot";

import TEST from "../../../../assets/data/templates/TEST.json";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { TemplateSchema } from "@/schemas/aiwl.schema";
import { generateMaxValues } from "@test/factories/maxValues";
import { generateSeededRandom } from "@test/factories/seededRandom";
import {
  describeSetListEntries,
  listTrainedExercises,
} from "@test/factories/setListDescription";
import { generateStrengthTestInput } from "@test/factories/strengthTestInput";
import { generateStrengthTestTemplate } from "@test/factories/strengthTestTemplate";
import {
  generateRegionWarmUpTree,
  generateStrengthTestWarmUpBlock,
} from "@test/factories/strengthTestWarmUp";
import {
  generateAuthoredTestSets,
  generateOneRepMaxShares,
  generateTestSetLoads,
} from "@test/factories/testSets";
import { catchThrownValue } from "@test/factories/thrownValue";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import {
  generateStrengthTest,
  loadStrengthTestLoadData,
} from "./strengthTestGeneration";

const LEVELS = ["BEGINNER", "ADVANCED", "PROFESSIONAL"] as const;
const GENDERS = ["MALE", "FEMALE"] as const;
const LEVEL_GENDER_CASES = LEVELS.flatMap((level) =>
  GENDERS.map((gender) => ({ level, gender })),
);
const BUNDLED_LIFT_IDS = ["25", "50", "342", "297", "54"];
const SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);

// Pauses carry branch -1.
const listWarmUpBranchIds = (setList: GeneratedSetListEntry[]): string[] =>
  setList
    .filter((entry) => entry.skill === "WU" && entry.branchId !== "-1")
    .map((entry) => entry.branchId);

describe("strengthTestGeneration: generateStrengthTest", () => {
  const skillTrees = getAllSkillTrees();

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("source checks", () => {
    it("throws NO_EXERCISES SKILL_TREE and returns no lifts when the warm up draws no exercise", () => {
      const input = generateStrengthTestInput();

      expect(catchThrownValue(() => generateStrengthTest(input, {}))).toEqual({
        type: "NO_EXERCISES",
        subtype: "SKILL_TREE",
        params: ["WU"],
      });
    });

    it("throws the anamnesis error for an athlete without workout data", () => {
      const input = generateStrengthTestInput({ withoutWorkoutData: true });

      expect(
        catchThrownValue(() => generateStrengthTest(input, skillTrees)),
      ).toEqual({
        type: "NO_ANAMNESIS",
        subtype: "MISSING_WORKOUT_DATA",
        params: [],
      });
    });

    it("throws the template error for a template without a lifts block", () => {
      const template = generateStrengthTestTemplate({
        blocks: [generateStrengthTestWarmUpBlock()],
      });
      const input = generateStrengthTestInput({
        random: generateSeededRandom(7),
      });

      expect(() =>
        generateStrengthTest(
          input,
          skillTrees,
          loadStrengthTestLoadData(),
          template,
        ),
      ).toThrow(
        "TEST.blocks[1]: the strength test needs an exercises block of lifts after the warm-up",
      );
    });

    it("throws the template error for a lift without test set loads", () => {
      const template = generateStrengthTestTemplate({ exercises: ["25"] });
      const strengthTest = { ...loadStrengthTestLoadData(), testSetLoads: {} };
      const input = generateStrengthTestInput({
        random: generateSeededRandom(7),
      });

      expect(() =>
        generateStrengthTest(input, skillTrees, strengthTest, template),
      ).toThrow(
        "TEST.blocks[1].exercises: lift 25 has no test set loads for both genders",
      );
    });

    it("throws the template error before the AGE error for an athlete under 16", () => {
      const template = generateStrengthTestTemplate({
        blocks: [generateStrengthTestWarmUpBlock()],
      });
      const input = generateStrengthTestInput({ birthday: "2010-10-25" });

      expect(() =>
        generateStrengthTest(
          input,
          skillTrees,
          loadStrengthTestLoadData(),
          template,
        ),
      ).toThrow(
        "TEST.blocks[1]: the strength test needs an exercises block of lifts after the warm-up",
      );
    });

    it("throws NO_EXERCISES AGE for an athlete under 16", () => {
      const input = generateStrengthTestInput({ birthday: "2010-10-25" });

      expect(
        catchThrownValue(() => generateStrengthTest(input, skillTrees)),
      ).toEqual({ type: "NO_EXERCISES", subtype: "AGE", params: [] });
    });

    it("generates the test for an athlete who turned 16 yesterday", () => {
      const input = generateStrengthTestInput({
        birthday: "2010-10-23",
        random: generateSeededRandom(7),
      });

      expect(
        listTrainedExercises(generateStrengthTest(input, skillTrees)),
      ).toContain("25");
    });

    it("throws TOO_MUCH_SORENESS for any current muscle soreness", () => {
      const input = generateStrengthTestInput({ soreMuscles: ["CHEST"] });

      expect(
        catchThrownValue(() => generateStrengthTest(input, skillTrees)),
      ).toEqual({
        type: "TOO_MUCH_SORENESS",
        subtype: "TEST_WORKOUT",
        params: [],
      });
    });
  });

  describe("lifts", () => {
    it.each(LEVEL_GENDER_CASES)(
      "tests the lifts of the template in its order for $level $gender",
      ({ level, gender }) => {
        const input = generateStrengthTestInput({
          level,
          gender,
          random: generateSeededRandom(7),
        });
        const template = generateStrengthTestTemplate({
          exercises: ["54", "25"],
        });

        const setList = generateStrengthTest(
          input,
          skillTrees,
          loadStrengthTestLoadData(),
          template,
        );

        expect([
          ...new Set(
            listTrainedExercises(
              setList.filter((entry) => entry.skill === "TEST"),
            ),
          ),
        ]).toEqual(["54", "25"]);
      },
    );

    it("tests the lifts of the bundled template when the source passes none", () => {
      const input = generateStrengthTestInput({
        random: generateSeededRandom(7),
      });

      const setList = generateStrengthTest(input, skillTrees);

      expect([
        ...new Set(
          listTrainedExercises(
            setList.filter((entry) => entry.skill === "TEST"),
          ),
        ),
      ]).toEqual(BUNDLED_LIFT_IDS);
    });

    it("tests the same lifts for an athlete with branch levels", () => {
      const input = generateStrengthTestInput({
        level: "ADVANCED",
        branchLevels: { "25": 3, "50": 2, "54": 4, "410": 2, "399": 1 },
        random: generateSeededRandom(7),
      });

      const setList = generateStrengthTest(input, skillTrees);

      expect([
        ...new Set(
          listTrainedExercises(
            setList.filter((entry) => entry.skill === "TEST"),
          ),
        ),
      ]).toEqual(BUNDLED_LIFT_IDS);
    });

    it("keeps every bundled lift for a place without the lift equipment", () => {
      const input = generateStrengthTestInput({
        equipment: [],
        random: generateSeededRandom(7),
      });

      const setList = generateStrengthTest(input, skillTrees);

      expect([
        ...new Set(
          listTrainedExercises(
            setList.filter((entry) => entry.skill === "TEST"),
          ),
        ),
      ]).toEqual(BUNDLED_LIFT_IDS);
    });

    it("throws a template error for a template lift that is not in the catalog", () => {
      const template = generateStrengthTestTemplate({
        exercises: ["25", "99999999"],
      });
      const input = generateStrengthTestInput({
        level: "ADVANCED",
        random: generateSeededRandom(7),
      });
      // Loads for the unknown lift pass the template check, so the catalog
      // lookup of the exercises handler decides.
      const strengthTest = {
        ...loadStrengthTestLoadData(),
        testSetLoads: generateTestSetLoads({
          "99999999": generateTestSetLoads()["25"],
        }),
      };

      expect(() =>
        generateStrengthTest(input, skillTrees, strengthTest, template),
      ).toThrow("TEST.blocks[1]: exercise 99999999 is no catalog exercise");
    });
  });

  describe("test sets", () => {
    it("builds the test sets and rests of the template", () => {
      const input = generateStrengthTestInput({
        random: generateSeededRandom(7),
      });
      const template = generateStrengthTestTemplate({
        exercises: ["25"],
        testSets: generateAuthoredTestSets(),
      });

      const setList = generateStrengthTest(
        input,
        skillTrees,
        loadStrengthTestLoadData(),
        template,
      );

      expect(
        describeSetListEntries(
          setList.filter((entry) => entry.skill === "TEST"),
        ),
      ).toEqual(["25 1/2", "pause 45", "25 2/2"]);
    });

    it("builds the repetitions of the template with -1 for amrap", () => {
      const input = generateStrengthTestInput({
        random: generateSeededRandom(7),
      });
      const template = generateStrengthTestTemplate({
        exercises: ["25"],
        testSets: generateAuthoredTestSets(),
      });

      const setList = generateStrengthTest(
        input,
        skillTrees,
        loadStrengthTestLoadData(),
        template,
      );

      expect(
        setList
          .filter((entry) => entry.skill === "TEST")
          .filter((entry) => entry.repetition !== undefined)
          .map((entry) => entry.repetition),
      ).toEqual([8, -1]);
    });

    it("loads the test sets with the 1RM shares of the strength test data", () => {
      const input = generateStrengthTestInput({
        level: "BEGINNER",
        maxValues: generateMaxValues({ kneeDominant: 100 }),
        random: generateSeededRandom(7),
      });
      const strengthTest = {
        ...loadStrengthTestLoadData(),
        oneRepMaxShares: generateOneRepMaxShares({ beginner: 0.5 }),
      };
      const template = generateStrengthTestTemplate({
        exercises: ["25"],
        testSets: generateAuthoredTestSets(),
      });

      const setList = generateStrengthTest(
        input,
        skillTrees,
        strengthTest,
        template,
      );

      expect(
        setList
          .filter((entry) => entry.skill === "TEST")
          .filter((entry) => entry.repetition !== undefined)
          .map((entry) => entry.weight),
      ).toEqual([25, 50]);
    });
  });

  describe("warm up", () => {
    const bundledTemplate = v.parse(TemplateSchema, TEST);

    it("draws the same warm up for an athlete with knee and shoulder pain and no equipment as for one without, for every seed", () => {
      // drawWarmUps({ pains: ["KNEE_LEFT"] }) → [["410", "411", ...], ...], one list per seed
      const drawWarmUps = (
        options: Parameters<typeof generateStrengthTestInput>[0],
      ) =>
        SEEDS.map((seed) =>
          listWarmUpBranchIds(
            generateStrengthTest(
              generateStrengthTestInput({
                ...options,
                random: generateSeededRandom(seed),
              }),
              skillTrees,
            ),
          ),
        );

      expect(
        drawWarmUps({ pains: ["KNEE_LEFT", "SHOULDER_LEFT"], equipment: [] }),
      ).toEqual(drawWarmUps({}));
    });

    it("fills the warm up when knee pain blocks every warm up branch", () => {
      const input = generateStrengthTestInput({
        pains: ["KNEE_LEFT"],
        random: generateSeededRandom(7),
      });

      const setList = generateStrengthTest(
        input,
        { WU: generateRegionWarmUpTree(["BLOCK_KNEE"]) },
        loadStrengthTestLoadData(),
        bundledTemplate,
      );

      expect(listWarmUpBranchIds(setList)).toHaveLength(5);
    });

    it("fills the warm up when every warm up branch needs equipment the place lacks", () => {
      const input = generateStrengthTestInput({
        random: generateSeededRandom(7),
      });

      const setList = generateStrengthTest(
        input,
        { WU: generateRegionWarmUpTree(["EQ_DUMBBELL"]) },
        loadStrengthTestLoadData(),
        bundledTemplate,
      );

      expect(listWarmUpBranchIds(setList)).toHaveLength(5);
    });

    it("draws one exercise per quota slot from one sided branches", () => {
      const warmUpTree = generateRegionWarmUpTree(["SIDE_ONE"]);

      const setList = generateStrengthTest(
        generateStrengthTestInput({ random: generateSeededRandom(7) }),
        { WU: warmUpTree },
        loadStrengthTestLoadData(),
        bundledTemplate,
      );

      expect(listWarmUpBranchIds(setList)).toHaveLength(5);
    });

    it("draws any unused branch for a region quota without a matching branch", () => {
      const { upper: _upper, ...warmUpTree } = generateRegionWarmUpTree();

      const setList = generateStrengthTest(
        generateStrengthTestInput({ random: generateSeededRandom(7) }),
        { WU: warmUpTree },
        loadStrengthTestLoadData(),
        bundledTemplate,
      );

      expect(listWarmUpBranchIds(setList)).toEqual([
        "lower",
        "full",
        expect.stringMatching(/^core/),
        expect.stringMatching(/^core/),
        expect.stringMatching(/^core/),
      ]);
    });

    it("trains the warm up one exercise at a time in draw order", () => {
      const setList = generateStrengthTest(
        generateStrengthTestInput({ random: generateSeededRandom(7) }),
        { WU: generateRegionWarmUpTree() },
        loadStrengthTestLoadData(),
        bundledTemplate,
      );

      expect(
        describeSetListEntries(
          setList.filter((entry) => entry.skill === "WU"),
        ).slice(0, 6),
      ).toEqual([
        "432 1/1",
        "pause 10",
        "493 1/1",
        "pause 10",
        "1112 1/1",
        "pause 10",
      ]);
    });

    it("times every warm up exercise as one 60 second set with 10 second rests and 30 seconds before the lifts", () => {
      const setList = generateStrengthTest(
        generateStrengthTestInput({ random: generateSeededRandom(5) }),
        skillTrees,
      );

      expect(
        setList
          .filter((entry) => entry.skill === "WU")
          .map(({ exerciseId, set, duration }) =>
            exerciseId === "999999"
              ? `pause ${duration}`
              : `${set.join("/")} ${duration}`,
          ),
      ).toEqual([
        "1/1 60",
        "pause 10",
        "1/1 60",
        "pause 10",
        "1/1 60",
        "pause 10",
        "1/1 60",
        "pause 10",
        "1/1 60",
        "pause 30",
      ]);
    });

    it("times the warm up by the template", () => {
      const template = generateStrengthTestTemplate({
        warmUp: {
          setDuration: 30,
          rest: {
            withinSuperset: 7,
            betweenSets: 7,
            afterExercise: 7,
            afterBlock: 20,
          },
        },
      });

      const setList = generateStrengthTest(
        generateStrengthTestInput({ random: generateSeededRandom(5) }),
        skillTrees,
        loadStrengthTestLoadData(),
        template,
      );

      expect(
        setList
          .filter((entry) => entry.skill === "WU")
          .map(({ exerciseId, set, duration }) =>
            exerciseId === "999999"
              ? `pause ${duration}`
              : `${set.join("/")} ${duration}`,
          ),
      ).toEqual([
        "1/1 30",
        "pause 7",
        "1/1 30",
        "pause 7",
        "1/1 30",
        "pause 7",
        "1/1 30",
        "pause 7",
        "1/1 30",
        "pause 20",
      ]);
    });
  });

  describe("bundled strength test for an athlete with knee pain", () => {
    const describeTestSets = (setList: GeneratedSetListEntry[]) =>
      setList
        .filter((entry) => entry.skill === "TEST")
        .map(({ exerciseId, set, repetition, weight, duration }) => ({
          exerciseId,
          set,
          repetition,
          weight,
          duration,
        }));

    it("draws the same warm up with knee pain as without and keeps the four test sets of each lift", () => {
      const kneeInput = generateStrengthTestInput({
        level: "ADVANCED",
        gender: "FEMALE",
        pains: ["KNEE_LEFT"],
        random: generateSeededRandom(3),
      });
      const painFreeInput = generateStrengthTestInput({
        level: "ADVANCED",
        gender: "FEMALE",
        random: generateSeededRandom(3),
      });

      const setList = generateStrengthTest(kneeInput, skillTrees);

      const warmUpIds = listWarmUpBranchIds(setList);
      expect(warmUpIds).toHaveLength(5);
      expect(warmUpIds).toEqual(
        listWarmUpBranchIds(generateStrengthTest(painFreeInput, skillTrees)),
      );
      expect(
        setList
          .filter((entry) => entry.skill === "WU" && entry.branchId !== "-1")
          .map((entry) => entry.set.join("/")),
      ).toEqual(["1/1", "1/1", "1/1", "1/1", "1/1"]);
      const testSets = describeTestSets(setList).filter(
        (entry) => entry.repetition !== undefined,
      );
      expect(
        testSets.map(({ exerciseId, repetition }) => [exerciseId, repetition]),
      ).toEqual(
        BUNDLED_LIFT_IDS.flatMap((exerciseId) =>
          [6, 4, 2, -1].map((repetition) => [exerciseId, repetition]),
        ),
      );
      expect(describeTestSets(setList)).toEqual(
        describeTestSets(generateStrengthTest(painFreeInput, skillTrees)),
      );
    });
  });

  // Pins the bundled strength test, exercises and skill trees: a data change
  // fails this case without a logic regression.
  describe("bundled strength test", () => {
    it("generates the pinned set list for an advanced man with seed 7", () => {
      const input = generateStrengthTestInput({
        level: "ADVANCED",
        gender: "MALE",
        random: generateSeededRandom(7),
      });

      const setList = generateStrengthTest(input, skillTrees);

      expect(describeSetListEntries(setList)).toEqual([
        "432 1/1",
        "pause 10",
        "493 1/1",
        "pause 10",
        "1112 1/1",
        "pause 10",
        "421 1/1",
        "pause 10",
        "400 1/1",
        "pause 30",
        "25 1/4",
        "pause 60",
        "25 2/4",
        "pause 60",
        "25 3/4",
        "pause 120",
        "25 4/4",
        "pause 180",
        "50 1/4",
        "pause 60",
        "50 2/4",
        "pause 60",
        "50 3/4",
        "pause 120",
        "50 4/4",
        "pause 180",
        "342 1/4",
        "pause 60",
        "342 2/4",
        "pause 60",
        "342 3/4",
        "pause 120",
        "342 4/4",
        "pause 180",
        "297 1/4",
        "pause 60",
        "297 2/4",
        "pause 60",
        "297 3/4",
        "pause 120",
        "297 4/4",
        "pause 180",
        "54 1/4",
        "pause 60",
        "54 2/4",
        "pause 60",
        "54 3/4",
        "pause 120",
        "54 4/4",
      ]);
    });

    it("generates the lifts and test sets of TEST.json parsed as an AIWL template", () => {
      const template = v.parse(TemplateSchema, TEST);
      const input = generateStrengthTestInput({
        random: generateSeededRandom(7),
      });

      const testEntries = generateStrengthTest(
        input,
        skillTrees,
        loadStrengthTestLoadData(),
        template,
      ).filter(
        (entry) => entry.skill === "TEST" && entry.repetition !== undefined,
      );

      expect(
        testEntries.map((entry) => [entry.exerciseId, entry.repetition]),
      ).toEqual(
        BUNDLED_LIFT_IDS.flatMap((exerciseId) =>
          [6, 4, 2, -1].map((repetition) => [exerciseId, repetition]),
        ),
      );
    });

    it("pins the warm up branches and the authored test set loads for an advanced man with seed 7", () => {
      const input = generateStrengthTestInput({
        level: "ADVANCED",
        gender: "MALE",
        random: generateSeededRandom(7),
      });

      const setList = generateStrengthTest(input, skillTrees);

      expect({
        warmUpBranches: setList
          .filter((entry) => entry.skill === "WU" && entry.branchId !== "-1")
          .map((entry) => entry.branchId),
        testWeights: setList
          .filter((entry) => entry.skill === "TEST" && entry.branchId === "-1")
          .filter((entry) => entry.repetition !== undefined)
          .map((entry) => [entry.exerciseId, entry.weight]),
      }).toEqual({
        warmUpBranches: ["410", "411", "1026", "427", "421"],
        testWeights: [
          ["25", 25],
          ["25", 35],
          ["25", 50],
          ["25", 60],
          ["50", 25],
          ["50", 35],
          ["50", 50],
          ["50", 60],
          ["342", 20],
          ["342", 30],
          ["342", 42.5],
          ["342", 50],
          ["297", 17.5],
          ["297", 27.5],
          ["297", 37.5],
          ["297", 45],
          ["54", 12.5],
          ["54", 17.5],
          ["54", 25],
          ["54", 30],
        ],
      });
    });
  });
});
