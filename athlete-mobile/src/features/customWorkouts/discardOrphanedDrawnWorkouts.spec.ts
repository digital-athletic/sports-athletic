import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { useDrawnWorkoutsStore } from "@/store/drawnWorkoutsStore";
import { generateDrawnWorkout } from "@test/factories/drawnWorkout";
import { generateTemplate } from "@test/factories/templateBlock";
import { discardOrphanedDrawnWorkouts } from "./discardOrphanedDrawnWorkouts";

beforeEach(() => {
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
  useDrawnWorkoutsStore.getState().clearDrawnWorkouts();
});

describe("discardOrphanedDrawnWorkouts", () => {
  it("keeps the drawn workouts of stored trainings and discards the others", () => {
    const stored = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateTemplate([], { id: "own" }), null);
    const { saveDrawnWorkout } = useDrawnWorkoutsStore.getState();
    saveDrawnWorkout(stored.id, "HOME", generateDrawnWorkout("510"));
    saveDrawnWorkout(
      "custom-of-a-left-team",
      "HOME",
      generateDrawnWorkout("523"),
    );

    discardOrphanedDrawnWorkouts();

    expect(Object.keys(useDrawnWorkoutsStore.getState().drawnWorkouts)).toEqual(
      [stored.id],
    );
  });
});
