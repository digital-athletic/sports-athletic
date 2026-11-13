import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import { generateAthleteWithMaxValues } from "@test/factories/athlete";
import {
  importTrees,
  noExerciseData,
  PAUSE_ID,
  realExercises,
} from "@test/factories/planWorkout";
import PlacesData from "../../../../assets/data/generator/places.json";

const skillTrees = importTrees("BR");

const generateBreathingAtHome = (): GeneratedSetListEntry[] =>
  generateWorkout({
    type: "BR",
    user: generateAthleteWithMaxValues(),
    place: "HOME",
    exercises: realExercises,
    skillTrees,
    weekday: 1,
    equipment: PlacesData.HOME.EQUIPMENT,
    givenSection: undefined,
    daysSinceLastWorkout: 0,
    userExerciseData: noExerciseData,
  });

describe("AIWL short workout: breathing at home", () => {
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
    generateBreathingAtHome()
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
