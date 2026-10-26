import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import {
  buildPlanUser,
  generatePlanWorkoutForWeekday,
  importTrees,
} from "@test/factories/planWorkout";

describe("training day cardio block: closing pause", () => {
  setUpAiwlGeneratorFlag(true);

  it("keeps the run that ends a plan workout", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        CARDIO_4: [
          {
            branchId: "579",
            tags: ["SKILL_CARDIO_4", "PLACE_STUDIO", "EQ_TREADMILL"],
            exercises: { "1": { exerciseId: "38" } },
          },
        ],
      },
      lengths: { CARDIO_4: 30 },
    });

    const setList = generatePlanWorkoutForWeekday(user, {
      place: "STUDIO",
      equipment: ["TREADMILL"],
      skillTrees: importTrees("WU", "CARDIO_3", "CARDIO_4", "CARDIO_5"),
    });

    expect(setList.at(-1)).toEqual(
      expect.objectContaining({ exerciseId: "38", duration: 1800 }),
    );
  });
});
