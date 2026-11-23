import { generateDrawnWorkout } from "@test/factories/drawnWorkout";
import { useDrawnWorkoutsStore } from "./drawnWorkoutsStore";

beforeEach(() => {
  useDrawnWorkoutsStore.setState({ drawnWorkouts: {} });
});

describe("drawnWorkoutsStore: saveDrawnWorkout", () => {
  it("stores the drawn workout under its workout and place", () => {
    const drawnWorkout = generateDrawnWorkout("510");

    useDrawnWorkoutsStore
      .getState()
      .saveDrawnWorkout("custom-a", "HOME", drawnWorkout);

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({
      "custom-a": { HOME: drawnWorkout },
    });
  });

  it("leaves the drawn workout of another place of the workout unchanged", () => {
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
