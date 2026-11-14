import { type SportTest } from "@/features/performanceTests/models/SportTest";
import { useSportTestsStore } from "./sportTestsStore";

/**
 * A sport test without reference values, e.g.
 * { id: "test-1", code: "FAKE_TEST", unit: "s", referenceValues: [] }
 */
const generateSportTest = (code: string): SportTest => ({
  id: `id-${code}`,
  code,
  unit: "s",
  referenceValues: [],
});

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

  it("keeps the tests of another sport untouched", () => {
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
