import { loadSkillCatalog, parseSkillCatalog } from "@/data/loadSkillCatalog";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateAthlete } from "@test/factories/athlete";
import { generateTreeBranch } from "@test/factories/skillTree";
import {
  buildBranchLookupIndex,
  loadBranchLookupIndex,
} from "./branchLookupIndex";
import { createGenerationInput } from "./generationInput";

describe("generationInput: createGenerationInput", () => {
  it("holds the given inputs and loads the catalogs and the index", () => {
    const athlete = generateAthlete();
    const exerciseCatalog: ExerciseType[] = [];
    const exerciseData = { exerciseData: {}, branchData: {} };

    const input = createGenerationInput({
      athlete,
      place: "HOME",
      equipment: ["DUMBBELL"],
      exerciseCatalog,
      exerciseData,
    });

    expect(input.athlete).toBe(athlete);
    expect(input.place).toBe("HOME");
    expect(input.equipment).toEqual(["DUMBBELL"]);
    expect(input.exerciseCatalog).toEqual(exerciseCatalog);
    expect(input.exerciseCatalog).not.toBe(exerciseCatalog);
    expect(input.exerciseData).toBe(exerciseData);
    expect(input.skillCatalog).toBe(loadSkillCatalog());
    expect(input.branchLookupIndex).toBe(loadBranchLookupIndex());
    expect(input.random).toBe(Math.random);
  });

  it("reads the muscle soreness from the athlete", () => {
    const input = createGenerationInput({
      athlete: generateAthlete({ soreMuscles: ["CHEST", "QUADRICEPS"] }),
      place: "STUDIO",
      equipment: [],
      exerciseCatalog: [],
      exerciseData: { exerciseData: {}, branchData: {} },
    });

    expect(input.muscleSoreness).toEqual([
      { tag: "CHEST", date: "2026-10-24", expiration: "2026-10-25" },
      { tag: "QUADRICEPS", date: "2026-10-24", expiration: "2026-10-25" },
    ]);
  });

  it("holds no muscle soreness for an athlete without marks", () => {
    const input = createGenerationInput({
      athlete: generateAthlete({
        withoutPersonalData: true,
        withoutWorkoutData: true,
      }),
      place: "STUDIO",
      equipment: [],
      exerciseCatalog: [],
      exerciseData: { exerciseData: {}, branchData: {} },
    });

    expect(input.muscleSoreness).toEqual([]);
  });

  it("uses a given random source and branch lookup index", () => {
    const random = () => 0.5;
    const branchLookupIndex = buildBranchLookupIndex({
      GKS: { "1": generateTreeBranch(["10"]) },
    });

    const input = createGenerationInput({
      athlete: generateAthlete(),
      place: "HALL",
      equipment: [],
      exerciseCatalog: [],
      exerciseData: { exerciseData: {}, branchData: {} },
      random,
      branchLookupIndex,
    });

    expect(input.random).toBe(random);
    expect(input.branchLookupIndex).toBe(branchLookupIndex);
  });

  it("uses a given skill catalog", () => {
    const skillCatalog = parseSkillCatalog({ SASKG: { sets: 3 } });

    const input = createGenerationInput({
      athlete: generateAthlete(),
      place: "HALL",
      equipment: [],
      exerciseCatalog: [],
      exerciseData: { exerciseData: {}, branchData: {} },
      skillCatalog,
    });

    expect(input.skillCatalog).toBe(skillCatalog);
  });

  it("returns a frozen object", () => {
    const input = createGenerationInput({
      athlete: generateAthlete(),
      place: "OUTSIDE",
      equipment: ["BARBELL"],
      exerciseCatalog: [],
      exerciseData: { exerciseData: {}, branchData: {} },
    });

    expect(Object.isFrozen(input)).toBe(true);
    expect(Object.isFrozen(input.equipment)).toBe(true);
    expect(Object.isFrozen(input.muscleSoreness)).toBe(true);
    expect(Object.isFrozen(input.exerciseCatalog)).toBe(true);
  });

  it("leaves the given equipment list unchanged and unfrozen", () => {
    const equipment = ["BARBELL"];

    createGenerationInput({
      athlete: generateAthlete(),
      place: "OUTSIDE",
      equipment,
      exerciseCatalog: [],
      exerciseData: { exerciseData: {}, branchData: {} },
    });

    expect(equipment).toEqual(["BARBELL"]);
    expect(Object.isFrozen(equipment)).toBe(false);
  });
});
