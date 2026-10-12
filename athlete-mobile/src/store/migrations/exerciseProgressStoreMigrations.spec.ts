import type { State } from "../exerciseProgressStore";
import { exerciseProgressStoreMigrations } from "./exerciseProgressStoreMigrations";

const stateWith = (
  exerciseData: State["exerciseData"],
  branchData: State["branchData"] = {},
): State => ({
  exerciseData,
  branchData,
  exerciseTotals: {},
  xp: 0,
  level: 1,
  testHistory: [],
});

describe("exerciseProgressStoreMigrations", () => {
  describe("v15 to v16: resets stored jump squat weights", () => {
    it("removes the stored weight of jump squats 292 and 294", () => {
      const state = stateWith({
        "292": {
          exerciseId: "292",
          skill: "SK",
          weight: 25,
          weightType: "weightFMax",
          repetition: 5,
        },
        "294": { exerciseId: "294", skill: "SK", weight: 15 },
      });

      const result = exerciseProgressStoreMigrations[15](state);

      expect(result.exerciseData["292"]).toEqual({
        exerciseId: "292",
        skill: "SK",
        weightType: "weightFMax",
        repetition: 5,
      });
      expect(result.exerciseData["294"]).toEqual({
        exerciseId: "294",
        skill: "SK",
      });
    });

    it("keeps the stored weight of other exercises", () => {
      const state = stateWith({
        "100": { exerciseId: "100", skill: "SWR2", weight: 70 },
      });

      const result = exerciseProgressStoreMigrations[15](state);

      expect(result.exerciseData["100"]?.weight).toBe(70);
    });

    it("leaves state without jump squat entries unchanged", () => {
      const state = stateWith({});

      const result = exerciseProgressStoreMigrations[15](state);

      expect(result.exerciseData).toEqual({});
    });
  });

  // Branch 253 (bodyweight explosive power) has the levels 1, 2 and 4
  describe("v16 to v17: moves stored branch levels that do not exist", () => {
    const levelAfterMigration = (level: number, branchId = "253") =>
      exerciseProgressStoreMigrations[16](
        stateWith({}, { [branchId]: { branchId, level } }),
      ).branchData[branchId]?.level;

    it("moves a level above the top to the highest level", () => {
      expect(levelAfterMigration(5)).toBe(4);
    });

    it("moves a level in a gap to the next lower level", () => {
      expect(levelAfterMigration(3)).toBe(2);
    });

    it("keeps a level below the lowest, which falls back to the entry level", () => {
      expect(levelAfterMigration(0)).toBe(0);
    });

    it("keeps a level that exists", () => {
      expect(levelAfterMigration(2)).toBe(2);
    });

    it("keeps the level of a branch that no skill tree holds", () => {
      expect(levelAfterMigration(7, "unknown-branch")).toBe(7);
    });
  });

  // Branch 253 holds exercise 516 at level 2
  describe("v17 to v18: stores the exercise of each stored branch level", () => {
    const entryAfterMigration = (level: number, branchId = "253") =>
      exerciseProgressStoreMigrations[17](
        stateWith({}, { [branchId]: { branchId, level } }),
      ).branchData[branchId];

    it("stores the exercise the branch holds at the stored level", () => {
      expect(entryAfterMigration(2)).toEqual({
        branchId: "253",
        level: 2,
        exerciseId: "516",
      });
    });

    it("stores no exercise for a level the branch does not hold", () => {
      expect(entryAfterMigration(3)).toEqual({ branchId: "253", level: 3 });
    });

    it("keeps the entry of a branch that no skill tree holds", () => {
      expect(entryAfterMigration(2, "unknown-branch")).toEqual({
        branchId: "unknown-branch",
        level: 2,
      });
    });
  });
});
