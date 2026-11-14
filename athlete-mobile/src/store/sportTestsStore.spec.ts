import { generateSportTest } from "@/features/performanceTests/testFixtures";
import { useSportTestsStore } from "./sportTestsStore";

describe("sportTestsStore: cache per sport", () => {
  beforeEach(() => {
    useSportTestsStore.setState({ testsBySport: {} });
  });

  it("stores the tests under their sport", () => {
    const tests = [generateSportTest("FAKE_TEST_A")];

    useSportTestsStore.getState().setTests("HANDBALL_SPORT", tests);

    expect(useSportTestsStore.getState().testsBySport.HANDBALL_SPORT).toEqual(
      tests,
    );
  });

  it("leaves the tests of another sport unchanged", () => {
    const handballTests = [generateSportTest("FAKE_TEST_A")];
    const footballTests = [generateSportTest("FAKE_TEST_B")];
    useSportTestsStore.setState({
      testsBySport: { HANDBALL_SPORT: handballTests },
    });

    useSportTestsStore.getState().setTests("FOOTBALL_SPORT", footballTests);

    expect(useSportTestsStore.getState().testsBySport).toEqual({
      HANDBALL_SPORT: handballTests,
      FOOTBALL_SPORT: footballTests,
    });
  });

  it("replaces the tests of the same sport", () => {
    useSportTestsStore.setState({
      testsBySport: { HANDBALL_SPORT: [generateSportTest("FAKE_TEST_A")] },
    });
    const refreshed = [generateSportTest("FAKE_TEST_C")];

    useSportTestsStore.getState().setTests("HANDBALL_SPORT", refreshed);

    expect(useSportTestsStore.getState().testsBySport.HANDBALL_SPORT).toEqual(
      refreshed,
    );
  });

  it("clears every sport on reset", () => {
    useSportTestsStore.setState({
      testsBySport: {
        HANDBALL_SPORT: [generateSportTest("FAKE_TEST_A")],
        FOOTBALL_SPORT: [generateSportTest("FAKE_TEST_B")],
      },
    });

    useSportTestsStore.getState().reset();

    expect(useSportTestsStore.getState().testsBySport).toEqual({});
  });
});
