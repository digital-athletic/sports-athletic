import { fetchSportTests } from "./SportTestService";

const mockGetSession = jest.fn();
const mockOrder = jest.fn();
const mockEqRegion = jest.fn((_column: string, _value: string) => ({
  order: mockOrder,
}));
const mockEqSport = jest.fn((_column: string, _value: string) => ({
  eq: mockEqRegion,
}));
const mockSelect = jest.fn((_columns: string) => ({ eq: mockEqSport }));
const mockFrom = jest.fn((_table: string) => ({ select: mockSelect }));

jest.mock("./supabaseClient", () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    from: (table: string) => mockFrom(table),
  },
}));

/**
 * A sport_tests row as Supabase returns it, e.g.
 * { id: "test-1", code: "FAKE_TEST", unit: "s", sport_test_reference_values: [{ gender: "FEMALE", position: "WING", training_stage: "GRUNDLAGENTRAINING", range_start: "1.25", range_end: 1.15 }] }
 */
const generateSportTestRow = (
  rangeStart: string | number,
  rangeEnd: string | number,
) => ({
  id: "test-1",
  code: "FAKE_TEST",
  unit: "s",
  sport_test_reference_values: [
    {
      gender: "FEMALE",
      position: "WING",
      training_stage: "GRUNDLAGENTRAINING",
      range_start: rangeStart,
      range_end: rangeEnd,
    },
  ],
});

const signedIn = () =>
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: "user-1" }, access_token: "tok" } },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchSportTests: no session", () => {
  it("returns an empty list and sends no query", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const tests = await fetchSportTests("HANDBALL_SPORT");

    expect(tests).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("fetchSportTests: mapping", () => {
  it("maps snake_case rows with numeric strings to numbers", async () => {
    signedIn();
    mockOrder.mockResolvedValue({
      data: [generateSportTestRow("1.25", "1.15")],
      error: null,
    });

    const tests = await fetchSportTests("HANDBALL_SPORT");

    expect(tests).toEqual([
      {
        id: "test-1",
        code: "FAKE_TEST",
        unit: "s",
        referenceValues: [
          {
            gender: "FEMALE",
            position: "WING",
            trainingStage: "GRUNDLAGENTRAINING",
            rangeStart: 1.25,
            rangeEnd: 1.15,
          },
        ],
      },
    ]);
  });

  it("keeps numeric values that already arrive as numbers", async () => {
    signedIn();
    mockOrder.mockResolvedValue({
      data: [generateSportTestRow(1.25, 1.15)],
      error: null,
    });

    const tests = await fetchSportTests("HANDBALL_SPORT");

    expect(tests[0].referenceValues[0]).toMatchObject({
      rangeStart: 1.25,
      rangeEnd: 1.15,
    });
  });

  it("returns an empty list when the sport has no tests", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: [], error: null });

    const tests = await fetchSportTests("HANDBALL_SPORT");

    expect(tests).toEqual([]);
  });
});

describe("fetchSportTests: filters", () => {
  it("reads the sport_tests table", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: [], error: null });

    await fetchSportTests("HANDBALL_SPORT");

    expect(mockFrom).toHaveBeenCalledWith("sport_tests");
  });

  it("filters by the given sport", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: [], error: null });

    await fetchSportTests("HANDBALL_SPORT");

    expect(mockEqSport).toHaveBeenCalledWith("sport", "HANDBALL_SPORT");
  });

  it("filters by region DE when no region is given", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: [], error: null });

    await fetchSportTests("HANDBALL_SPORT");

    expect(mockEqRegion).toHaveBeenCalledWith("region", "DE");
  });

  it("filters by the given region", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: [], error: null });

    await fetchSportTests("HANDBALL_SPORT", "FAKE_REGION");

    expect(mockEqRegion).toHaveBeenCalledWith("region", "FAKE_REGION");
  });
});

describe("fetchSportTests: errors", () => {
  it("throws when Supabase returns an error", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

    await expect(fetchSportTests("HANDBALL_SPORT")).rejects.toThrow("DB error");
  });
});
