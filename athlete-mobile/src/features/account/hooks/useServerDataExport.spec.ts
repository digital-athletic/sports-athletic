import { Logger } from "@/services/Logger";
import type { ServerDataExport } from "@/services/PersonalDataService";
import { act, renderHook } from "@testing-library/react-native";
import { useServerDataExport } from "./useServerDataExport";

const mockFetchServerDataExport = jest.fn();
const mockShareJson = jest.fn();
const mockAlert = jest.fn();

jest.mock("@/services/PersonalDataService", () => ({
  fetchServerDataExport: (...args: unknown[]) =>
    mockFetchServerDataExport(...args),
}));

jest.mock("@/services/shareFile", () => ({
  shareJson: (...args: unknown[]) => mockShareJson(...args),
}));

jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/** The server data of an athlete without team or training, e.g. `{ account: { email: "athlete@example.com" } }`. */
const generateServerDataExport = (): ServerDataExport => ({
  exportedAt: "2026-11-18T09:00:00.000Z",
  account: { email: "athlete@example.com", createdAt: "2026-03-01T10:00:00Z" },
  profile: null,
  teamMemberDetails: null,
  teamMemberships: [],
  teamInvitations: [],
  workouts: [],
  strengthTests: [],
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Logger, "logError").mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useServerDataExport: download", () => {
  it("shares the server data as one indented JSON file", async () => {
    const data = generateServerDataExport();
    mockFetchServerDataExport.mockResolvedValue(data);
    const { result } = await renderHook(() => useServerDataExport());

    await act(async () => {
      await result.current.exportData();
    });

    const [fileName, json] = mockShareJson.mock.calls[0] as [string, string];
    expect(fileName).toMatch(/^personal-data_\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(json)).toEqual(data);
    expect(json).toContain('\n  "account"');
    expect(mockAlert).not.toHaveBeenCalled();
  });
});

describe("useServerDataExport: failures", () => {
  it("alerts an error without a session and shares nothing", async () => {
    mockFetchServerDataExport.mockResolvedValue(null);
    const { result } = await renderHook(() => useServerDataExport());

    await act(async () => {
      await result.current.exportData();
    });

    expect(mockShareJson).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith("common.error");
  });

  it("alerts an error and logs it when the server read fails", async () => {
    mockFetchServerDataExport.mockRejectedValue(new Error("team_members"));
    const { result } = await renderHook(() => useServerDataExport());

    await act(async () => {
      await result.current.exportData();
    });

    expect(mockShareJson).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith("common.error");
    expect(Logger.logError).toHaveBeenCalledWith(new Error("team_members"));
  });

  it("alerts an error and logs it when sharing fails", async () => {
    mockFetchServerDataExport.mockResolvedValue(generateServerDataExport());
    mockShareJson.mockRejectedValueOnce(new Error("share failed"));
    const { result } = await renderHook(() => useServerDataExport());

    await act(async () => {
      await result.current.exportData();
    });

    expect(mockAlert).toHaveBeenCalledWith("common.error");
    expect(Logger.logError).toHaveBeenCalledWith(new Error("share failed"));
  });

  it("fetches once when the export runs twice before the first ends", async () => {
    let finish: (data: ServerDataExport) => void = () => {};
    mockFetchServerDataExport.mockReturnValueOnce(
      new Promise<ServerDataExport>((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = await renderHook(() => useServerDataExport());

    let first: Promise<void> = Promise.resolve();
    await act(async () => {
      first = result.current.exportData();
      await result.current.exportData();
    });
    expect(result.current.isExporting).toBe(true);
    await act(async () => {
      finish(generateServerDataExport());
      await first;
    });

    expect(mockFetchServerDataExport).toHaveBeenCalledTimes(1);
    expect(result.current.isExporting).toBe(false);
  });
});
