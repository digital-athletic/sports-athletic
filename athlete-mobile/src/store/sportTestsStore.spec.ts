import { generateSportTest } from "@/features/performanceTests/testFixtures";
import { useSportTestsStore } from "./sportTestsStore";

describe("sportTestsStore: cache per sport", () => {
  beforeEach(() => {
    useSportTestsStore.setState({ testsBySport: {} });
  });

  it("stores the tests under their sport", () => {
    const tests = [generateSportTest("FAKE_TEST_A")];

    useSportTestsStore.getState().setTests("SPORT_HANDBALL", tests);

    expect(useSportTestsStore.getState().testsBySport.SPORT_HANDBALL).toEqual(
      tests,
    );
  });

  it("leaves the tests of another sport unchanged", () => {
    const handballTests = [generateSportTest("FAKE_TEST_A")];
    const footballTests = [generateSportTest("FAKE_TEST_B")];
    useSportTestsStore.setState({
      testsBySport: { SPORT_HANDBALL: handballTests },
    });

    useSportTestsStore.getState().setTests("SPORT_FOOTBALL", footballTests);

    expect(useSportTestsStore.getState().testsBySport).toEqual({
      SPORT_HANDBALL: handballTests,
      SPORT_FOOTBALL: footballTests,
    });
  });

  it("replaces the tests of the same sport", () => {
    useSportTestsStore.setState({
      testsBySport: { SPORT_HANDBALL: [generateSportTest("FAKE_TEST_A")] },
    });
    const refreshed = [generateSportTest("FAKE_TEST_C")];

    useSportTestsStore.getState().setTests("SPORT_HANDBALL", refreshed);

    expect(useSportTestsStore.getState().testsBySport.SPORT_HANDBALL).toEqual(
      refreshed,
    );
  });

  it("clears every sport on reset", () => {
    useSportTestsStore.setState({
      testsBySport: {
        SPORT_HANDBALL: [generateSportTest("FAKE_TEST_A")],
        SPORT_FOOTBALL: [generateSportTest("FAKE_TEST_B")],
      },
    });

    useSportTestsStore.getState().reset();

    expect(useSportTestsStore.getState().testsBySport).toEqual({});
  });
});
