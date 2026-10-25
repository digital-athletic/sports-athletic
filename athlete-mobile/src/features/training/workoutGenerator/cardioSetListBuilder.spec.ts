import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { LevelTag } from "@/constants/workoutConstants";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { BlockValues } from "@/schemas/aiwl.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import {
  findCatalogExerciseById,
  generateAuthoredValues,
} from "@test/factories/valueExercise";
import { buildBranchLookupIndex } from "./branchLookupIndex";
import {
  buildCardioSetList,
  drawCardioExercisePair,
} from "./cardioSetListBuilder";
import type { GenerationInput } from "./generationInput";

const ZONE_TWO_RUN = "42";
const SPRINT_RUN = "40";
// The first exercises of the zone 4 and zone 5 skill trees.
const ZONE_FOUR_RUN = "38";
const ZONE_FIVE_RUN = "39";

interface CardioOptions {
  exerciseId?: string;
  level?: LevelTag;
  soreMuscles?: string[];
  setDuration?: number;
  values?: BlockValues;
  input?: GenerationInput;
}

/**
 * Builds a cardio block of the given minutes from one branch with the given
 * exercise, for an adult man at fitness level ADVANCED by default.
 *
 * buildCardio("CARDIO_2", 3)
 * → [{ exerciseId: "38", duration: 60 }, { exerciseId: "42", set: [1, 1], duration: 60 },
 *    { exerciseId: "39", set: [1, 1], duration: 60 }] (other fields left out)
 */
const buildCardio = (
  skill: SkillCode,
  minutes: number,
  {
    exerciseId = ZONE_TWO_RUN,
    level,
    soreMuscles,
    setDuration,
    values,
    input,
  }: CardioOptions = {},
): GeneratedSetListEntry[] =>
  buildCardioSetList(
    [{ first: { branchId: "b1", branchTags: [], exerciseId } }],
    {
      skill,
      minutes,
      sets: 1,
      rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
      setDuration,
      values,
    },
    input ??
      generateRuleFamilyInput({
        level,
        soreMuscles,
        exerciseCatalog: [findCatalogExerciseById(exerciseId)],
      }),
  );

/**
 * Lists each entry as "<exercise> <seconds>".
 *
 * describeCardio([run 38 for 120 s, run 42 for 60 s]) → ["38 120", "42 60"]
 */
const describeCardio = (setList: GeneratedSetListEntry[]): string[] =>
  setList.map((entry) => `${entry.exerciseId} ${entry.duration}`);

/**
 * Adds up the seconds of every entry.
 *
 * sumSetListDurations([run 38 for 120 s, run 42 for 60 s]) → 180
 */
const sumSetListDurations = (setList: GeneratedSetListEntry[]) =>
  setList.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);

describe("cardioSetListBuilder: interval zones", () => {
  it("writes a warm-up, the work intervals and their running pauses", () => {
    expect(buildCardio("CARDIO_2", 3)).toEqual([
      {
        branchId: "-1",
        exerciseId: ZONE_FOUR_RUN,
        set: [1, 1],
        skill: "CARDIO_2",
        duration: 60,
      },
      {
        branchId: "b1",
        exerciseId: ZONE_TWO_RUN,
        set: [1, 1],
        skill: "CARDIO_2",
        duration: 60,
      },
      {
        branchId: "-1",
        exerciseId: ZONE_FIVE_RUN,
        set: [1, 1],
        skill: "CARDIO_2",
        duration: 60,
      },
    ]);
  });

  it.each([
    ["CARDIO_3", 120, 60],
    ["CARDIO_2", 60, 60],
    ["CARDIO_1_LAKTAT", 30, 240],
    ["CARDIO_1_SHORT", 10, 80],
  ] as const)(
    "runs %s intervals of %i s with %i s running pauses",
    (skill, work, runningPause) => {
      const setList = buildCardio(skill, 30);

      expect(describeCardio(setList.slice(1, 3))).toEqual([
        `${ZONE_TWO_RUN} ${work}`,
        `${ZONE_FIVE_RUN} ${runningPause}`,
      ]);
    },
  );

  it("uses the authored start count and ignores stored cardio values", () => {
    const base = generateRuleFamilyInput({
      exerciseCatalog: [findCatalogExerciseById(ZONE_TWO_RUN)],
    });
    const input: GenerationInput = {
      ...base,
      exerciseData: {
        exerciseData: {
          [ZONE_TWO_RUN]: {
            exerciseId: ZONE_TWO_RUN,
            skill: "CARDIO_2",
            repetition: 9,
            feedback: { difficulty: "TOO_EASY" },
          },
        },
        branchData: {},
      },
    };

    const setList = buildCardio("CARDIO_2", 30, { input });

    expect(setList[1].set).toEqual([1, 4]);
  });

  it("runs the zone's start count of 3 intervals for a timed block", () => {
    const setList = buildCardio("CARDIO_2", 30, { setDuration: 45 });

    expect(setList[1].set).toEqual([1, 3]);
  });
});

