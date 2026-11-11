import { migrateTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";

describe("trainingStoreMigrations: v16 to v17", () => {
  it.each(["PLAN", null])(
    "removes a stored selection of %p and leaves the rest of the state unchanged",
    (selection) => {
      const withoutSelection = {
        ...BASELINE_TRAINING_STATE,
        equipment: ["DUMBBELL"],
        trainingViewMode: null,
      };

      const result = migrateTrainingStore(
        { ...withoutSelection, selection },
        16,
      );

      expect(result).toEqual(withoutSelection);
    },
  );
});
