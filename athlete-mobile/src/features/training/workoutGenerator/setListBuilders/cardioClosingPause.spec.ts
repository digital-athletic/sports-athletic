import { isPauseExercise } from "@/features/training/models/IdTypes";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateCardioSetListBlock } from "@test/factories/setListBlock";
import { findCatalogExerciseById } from "@test/factories/valueExercise";
import { buildCardioSetList } from "./cardioSetListBuilder";

const ZONE_TWO_RUN = "42";

/**
 * Builds a CARDIO_2 interval block of the given minutes from one run branch.
 *
 * buildIntervalBlock(3) → the warm-up, the work interval and its running pause
 */
const buildIntervalBlock = (minutes: number) =>
  buildCardioSetList(
    [
      {
        first: { branchId: "b1", branchTags: [], exerciseId: ZONE_TWO_RUN },
      },
    ],
    generateCardioSetListBlock("CARDIO_2", minutes),
    generateRuleFamilyInput({
      exerciseCatalog: [findCatalogExerciseById(ZONE_TWO_RUN)],
    }),
  );

describe("cardioClosingPause: interval block", () => {
  it.each([3, 14, 30])(
    "ends an interval block of %i minutes without a pause",
    (minutes) => {
      const setList = buildIntervalBlock(minutes);
      const seconds = setList.reduce(
        (sum, entry) => sum + (entry.duration ?? 0),
        0,
      );

      expect(setList.some((entry) => isPauseExercise(entry.exerciseId))).toBe(
        false,
      );
      expect(seconds).toBeLessThanOrEqual(minutes * 60);
    },
  );
});
