import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import {
  generateExerciseProgressMap,
  generateStoredExerciseData,
} from "@test/factories/storedExerciseData";
import type { State } from "../exerciseProgressStore";
import { exerciseProgressStoreMigrations } from "./exerciseProgressStoreMigrations";

const CARDIO_TREE_NAMES = [
  "CARDIO_1_LAKTAT",
  "CARDIO_1_SHORT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
];

const stateWith = (
  exerciseData: State["exerciseData"],
  branchData: State["branchData"] = {},
): State => ({
  exerciseProgress: {},
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

  // Branch 576 is the zone 5 cardio run, branch 253 bodyweight explosive power
  describe("v18 to v19: resets stored cardio branch levels to the entry level", () => {
    const migrated = () =>
      exerciseProgressStoreMigrations[18](
        stateWith(
          {},
          {
            "576": { branchId: "576", level: 3, exerciseId: "39" },
            "253": { branchId: "253", level: 2, exerciseId: "516" },
          },
        ),
      ).branchData;

    it("removes the stored level of a cardio branch", () => {
      expect(migrated()["576"]).toBeUndefined();
    });

    it("keeps the stored level of other branches", () => {
      expect(migrated()["253"]).toEqual({
        branchId: "253",
        level: 2,
        exerciseId: "516",
      });
    });

    it("removes the stored level of every branch in every cardio tree", () => {
      const skillTrees = getAllSkillTrees();
      const cardioBranchIds = CARDIO_TREE_NAMES.flatMap((treeName) =>
        Object.keys(skillTrees[treeName] ?? {}),
      );
      const branchData = Object.fromEntries(
        cardioBranchIds.map((branchId) => [branchId, { branchId, level: 1 }]),
      );

      const result = exerciseProgressStoreMigrations[18](
        stateWith({}, branchData),
      );

      for (const treeName of CARDIO_TREE_NAMES) {
        expect(Object.keys(skillTrees[treeName] ?? {})).not.toHaveLength(0);
      }
      expect(result.branchData).toEqual({});
    });

    it("leaves the rest of the store unchanged", () => {
      const state: State = {
        ...stateWith(
          { "100": { exerciseId: "100", skill: "SWR2", weight: 70 } },
          { "576": { branchId: "576", level: 3, exerciseId: "39" } },
        ),
        exerciseTotals: {
          "39": { weight: 0, duration: 1800, repetition: 0, height: 0 },
        },
        xp: 250,
        level: 4,
      };

      const result = exerciseProgressStoreMigrations[18](state);

      expect(result).toEqual({ ...state, branchData: {} });
    });
  });

  describe("v19 to v20: keeps each older record as the progress of the skill it names", () => {
    it("moves each older record to the skill it names", () => {
      const squat = generateStoredExerciseData({ skill: "SA", weight: 60 });
      const press = generateStoredExerciseData({
        exerciseId: "2",
        skill: "SWR1",
        repetition: 10,
      });

      const result = exerciseProgressStoreMigrations[19](
        stateWith(generateExerciseProgressMap(squat, press)),
      );

      expect(result.exerciseProgress).toEqual({
        SA: { "1": squat },
        SWR1: { "2": press },
      });
      expect(result.exerciseData).toEqual(
        generateExerciseProgressMap(squat, press),
      );
    });

    it("keeps a record the skill already holds", () => {
      const own = generateStoredExerciseData({ skill: "SA", weight: 70 });
      const state = {
        ...stateWith(
          generateExerciseProgressMap(
            generateStoredExerciseData({ skill: "SA", weight: 60 }),
          ),
        ),
        exerciseProgress: { SA: generateExerciseProgressMap(own) },
      };

      const result = exerciseProgressStoreMigrations[19](state);

      expect(result.exerciseProgress).toEqual({ SA: { "1": own } });
    });
  });
});