describe("cardioSetListBuilder: zone 4 warm-up and filler", () => {
  // 4 intervals of 60 s with 60 s running pauses take 8 minutes.
  it.each([
    [10, "shortens the warm-up to the 2 minutes left", ["38 120"]],
    [13, "uses exactly 5 minutes left as warm-up", ["38 300"]],
    [14, "adds a filler of exactly one minute", ["38 300", "38 60"]],
  ] as const)("in %i zone 2 minutes %s", (minutes, _label, zoneFourRuns) => {
    const setList = buildCardio("CARDIO_2", minutes);

    expect(setList.filter((entry) => entry.branchId === "b1")).toHaveLength(4);
    expect(
      describeCardio(
        setList.filter((entry) => entry.exerciseId === ZONE_FOUR_RUN),
      ),
    ).toEqual(zoneFourRuns);
    expect(sumSetListDurations(setList)).toBe(minutes * 60);
  });

  it("discards a filler below one minute", () => {
    const setList = buildCardio("CARDIO_1_SHORT", 10, {
      exerciseId: SPRINT_RUN,
      level: "BEGINNER",
    });

    expect(setList.filter((entry) => entry.branchId === "b1")).toHaveLength(3);
    expect(
      describeCardio(
        setList.filter((entry) => entry.exerciseId === ZONE_FOUR_RUN),
      ),
    ).toEqual(["38 300"]);
    expect(sumSetListDurations(setList)).toBe(570);
  });

  it("runs only the intervals that fit and adds no warm-up without time left", () => {
    const setList = buildCardio("CARDIO_3", 3);

    expect(describeCardio(setList)).toEqual([
      `${ZONE_TWO_RUN} 120`,
      `${ZONE_FIVE_RUN} 60`,
    ]);
  });
});

describe("cardioSetListBuilder: counts that are no whole number", () => {
  it("runs a count of 2.5 as 3 intervals of 2.5, as the old builder's loop", () => {
    const run = findCatalogExerciseById(ZONE_TWO_RUN);
    const input = generateRuleFamilyInput({
      exerciseCatalog: [
        {
          ...run,
          values: {
            ...run.values,
            repetition: generateAuthoredValues("2.5", "5"),
          },
        },
      ],
    });

    const setList = buildCardio("CARDIO_2", 30, { input, values: "exercise" });

    expect(
      setList
        .filter((entry) => entry.branchId === "b1")
        .map((entry) => entry.set),
    ).toEqual([
      [1, 2.5],
      [2, 2.5],
      [3, 2.5],
    ]);
    expect(describeCardio([setList[0], setList[setList.length - 1]])).toEqual([
      "38 300",
      "38 1140",
    ]);
  });

  it("builds nothing for a minute budget that is not a number", () => {
    expect(buildCardio("CARDIO_2", Number.NaN)).toEqual([]);
  });
});

describe("cardioSetListBuilder: zone trees", () => {
  it("throws for a zone tree without a first exercise", () => {
    const skillTrees = getAllSkillTrees();
    const [branchId, branch] = Object.entries(skillTrees.CARDIO_5)[0];
    const input: GenerationInput = {
      ...generateRuleFamilyInput({
        exerciseCatalog: [findCatalogExerciseById(ZONE_TWO_RUN)],
      }),
      branchLookupIndex: buildBranchLookupIndex({
        CARDIO_4: skillTrees.CARDIO_4,
        CARDIO_5: { [branchId]: { ...branch, levels: {} } },
      }),
    };

    expect(() => buildCardio("CARDIO_2", 30, { input })).toThrow(
      "Skill tree CARDIO_5 has no first exercise",
    );
  });
});

describe("cardioSetListBuilder: steady zones", () => {
  it.each([
    ["CARDIO_4", [], 1800],
    ["CARDIO_5", [], 1800],
    ["CARDIO_4", ["QUADRICEPS"], 1200],
    ["CARDIO_5", ["CHEST"], 1800],
  ] as const)(
    "runs %s with soreness %j for %i s",
    (skill, soreMuscles, duration) => {
      expect(buildCardio(skill, 30, { soreMuscles: [...soreMuscles] })).toEqual(
        [
          {
            branchId: "b1",
            exerciseId: ZONE_TWO_RUN,
            set: [1, 1],
            skill,
            duration,
          },
        ],
      );
    },
  );
});

describe("cardioSetListBuilder: nothing to build", () => {
  it("builds nothing for an interval exercise missing from the catalog", () => {
    expect(
      buildCardio("CARDIO_2", 30, {
        input: generateRuleFamilyInput({ exerciseCatalog: [] }),
      }),
    ).toEqual([]);
  });

  it("builds nothing for a cardio skill without branches", () => {
    const pairs = drawCardioExercisePair([], generateSequenceRandom([0]));

    expect(
      buildCardioSetList(
        pairs,
        {
          skill: "CARDIO_2",
          minutes: 30,
          sets: 1,
          rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
        },
        generateRuleFamilyInput(),
      ),
    ).toEqual([]);
  });

  it("builds nothing without pairs", () => {
    expect(
      buildCardioSetList(
        [],
        {
          skill: "CARDIO_4",
          minutes: 30,
          sets: 1,
          rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
        },
        generateRuleFamilyInput(),
      ),
    ).toEqual([]);
  });
});

describe("cardioSetListBuilder: drawCardioExercisePair", () => {
  /**
   * Fakes a cardio branch reference with the exercise ID `e<id>`.
   *
   * generateCardioReference("run") → { branchId: "run", exerciseId: "erun", branchTags: [] }
   */
  const generateCardioReference = (id: string): BranchExerciseReference => ({
    branchId: id,
    exerciseId: `e${id}`,
    branchTags: [],
  });

  it.each([
    [0, "run"],
    [0.6, "bike"],
  ])("draws at %f the %s branch with one draw", (draw, branchId) => {
    const random = jest.fn(generateSequenceRandom([draw]));

    const pairs = drawCardioExercisePair(
      [generateCardioReference("run"), generateCardioReference("bike")],
      random,
    );

    expect(pairs.map((pair) => pair.first.branchId)).toEqual([branchId]);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it("draws once and returns no pair without branches", () => {
    const random = jest.fn(generateSequenceRandom([0]));

    expect(drawCardioExercisePair([], random)).toEqual([]);
    expect(random).toHaveBeenCalledTimes(1);
  });
});
