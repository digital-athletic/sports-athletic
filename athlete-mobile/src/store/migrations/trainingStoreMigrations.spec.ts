import { migrateTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { STORE_VERSIONS } from "../storeVersions";

describe("trainingStoreMigrations", () => {
  describe("v16 to v17: drops the stored training selection", () => {
    const persistedAtV16 = {
      ...BASELINE_TRAINING_STATE,
      trainingViewMode: null,
      selection: "PLAN",
    };

    it("registers version 17 for the training store", () => {
      expect(STORE_VERSIONS.TRAINING).toBe(17);
    });

    it("removes selection from state persisted at v16", () => {
      const result = migrateTrainingStore(persistedAtV16, 16);

      expect(result).not.toHaveProperty("selection");
    });

    it("keeps the rest of the persisted state", () => {
      const result = migrateTrainingStore(
        { ...persistedAtV16, equipment: ["DUMBBELL"] },
        16,
      );

      expect(result.equipment).toEqual(["DUMBBELL"]);
      expect(result.time).toEqual(BASELINE_TRAINING_STATE.time);
    });
  });
});
