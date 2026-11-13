import { loadExercises } from "@/data/loadExercises";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { generateGenerationInput } from "@test/factories/generationInput";
import {
  generateBottleBranch,
  generateKneePreventionBranches,
  generatePreventionBranch,
  importTree,
  importTrees,
  PAUSE_ID,
} from "@test/factories/planWorkout";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateTrainingDayFromStoredDay } from "./trainingDayGeneration";
import type { StoredTrainingDay } from "./storedDayWorkout";

const exerciseCatalog = loadExercises();

// Stored day entry of a real branch
// planBranch("SWR1KG", "79") → { branchId: "79", tags: [...], exercises: { "1": { exerciseId: "269" }, ... } }
const planBranch = (skillTree: string, branchId: string) => {
  const branch = importTree(skillTree)[branchId];
  return {
    branchId,
    tags: branch.tags,
    exercises: Object.fromEntries(
      Object.entries(branch.levels).map(([level, data]) => [
        level,
        { exerciseId: data.exerciseId },
      ]),
    ),
  };
};

// The bodyweight warm up every plan day of the old specs started with.
const warmUpEntry = {
  branchId: "410",
  tags: ["SKILL_WARM_UP", "PLACE_HALL", "REGION_LOWER_BODY", "EQ_TYPE_KG"],
  exercises: {
    "1": { exerciseId: "431" },
    "2": { exerciseId: "432" },
    "3": { exerciseId: "432" },
  },
};

interface DayOptions {
  skills: StoredTrainingDay["skills"];
  lengths: Record<string, number>;
  skillTrees: ReturnType<typeof importTrees>;
  pains?: string[];
  equipment?: string[];
}

/**
 * Generates a stored training day in a hall, reading replacements from the
 * given skill trees only.
 *
 * generateDay({ skills: { WU: [warmUpEntry] }, lengths: { WU: 5 }, skillTrees: importTrees("WU") })
 * → [{ skill: "WU", branchId: "410", exerciseId: "432", ... }, ...]
 */
const generateDay = ({
  skills,
  lengths,
  skillTrees,
  pains,
  equipment,
}: DayOptions): GeneratedSetListEntry[] =>
  generateTrainingDayFromStoredDay(
    { skills, lengths },
    generateGenerationInput({
      exerciseCatalog,
      place: "HALL",
      equipment,
      pains,
      skillTrees,
      random: () => 0,
    }),
  );

const listBranchIds = (entries: GeneratedSetListEntry[], skill: string) => [
  ...new Set(
    entries
      .filter((entry) => entry.skill === skill && entry.exerciseId !== PAUSE_ID)
      .map((entry) => entry.branchId),
  ),
];

const listPauses = (entries: GeneratedSetListEntry[], skill: string) =>
  entries
    .filter((entry) => entry.skill === skill && entry.exerciseId === PAUSE_ID)
    .map((entry) => entry.duration);

describe("training day skill drops: slots that cannot be refilled", () => {
  it("aborts when no skill of the session can be filled", () => {
    const error = catchThrownValue(() =>
      generateDay({
        skills: {
          WU: [generateBottleBranch("901", "SKILL_WARM_UP")],
          SWR1: [generateBottleBranch("68", "SKILL_HYPERTROPHY")],
        },
        lengths: { SWR1: 10 },
        skillTrees: importTrees("CARDIO_4", "CARDIO_5"),
      }),
    );

    expect(error).toEqual(
      expect.objectContaining({ type: "NO_EXERCISES", subtype: "EQUIPMENT" }),
    );
  });

  it("drops the duplicate slot when the skill tree offers no other exercise", () => {
    const tree = importTree("SWR1KG");

    const result = generateDay({
      skills: {
        SWR1KG: [planBranch("SWR1KG", "79"), planBranch("SWR1KG", "80")],
      },
      lengths: { SWR1KG: 10 },
      skillTrees: { SWR1KG: { "79": tree["79"], "80": tree["80"] } },
      equipment: ["CHAIR"],
    });

    expect(listBranchIds(result, "SWR1KG")).toHaveLength(1);
  });
});

describe("training day skill drops: prevention", () => {
  it("drops only the duplicate slot of a prevention skill and keeps the skill", () => {
    const tree = importTree("PREVKG");

    const result = generateDay({
      skills: {
        PREVSPINE: [planBranch("PREVKG", "103"), planBranch("PREVKG", "634")],
      },
      lengths: { PREVSPINE: 10 },
      skillTrees: {
        PREV: {},
        PREVKG: { "103": tree["103"], "634": tree["634"] },
      },
      pains: ["SPINE"],
    });

    expect(listBranchIds(result, "PREVSPINE")).toEqual(["103"]);
  });

  it("drops a prevention skill whose slots only refill from another prevention region", () => {
    const kneeBranch = generatePreventionBranch("800", "KNEE", "EQ_BOTTLE");

    const result = generateDay({
      skills: {
        WU: [warmUpEntry],
        PREVKNEE: [{ ...kneeBranch, exercises: kneeBranch.levels }],
      },
      lengths: { WU: 5, PREVKNEE: 10 },
      skillTrees: {
        ...importTrees("WU"),
        PREV: {},
        PREVKG: {
          "810": generatePreventionBranch("810", "SHOULDER", "EQ_TYPE_KG"),
        },
      },
      pains: ["KNEE_LEFT", "SHOULDER_LEFT"],
    });

    expect(result.filter((entry) => entry.skill?.startsWith("PREV"))).toEqual(
      [],
    );
  });
});

describe("training day skill drops: special warm up closing pause", () => {
  it("closes the special warm up with 30 seconds when no prevention block follows", () => {
    const result = generateDay({
      skills: {
        WUSPEZIAL: generateKneePreventionBranches("WUSPEZIAL", 3),
        WU: [warmUpEntry],
      },
      lengths: { WUSPEZIAL: 5, WU: 5 },
      skillTrees: importTrees("WU", "WUSPEZIAL", "PREV", "PREVKG"),
      pains: ["KNEE_LEFT"],
    });
    const pauses = listPauses(result, "WUSPEZIAL");

    expect(pauses.length).toBeGreaterThan(1);
    expect(pauses[pauses.length - 1]).toBe(30);
    expect(pauses.slice(0, -1).every((pause) => pause === 10)).toBe(true);
  });
});
