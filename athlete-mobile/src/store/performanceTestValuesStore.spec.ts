import { generatePerformanceTestValue } from "@/features/performanceTests/testFixtures";
import { usePerformanceTestValuesStore } from "./performanceTestValuesStore";

describe("performanceTestValuesStore: values per test", () => {
  beforeEach(() => {
    usePerformanceTestValuesStore.setState({ valuesByTest: {} });
  });

  it("stores the entry under its key", () => {
    usePerformanceTestValuesStore
      .getState()
      .addValue("SPORT_HANDBALL/SPRINT_5M", { date: "2026-03-01", value: 8.1 });

    expect(
      usePerformanceTestValuesStore.getState().valuesByTest[
        "SPORT_HANDBALL/SPRINT_5M"
      ],
    ).toEqual([{ id: expect.any(String), date: "2026-03-01", value: 8.1 }]);
  });

  it("appends a second entry after the first", () => {
    const first = generatePerformanceTestValue({ id: "id-first" });
    usePerformanceTestValuesStore.setState({
      valuesByTest: { "SPORT_HANDBALL/SPRINT_5M": [first] },
    });

    usePerformanceTestValuesStore
      .getState()
      .addValue("SPORT_HANDBALL/SPRINT_5M", { date: "2026-03-05", value: 7.9 });

    const stored =
      usePerformanceTestValuesStore.getState().valuesByTest[
        "SPORT_HANDBALL/SPRINT_5M"
      ];
    expect(stored).toHaveLength(2);
    expect(stored?.[0]).toEqual(first);
    expect(stored?.[1]).toMatchObject({ date: "2026-03-05", value: 7.9 });
  });

  it("generates a unique id for each entry", () => {
    const { addValue } = usePerformanceTestValuesStore.getState();

    addValue("SPORT_HANDBALL/SPRINT_5M", { date: "2026-03-01", value: 8.1 });
    addValue("SPORT_HANDBALL/SPRINT_5M", { date: "2026-03-01", value: 8.1 });

    const stored =
      usePerformanceTestValuesStore.getState().valuesByTest[
        "SPORT_HANDBALL/SPRINT_5M"
      ];
    expect(stored?.[0].id).not.toBe(stored?.[1].id);
  });

  it("leaves the values of another key unchanged", () => {
    const other = generatePerformanceTestValue({ id: "id-other" });
    usePerformanceTestValuesStore.setState({
      valuesByTest: { "SPORT_HANDBALL/FAKE_TEST_B": [other] },
    });

    usePerformanceTestValuesStore
      .getState()
      .addValue("SPORT_HANDBALL/SPRINT_5M", { date: "2026-03-01", value: 8.1 });

    expect(
      usePerformanceTestValuesStore.getState().valuesByTest[
        "SPORT_HANDBALL/FAKE_TEST_B"
      ],
    ).toEqual([other]);
  });

  it("clears every key on reset", () => {
    usePerformanceTestValuesStore.setState({
      valuesByTest: {
        "SPORT_HANDBALL/SPRINT_5M": [generatePerformanceTestValue()],
        "SPORT_HANDBALL/FAKE_TEST_B": [generatePerformanceTestValue()],
      },
    });

    usePerformanceTestValuesStore.getState().reset();

    expect(usePerformanceTestValuesStore.getState().valuesByTest).toEqual({});
  });
});
