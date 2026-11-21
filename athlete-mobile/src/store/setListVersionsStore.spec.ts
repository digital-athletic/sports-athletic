import { generateSavedVersion } from "@test/factories/savedVersion";
import { useSetListVersionsStore } from "./setListVersionsStore";

beforeEach(() => {
  useSetListVersionsStore.setState({ versionsByWorkout: {} });
});

describe("setListVersionsStore: saveVersion", () => {
  it("stores the version under its workout and place", () => {
    const version = generateSavedVersion("510");

    useSetListVersionsStore.getState().saveVersion("custom-a", "HOME", version);

    expect(useSetListVersionsStore.getState().versionsByWorkout).toEqual({
      "custom-a": { HOME: version },
    });
  });

  it("leaves the version of another place of the workout unchanged", () => {
    const { saveVersion } = useSetListVersionsStore.getState();
    const home = generateSavedVersion("510");
    saveVersion("custom-a", "HOME", home);

    saveVersion("custom-a", "STUDIO", generateSavedVersion("523"));

    expect(useSetListVersionsStore.getState().versionsByWorkout).toEqual({
      "custom-a": { HOME: home, STUDIO: generateSavedVersion("523") },
    });
  });

  it("replaces the version of the same workout and place", () => {
    const { saveVersion } = useSetListVersionsStore.getState();
    saveVersion("custom-a", "HOME", generateSavedVersion("510"));

    saveVersion("custom-a", "HOME", generateSavedVersion("523"));

    expect(useSetListVersionsStore.getState().versionsByWorkout).toEqual({
      "custom-a": { HOME: generateSavedVersion("523") },
    });
  });
});

describe("setListVersionsStore: clearSetListVersions", () => {
  it("removes the versions of every workout", () => {
    const { saveVersion, clearSetListVersions } =
      useSetListVersionsStore.getState();
    saveVersion("custom-a", "HOME", generateSavedVersion("510"));
    saveVersion("custom-b", "STUDIO", generateSavedVersion("523"));

    clearSetListVersions();

    expect(useSetListVersionsStore.getState().versionsByWorkout).toEqual({});
  });
});
