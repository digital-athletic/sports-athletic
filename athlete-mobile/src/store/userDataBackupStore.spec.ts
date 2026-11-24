import { act } from "@testing-library/react-native";
import { generateDrawnWorkout } from "@test/factories/drawnWorkout";
import { useDrawnWorkoutsStore } from "./drawnWorkoutsStore";
import { useUserDataBackupStore } from "./userDataBackupStore";
import { useUserProfileStore } from "./userProfileStore";

const profile = () => useUserProfileStore.getState();
const backup = () => useUserDataBackupStore.getState();

beforeEach(async () => {
  await act(() => {
    profile().resetProfile();
    backup().purgeSnapshot("user-1");
    useDrawnWorkoutsStore.getState().clearDrawnWorkouts();
  });
});

describe("userDataBackupStore: warnings", () => {
  it("restores seen warnings after a profile reset", async () => {
    await act(() => {
      profile().setWarningSeen("painAlertSeen", true);
      backup().takeSnapshot("user-1");
      profile().resetProfile();
      backup().restoreSnapshot("user-1");
    });

    expect(profile().warnings.painAlertSeen).toBe(true);
  });

  it("keeps a newer flag when a later sign in restores again", async () => {
    await act(() => {
      profile().setWarningSeen("painAlertSeen", true);
      backup().takeSnapshot("user-1");
      backup().restoreSnapshot("user-1");
      profile().setWarningSeen("painAlertSeen", false);
      backup().restoreSnapshot("user-1");
    });

    expect(profile().warnings.painAlertSeen).toBe(false);
  });

  it("restores unseen warnings from a snapshot taken before they existed", async () => {
    await act(() => {
      profile().setWarningSeen("painAlertSeen", true);
      useUserDataBackupStore.setState({
        snapshots: {
          "user-1": {
            profile: {
              personalData: profile().personalData,
              anamnesisCompleted: true,
              teamId: null,
            },
          },
        },
      });
      backup().restoreSnapshot("user-1");
    });

    expect(profile().warnings.painAlertSeen).toBe(false);
  });
});

describe("userDataBackupStore: drawn workouts", () => {
  it("restores the drawn workouts of the same user after a logout clears them", async () => {
    const drawnWorkouts = { "custom-a": { HOME: generateDrawnWorkout("510") } };
    await act(() => {
      useDrawnWorkoutsStore.setState({ drawnWorkouts });
      backup().takeSnapshot("user-1");
      useDrawnWorkoutsStore.getState().clearDrawnWorkouts();
      backup().restoreSnapshot("user-1");
    });

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual(
      drawnWorkouts,
    );
  });

  it("starts another user without the drawn workouts of the first", async () => {
    await act(() => {
      useDrawnWorkoutsStore.setState({
        drawnWorkouts: { "custom-a": { HOME: generateDrawnWorkout("510") } },
      });
      backup().takeSnapshot("user-1");
      useDrawnWorkoutsStore.getState().clearDrawnWorkouts();
      backup().restoreSnapshot("user-2");
    });

    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({});
  });
});
