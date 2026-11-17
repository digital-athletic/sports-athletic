import { generatePerformanceTestValue } from "@test/factories/performanceTestValue";
import { usePerformanceTestValuesStore } from "./performanceTestValuesStore";

describe("performanceTestValuesStore: entered values", () => {
  beforeEach(() => {
    usePerformanceTestValuesStore.setState({ values: [] });
  });

  it("stores the entry with its sport and test code", () => {
    usePerformanceTestValuesStore.getState().addValue({
      sport: "SPORT_HANDBALL",
      testCode: "SPRINT_5M",
      date: "2026-03-01",
      value: 8.1,
    });

    expect(usePerformanceTestValuesStore.getState().values).toEqual([
      {
        id: expect.any(String),
        sport: "SPORT_HANDBALL",
        testCode: "SPRINT_5M",
        date: "2026-03-01",
        value: 8.1,
      },
    ]);
  });

  it("appends a second entry after the first", () => {
    const first = generatePerformanceTestValue({ id: "id-first" });
    usePerformanceTestValuesStore.setState({ values: [first] });

    usePerformanceTestValuesStore.getState().addValue({
      sport: "SPORT_HANDBALL",
      testCode: "SPRINT_5M",
      date: "2026-03-05",
      value: 7.9,
    });

    const stored = usePerformanceTestValuesStore.getState().values;
    expect(stored).toHaveLength(2);
    expect(stored[0]).toEqual(first);
    expect(stored[1]).toMatchObject({ date: "2026-03-05", value: 7.9 });
  });

  it("generates a unique id for each entry", () => {
    const { addValue } = usePerformanceTestValuesStore.getState();
    const entry = {
      sport: "SPORT_HANDBALL",
      testCode: "SPRINT_5M",
      date: "2026-03-01",
      value: 8.1,
    } as const;

    addValue(entry);
    addValue(entry);

    const stored = usePerformanceTestValuesStore.getState().values;
    expect(stored[0].id).not.toBe(stored[1].id);
  });

  it("clears every value on reset", () => {
    usePerformanceTestValuesStore.setState({
      values: [
        generatePerformanceTestValue(),
        generatePerformanceTestValue({ testCode: "FAKE_TEST_B" }),
      ],
    });

    usePerformanceTestValuesStore.getState().reset();

    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
  });
});
