import { Platform } from "react-native";
import { shareCsv } from "./shareCsv";

const mockFile = {
  exists: false,
  uri: "file:///cache/export.csv",
  delete: jest.fn(),
  create: jest.fn(),
  write: jest.fn(),
};
const mockFileConstructor = jest.fn();
const mockShareAsync = jest.fn();
const mockIsAvailableAsync = jest.fn();

jest.mock("expo-file-system", () => ({
  File: function File(...args: unknown[]) {
    mockFileConstructor(...args);
    return mockFile;
  },
  Paths: { cache: "cache-dir" },
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: () => mockIsAvailableAsync(),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

describe("shareCsv: native", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFile.exists = false;
    mockIsAvailableAsync.mockResolvedValue(true);
  });

  it("writes the cache file and opens the share sheet", async () => {
    await shareCsv("workouts_total_2026-01-01.csv", "csv content");

    expect(mockFileConstructor).toHaveBeenCalledWith(
      "cache-dir",
      "workouts_total_2026-01-01.csv",
    );
    expect(mockFile.create).toHaveBeenCalled();
    expect(mockFile.write).toHaveBeenCalledWith("csv content");
    expect(mockShareAsync).toHaveBeenCalledWith("file:///cache/export.csv", {
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
    });
  });

  it("replaces an existing cache file", async () => {
    mockFile.exists = true;

    await shareCsv("a.csv", "x");

    expect(mockFile.delete).toHaveBeenCalled();
    expect(mockFile.create).toHaveBeenCalled();
  });

  it("throws when sharing is unavailable", async () => {
    mockIsAvailableAsync.mockResolvedValue(false);

    await expect(shareCsv("a.csv", "x")).rejects.toThrow(
      "Sharing is not available",
    );
    expect(mockShareAsync).not.toHaveBeenCalled();
  });
});

describe("shareCsv: web", () => {
  const anchor = { href: "", download: "", click: jest.fn() };
  const appendChild = jest.fn();
  const removeChild = jest.fn();
  const createObjectURL = jest.fn((_blob: Blob) => "blob:export");
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, "OS", "web");
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: jest.fn(() => anchor),
        body: { appendChild, removeChild },
      },
    });
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "document");
  });

  it("downloads a text csv blob through an anchor", async () => {
    await shareCsv("strength-tests_year_2026-01-01.csv", "csv content");

    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("text/csv;charset=utf-8");
    expect(anchor.download).toBe("strength-tests_year_2026-01-01.csv");
    expect(anchor.href).toBe("blob:export");
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(removeChild).toHaveBeenCalledWith(anchor);
  });

  it("revokes the object URL after the click and skips the native share sheet", async () => {
    jest.useFakeTimers();
    await shareCsv("a.csv", "x");

    expect(revokeObjectURL).not.toHaveBeenCalled();
    jest.runAllTimers();
    jest.useRealTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:export");
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(mockFile.write).not.toHaveBeenCalled();
  });
});
