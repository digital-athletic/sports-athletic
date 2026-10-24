import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { LevelTag } from "@/constants/workoutConstants";
import type { SkillCode } from "@/schemas/generator.schema";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { generateSequenceRandom } from "../../../../test/factories/sequenceRandom";
import { findCatalogExerciseById } from "../../../../test/factories/valueExercise";
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

const sumDurations = (setList: GeneratedSetListEntry[]) =>
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
    expect(sumDurations(setList)).toBe(minutes * 60);
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
    expect(sumDurations(setList)).toBe(570);
  });

  it("runs only the intervals that fit and adds no warm-up without time left", () => {
    const setList = buildCardio("CARDIO_3", 3);

    expect(describeCardio(setList)).toEqual([
      `${ZONE_TWO_RUN} 120`,
      `${ZONE_FIVE_RUN} 60`,
    ]);
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
