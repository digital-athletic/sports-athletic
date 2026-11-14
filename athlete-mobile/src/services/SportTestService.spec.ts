import { fetchSportTests } from "./SportTestService";

const mockGetSession = jest.fn();
const mockOrder = jest.fn();
const mockEqRegion = jest.fn((_column: string, _value: string) => ({
  order: mockOrder,
}));
const mockSelect = jest.fn((_columns: string) => ({ eq: mockEqRegion }));
const mockFrom = jest.fn((_table: string) => ({ select: mockSelect }));

jest.mock("./supabaseClient", () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    from: (table: string) => mockFrom(table),
  },
}));

/**
 * A sport_tests row as Supabase returns it, e.g.
 * { id: "test-1", sport: "SPORT_HANDBALL", code: "FAKE_TEST", unit: "s", sport_test_reference_values: [{ gender: "FEMALE", position: "WING", training_stage: "GRUNDLAGENTRAINING", range_start: "9.87", range_end: 6.54 }] }
 */
const generateSportTestRow = (
  rangeStart: string | number,
  rangeEnd: string | number,
) => ({
  id: "test-1",
  sport: "SPORT_HANDBALL",
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

// Supabase answers getSession with a session, as for a signed in athlete.
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

    const tests = await fetchSportTests("SPORT_HANDBALL");

    expect(tests).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("fetchSportTests: mapping", () => {
  it("maps snake_case rows with numeric strings to numbers", async () => {
    signedIn();
    mockOrder.mockResolvedValue({
      data: [generateSportTestRow("9.87", "6.54")],
      error: null,
    });

    const tests = await fetchSportTests("SPORT_HANDBALL");

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
            rangeStart: 9.87,
            rangeEnd: 6.54,
          },
        ],
      },
    ]);
  });

  it("accepts range values that arrive as numbers", async () => {
    signedIn();
    mockOrder.mockResolvedValue({
      data: [generateSportTestRow(9.87, 6.54)],
      error: null,
    });

    const tests = await fetchSportTests("SPORT_HANDBALL");

    expect(tests[0].referenceValues[0]).toMatchObject({
      rangeStart: 9.87,
      rangeEnd: 6.54,
    });
  });

  it("returns an empty list when the sport has no tests", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: [], error: null });

    const tests = await fetchSportTests("SPORT_HANDBALL");

    expect(tests).toEqual([]);
  });
});

describe("fetchSportTests: filters", () => {
  it("reads the tests of region DE by default", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: [], error: null });

    await fetchSportTests("SPORT_HANDBALL");

    expect(mockFrom).toHaveBeenCalledWith("sport_tests");
    expect(mockEqRegion).toHaveBeenCalledWith("region", "DE");
  });

  it("filters by the given region", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: [], error: null });

    await fetchSportTests("SPORT_HANDBALL", "FAKE_REGION");

    expect(mockEqRegion).toHaveBeenCalledWith("region", "FAKE_REGION");
  });
});

describe("fetchSportTests: consolidated values", () => {
  it("maps codes in another case or with padding to the upper case codes of the app", async () => {
    signedIn();
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "test-1",
          sport: " sport_handball ",
          code: " fake_test ",
          unit: " s ",
          sport_test_reference_values: [
            {
              gender: "female",
              position: " Wing",
              training_stage: "grundlagentraining ",
              range_start: "9.87",
              range_end: "6.54",
            },
          ],
        },
      ],
      error: null,
    });

    const tests = await fetchSportTests("SPORT_HANDBALL");

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
            rangeStart: 9.87,
            rangeEnd: 6.54,
          },
        ],
      },
    ]);
  });

  it("leaves out the tests of another sport", async () => {
    signedIn();
    mockOrder.mockResolvedValue({
      data: [
        { ...generateSportTestRow("9.87", "6.54"), sport: "SPORT_FOOTBALL" },
      ],
      error: null,
    });

    const tests = await fetchSportTests("SPORT_HANDBALL");

    expect(tests).toEqual([]);
  });

  it("leaves out a reference value with an unknown gender", async () => {
    signedIn();
    const row = generateSportTestRow("9.87", "6.54");
    mockOrder.mockResolvedValue({
      data: [
        {
          ...row,
          sport_test_reference_values: [
            { ...row.sport_test_reference_values[0], gender: "FAKE_GENDER" },
          ],
        },
      ],
      error: null,
    });

    const tests = await fetchSportTests("SPORT_HANDBALL");

    expect(tests[0].referenceValues).toEqual([]);
  });
});

describe("fetchSportTests: errors", () => {
  it("throws when Supabase returns an error", async () => {
    signedIn();
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

    await expect(fetchSportTests("SPORT_HANDBALL")).rejects.toThrow("DB error");
  });
});
