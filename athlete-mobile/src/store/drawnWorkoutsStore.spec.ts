import { generateDrawnWorkout } from "@test/factories/drawnWorkout";
import { useDrawnWorkoutsStore } from "./drawnWorkoutsStore";

beforeEach(() => {
  useDrawnWorkoutsStore.setState({ drawnWorkouts: {} });
});

describe("drawnWorkoutsStore: saveDrawnWorkout", () => {
  it("stores the drawn workout under its workout and place and leaves another place unchanged", () => {
    const { saveDrawnWorkout } = useDrawnWorkoutsStore.getState();
    const home = generateDrawnWorkout("510");
    saveDrawnWorkout("custom-a", "HOME", home);

    saveDrawnWorkout("custom-a", "STUDIO", generateDrawnWorkout("523"));

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({
      "custom-a": { HOME: home, STUDIO: generateDrawnWorkout("523") },
    });
  });

  it("replaces the drawn workout of the same workout and place", () => {
    const { saveDrawnWorkout } = useDrawnWorkoutsStore.getState();
    saveDrawnWorkout("custom-a", "HOME", generateDrawnWorkout("510"));

    saveDrawnWorkout("custom-a", "HOME", generateDrawnWorkout("523"));

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({
      "custom-a": { HOME: generateDrawnWorkout("523") },
    });
  });
});

describe("drawnWorkoutsStore: discardDrawnWorkouts", () => {
  it("removes every place of the workout and leaves the other workouts unchanged", () => {
    const { saveDrawnWorkout, discardDrawnWorkouts } =
      useDrawnWorkoutsStore.getState();
    saveDrawnWorkout("custom-a", "HOME", generateDrawnWorkout("510"));
    saveDrawnWorkout("custom-a", "STUDIO", generateDrawnWorkout("521"));
    saveDrawnWorkout("custom-b", "HOME", generateDrawnWorkout("523"));
    saveDrawnWorkout("custom-b", "STUDIO", generateDrawnWorkout("520"));

    discardDrawnWorkouts("custom-a");

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({
      "custom-b": {
        HOME: generateDrawnWorkout("523"),
        STUDIO: generateDrawnWorkout("520"),
      },
    });
  });

  it("changes nothing for a workout without drawn workouts", () => {
    const { saveDrawnWorkout, discardDrawnWorkouts } =
      useDrawnWorkoutsStore.getState();
    saveDrawnWorkout("custom-a", "HOME", generateDrawnWorkout("510"));

    discardDrawnWorkouts("custom-unknown");

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({
      "custom-a": { HOME: generateDrawnWorkout("510") },
    });
  });
});

describe("drawnWorkoutsStore: keepDrawnWorkoutsOf", () => {
  it("removes the drawn workouts of every workout the list leaves out", () => {
    const { saveDrawnWorkout, keepDrawnWorkoutsOf } =
      useDrawnWorkoutsStore.getState();
    saveDrawnWorkout("custom-a", "HOME", generateDrawnWorkout("510"));
    saveDrawnWorkout("custom-b", "HOME", generateDrawnWorkout("523"));

    keepDrawnWorkoutsOf(["custom-b"]);

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({
      "custom-b": { HOME: generateDrawnWorkout("523") },
    });
  });
});

describe("drawnWorkoutsStore: clearDrawnWorkouts", () => {
  it("removes the drawn workouts of every workout", () => {
    const { saveDrawnWorkout, clearDrawnWorkouts } =
      useDrawnWorkoutsStore.getState();
    saveDrawnWorkout("custom-a", "HOME", generateDrawnWorkout("510"));
    saveDrawnWorkout("custom-b", "STUDIO", generateDrawnWorkout("523"));

    clearDrawnWorkouts();

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({});
  });
});
