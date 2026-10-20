import path from "node:path";
import { GoldenDirectory } from "../../../../test/goldenDirectory";
import { renderTable, type ColumnSpec } from "../../../../test/markdownTable";
import {
  importTrees,
  noExerciseData,
  PAUSE_ID,
  realExercises,
} from "../../../../test/factories/planWorkout";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TrainingType } from "@/features/training/models/Training";
import { PAIN_REGIONS } from "@/features/training/utils/painUtils";
import type { UserType } from "@/schemas/user.schema";
import PlacesData from "../../../../assets/data/generator/places.json";
import { isGeneratorError } from "./GeneratorError";
import TrainingGenerator from "./TrainingGenerator";

const goldens = new GoldenDirectory(path.join(__dirname, "__golden__"));

const TEMPLATES: TrainingType[] = [
  "WU",
  "MOB",
  "BR",
  "CD",
  "BAS",
  "GKS",
  "STABILITY",
  "PREV",
  "PREVSHOULDER",
  "PREVKNEE",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",
];
const PREVENTION_TEMPLATES = TEMPLATES.filter((id) => id.startsWith("PREV"));
const PLACES = ["STUDIO", "HOME", "HALL"] as const;
const SEEDS = [1, 7, 42];
const SWEEP_SEED = 42;

const skillTrees = importTrees(
  "WU",
  "MOB",
  "BR",
  "CD",
  "BAS",
  "GKS",
  "GKSKG",
  "PREV",
  "PREVKG",
  "WUSPEZIAL",
);

interface AthleteCase {
  label: string;
  gender: "MALE" | "FEMALE";
  birthday: string;
  pains: string[];
}

const ADULT: AthleteCase = {
  label: "adult beginner male 1990",
  gender: "MALE",
  birthday: "1990-01-01",
  pains: [],
};
const ATHLETES: AthleteCase[] = [
  ADULT,
  { label: "child 2016", gender: "MALE", birthday: "2016-01-01", pains: [] },
  {
    label: "adult pains KNEE_RIGHT SHOULDER_LEFT",
    gender: "MALE",
    birthday: "1990-01-01",
    pains: ["KNEE_RIGHT", "SHOULDER_LEFT"],
  },
];

interface Case {
  template: TrainingType;
  place: (typeof PLACES)[number];
  athlete: AthleteCase;
  seed: number;
  setList: string;
}

// Mulberry32: small seeded PRNG so Math.random stays reproducible.
const mulberry32 = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const encodeEntry = (entry: GeneratedSetListEntry): string => {
  if (entry.exerciseId === PAUSE_ID) return `p${entry.duration ?? 0}`;
  const value = [
    entry.duration === undefined ? null : `${entry.duration}s`,
    entry.repetition === undefined ? null : `${entry.repetition}x`,
  ].filter((part) => part !== null);
  const parts = [
    entry.exerciseId,
    entry.skill,
    `${entry.set[0]}/${entry.set[1]}`,
    value.length > 0 ? value.join("+") : "none",
    `b${entry.branchId}`,
  ];
  if (entry.weight !== undefined) parts.push(`w${entry.weight}`);
  if (entry.height !== undefined) parts.push(`h${entry.height}`);
  return parts.join(":");
};

const buildUser = (athlete: AthleteCase): UserType => ({
  userId: "golden-user",
  personalData: { gender: athlete.gender, birthday: athlete.birthday },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"], PAIN: athlete.pains },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
});

const generateSetList = (
  template: TrainingType,
  place: (typeof PLACES)[number],
  athlete: AthleteCase,
  seed: number,
): string => {
  jest.spyOn(Math, "random").mockImplementation(mulberry32(seed));
  try {
    const entries = new TrainingGenerator().generateTraining(
      template,
      buildUser(athlete),
      place,
      realExercises,
      skillTrees,
      1,
      PlacesData[place].EQUIPMENT,
      undefined,
      0,
      noExerciseData,
    );
    return entries.map(encodeEntry).join(" ");
  } catch (error) {
    if (!isGeneratorError(error)) throw error;
    return `error ${error.type}/${error.subtype} ${error.params.join(",")}`;
  }
};

const buildCase = (
  template: TrainingType,
  place: Case["place"],
  athlete: AthleteCase,
  seed: number,
): Case => ({
  template,
  place,
  athlete,
  seed,
  setList: generateSetList(template, place, athlete, seed),
});

const COLUMNS: ColumnSpec<Case>[] = [
  { header: "template", value: (row) => row.template },
  { header: "in: place", value: (row) => row.place },
  { header: "in: athlete", value: (row) => row.athlete.label },
  { header: "in: seed", value: (row) => row.seed },
  { header: "out: set list", value: (row) => row.setList },
];

beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("shortWorkoutGolden: main matrix", () => {
  const cases = (): Case[] =>
    TEMPLATES.flatMap((template) =>
      PLACES.flatMap((place) =>
        ATHLETES.flatMap((athlete) =>
          SEEDS.map((seed) => buildCase(template, place, athlete, seed)),
        ),
      ),
    );

  it("matches the golden set lists for every template, place, athlete and seed", () => {
    goldens.assertMatches("shortWorkouts.md", renderTable(COLUMNS, cases()));
  });

  it("gives the adult at STUDIO a non empty set list for every template", () => {
    for (const template of TEMPLATES) {
      const { setList } = buildCase(template, "STUDIO", ADULT, 42);
      expect({ template, setList }).toEqual({
        template,
        setList: expect.not.stringMatching(/^(error|$)/),
      });
    }
  });

  it("gives seeds 1 and 42 different GKS set lists", () => {
    const first = buildCase("GKS", "STUDIO", ADULT, 1).setList;
    const second = buildCase("GKS", "STUDIO", ADULT, 42).setList;
    expect(first).not.toBe(second);
  });
});

describe("shortWorkoutGolden: pain sweep", () => {
  it("matches the golden prevention set lists for every single pain region", () => {
    const rows = PREVENTION_TEMPLATES.flatMap((template) =>
      PAIN_REGIONS.map((region) =>
        buildCase(
          template,
          "STUDIO",
          { ...ADULT, label: `adult pain ${region}`, pains: [region] },
          SWEEP_SEED,
        ),
      ),
    );
    goldens.assertMatches(
      "shortWorkoutsPainSweep.md",
      renderTable(COLUMNS, rows),
    );
  });
});
