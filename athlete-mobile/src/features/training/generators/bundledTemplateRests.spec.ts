import {
  importTrees,
  noExerciseData,
  PAUSE_ID,
  realExercises,
} from "../../../../test/factories/planWorkout";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TrainingType } from "@/features/training/models/Training";
import type { UserType } from "@/schemas/user.schema";
import PlacesData from "../../../../assets/data/generator/places.json";
import TrainingGenerator from "./TrainingGenerator";

const PREVENTION_TEMPLATES: TrainingType[] = [
  "PREV",
  "PREVSHOULDER",
  "PREVKNEE",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",
];

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

const adult: UserType = {
  userId: "bundled-rests-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"], PAIN: [] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const generate = (template: TrainingType): GeneratedSetListEntry[] =>
  new TrainingGenerator().generateTraining(
    template,
    adult,
    "STUDIO",
    realExercises,
    skillTrees,
    1,
    PlacesData.STUDIO.EQUIPMENT,
    undefined,
    0,
    noExerciseData,
  );

const restsOf = (
  entries: GeneratedSetListEntry[],
  skill: string,
): (number | undefined)[] =>
  entries
    .filter((entry) => entry.exerciseId === PAUSE_ID && entry.skill === skill)
    .map((entry) => entry.duration);

beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
  // A fixed draw, so the STABILITY tests always see a pair and a single exercise.
  jest.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("bundledTemplateRests: prevention", () => {
  it.each(PREVENTION_TEMPLATES)(
    "%s rests 30 s after the last special warm up entry and 10 s before",
    (template) => {
      const rests = restsOf(generate(template), "WUSPEZIAL");
      expect(rests.length).toBeGreaterThan(1);
      expect(rests[rests.length - 1]).toBe(30);
      expect(rests.slice(0, -1).every((rest) => rest === 10)).toBe(true);
    },
  );

  it("PREV rests 30 s after every prevention entry", () => {
    const rests = restsOf(generate("PREV"), "PREV");
    expect(rests.length).toBeGreaterThan(0);
    expect(rests.every((rest) => rest === 30)).toBe(true);
  });
});

describe("bundledTemplateRests: GKS and BAS", () => {
  it("GKS rests 45 s in every pause", () => {
    const rests = restsOf(generate("GKS"), "GKS");
    expect(rests.length).toBeGreaterThan(0);
    expect(rests.every((rest) => rest === 45)).toBe(true);
  });

  it("BAS rests 30 s in every pause", () => {
    const rests = restsOf(generate("BAS"), "BAS");
    expect(rests.length).toBeGreaterThan(0);
    expect(rests.every((rest) => rest === 30)).toBe(true);
  });
});

describe("bundledTemplateRests: STABILITY", () => {
  it("builds at least one superset pair with interleaved exercises", () => {
    const exercises = generate("STABILITY").filter(
      (entry) => entry.exerciseId !== PAUSE_ID,
    );
    const hasInterleavedPair = exercises.some(
      (entry, index) =>
        index >= 2 &&
        entry.set[0] === 2 &&
        exercises[index - 2].exerciseId === entry.exerciseId &&
        exercises[index - 1].exerciseId !== entry.exerciseId,
    );
    expect(hasInterleavedPair).toBe(true);
  });

  it("rests 30 s between the sets of a single exercise", () => {
    const entries = generate("STABILITY");
    const betweenSets = entries.flatMap((entry, index) => {
      const rest = entries[index + 1];
      const next = entries[index + 2];
      return entry.exerciseId !== PAUSE_ID &&
        rest?.exerciseId === PAUSE_ID &&
        next?.exerciseId === entry.exerciseId &&
        next.set[0] === entry.set[0] + 1
        ? [rest.duration]
        : [];
    });
    expect(betweenSets.length).toBeGreaterThan(0);
    expect(betweenSets.every((rest) => rest === 30)).toBe(true);
  });
});
