import {
  importTrees,
  noExerciseData,
  PAUSE_ID,
  realExercises,
} from "../../../../test/factories/planWorkout";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserType } from "@/schemas/user.schema";
import PlacesData from "../../../../assets/data/generator/places.json";
import TrainingGenerator from "./TrainingGenerator";

const skillTrees = importTrees("BR");

const adult: UserType = {
  userId: "equipment-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"], PAIN: [] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

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

const generateBrAtHome = (seed: number): GeneratedSetListEntry[] => {
  jest.spyOn(Math, "random").mockImplementation(mulberry32(seed));
  return new TrainingGenerator().generateTraining(
    "BR",
    adult,
    "HOME",
    realExercises,
    skillTrees,
    1,
    PlacesData.HOME.EQUIPMENT,
    undefined,
    0,
    noExerciseData,
  );
};

beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("shortWorkoutEquipment: BR at HOME", () => {
  const homeEquipment: string[] = PlacesData.HOME.EQUIPMENT;
  // The EQ tags of a branch are alternatives; one owned item is enough.
  const fitsHome = (tags: string[]): boolean => {
    const needed = tags
      .filter((tag) => tag.startsWith("EQ_") && !tag.startsWith("EQ_TYPE_"))
      .map((tag) => tag.slice("EQ_".length));
    return (
      needed.length === 0 || needed.some((eq) => homeEquipment.includes(eq))
    );
  };
  const allowedBranchIds = Object.entries(skillTrees.BR)
    .filter(([, branch]) => fitsHome(branch.tags))
    .map(([branchId]) => branchId);

  const drawnBranchIds = (): string[] =>
    generateBrAtHome(42)
      .filter((entry) => entry.exerciseId !== PAUSE_ID)
      .map((entry) => entry.branchId);

  it("allows the towel branch and the chair branch", () => {
    expect(allowedBranchIds).toEqual(expect.arrayContaining(["565", "562"]));
  });

  it("generates a set list without an equipment error", () => {
    expect(drawnBranchIds().length).toBeGreaterThan(0);
  });

  it("draws only branches the home equipment allows", () => {
    const outside = drawnBranchIds().filter(
      (branchId) => !allowedBranchIds.includes(branchId),
    );
    expect(outside).toEqual([]);
  });
});
