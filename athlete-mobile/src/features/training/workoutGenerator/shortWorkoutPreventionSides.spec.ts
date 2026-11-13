import { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import { generateAthleteWithMaxValues } from "@test/factories/athlete";
import {
  importTrees,
  noExerciseData,
  PAUSE_ID,
  realExercises,
} from "@test/factories/planWorkout";
import PlacesData from "../../../../assets/data/generator/places.json";

describe("AIWL short workout: prevention sides", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("contains both sides of each one sided exercise for a right knee pain", () => {
    const exerciseById = new Map(
      realExercises.map((entry) => [entry.id, entry]),
    );
    const entries = generateWorkout({
      type: "PREVKNEE",
      user: generateAthleteWithMaxValues({ pains: ["KNEE_RIGHT"] }),
      place: "STUDIO",
      exercises: realExercises,
      skillTrees: importTrees("WUSPEZIAL", "PREV", "PREVKG"),
      weekday: 1,
      equipment: PlacesData.STUDIO.EQUIPMENT,
      givenSection: undefined,
      daysSinceLastWorkout: 0,
      userExerciseData: noExerciseData,
    }).filter(
      (entry) =>
        entry.exerciseId !== PAUSE_ID && entry.skill.startsWith("PREV"),
    );
    const ids = new Set(entries.map((entry) => entry.exerciseId));
    const oneSided = entries
      .map((entry) => exerciseById.get(entry.exerciseId))
      .filter((entry) => entry?.otherSideExerciseId);

    expect(oneSided.length).toBeGreaterThan(0);
    for (const entry of oneSided) {
      expect(ids.has(entry?.otherSideExerciseId ?? "")).toBe(true);
    }
  });
});
