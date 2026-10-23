import { Platform } from "react-native";
import {
  MAX_CUSTOM_WORKOUT_FILE_BYTES,
  pickCustomWorkoutFile,
} from "./pickCustomWorkoutFile";

const mockGetDocumentAsync = jest.fn();
const mockFileConstructor = jest.fn();
const mockFileText = jest.fn();
const mockFileDelete = jest.fn();

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}));

jest.mock("expo-file-system", () => ({
  File: function File(...args: unknown[]) {
    mockFileConstructor(...args);
    return { text: () => mockFileText(), delete: () => mockFileDelete() };
  },
}));

// e.g. { canceled: false, assets: [{ uri: "file:///cache/a.json", size: 120, name: "a.json" }] }
const generatePickedResult = (
  asset: {
    uri: string;
    size?: number;
    file?: { text: () => Promise<string> };
  } = {
    uri: "file:///cache/a.json",
    size: 120,
  },
) => ({ canceled: false, assets: [{ name: "a.json", ...asset }] });

describe("pickCustomWorkoutFile: native", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileText.mockResolvedValue('{"aiwl":1}');
  });

  it("returns canceled and reads no file when the picker is canceled", async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

    const result = await pickCustomWorkoutFile();

    expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "canceled" });
    expect(mockFileConstructor).not.toHaveBeenCalled();
  });

  it("returns the file text read from the picked uri", async () => {
    mockGetDocumentAsync.mockResolvedValue(generatePickedResult());

    const result = await pickCustomWorkoutFile();

    expect(mockFileConstructor).toHaveBeenCalledWith("file:///cache/a.json");
    expect(result).toEqual({ status: "picked", text: '{"aiwl":1}' });
  });

  it("opens the picker for one file of any type and copies it to the cache", async () => {
    mockGetDocumentAsync.mockResolvedValue(generatePickedResult());

    await pickCustomWorkoutFile();

    expect(mockGetDocumentAsync).toHaveBeenCalledWith({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
  });

  it("deletes the cached copy after reading it", async () => {
    mockGetDocumentAsync.mockResolvedValue(generatePickedResult());

    await pickCustomWorkoutFile();

    expect(mockFileDelete).toHaveBeenCalledTimes(1);
  });

  it("deletes the cached copy when reading it fails", async () => {
    mockGetDocumentAsync.mockResolvedValue(generatePickedResult());
    mockFileText.mockRejectedValue(new Error("read broke"));

    await pickCustomWorkoutFile();

    expect(mockFileDelete).toHaveBeenCalledTimes(1);
  });

  it("returns the file text when deleting the cached copy throws", async () => {
    mockGetDocumentAsync.mockResolvedValue(generatePickedResult());
    mockFileDelete.mockImplementationOnce(() => {
      throw new Error("delete broke");
    });

    const result = await pickCustomWorkoutFile();

    expect(result).toEqual({ status: "picked", text: '{"aiwl":1}' });
  });

  it("returns the file text when the asset size is exactly at the limit", async () => {
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({
        uri: "file:///cache/a.json",
        size: MAX_CUSTOM_WORKOUT_FILE_BYTES,
      }),
    );

    const result = await pickCustomWorkoutFile();

    expect(result).toEqual({ status: "picked", text: '{"aiwl":1}' });
  });

  it("returns the file text when the size is unknown and the text is exactly at the limit", async () => {
    const text = "x".repeat(MAX_CUSTOM_WORKOUT_FILE_BYTES);
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({ uri: "file:///cache/a.json" }),
    );
    mockFileText.mockResolvedValue(text);

    const result = await pickCustomWorkoutFile();

    expect(result).toEqual({ status: "picked", text });
  });

  it("returns TOO_LARGE when the size is unknown and multi byte text exceeds the limit in bytes", async () => {
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({ uri: "file:///cache/a.json" }),
    );
    // "ä" takes 2 bytes in UTF-8 but 1 UTF-16 unit, so the text length stays below the limit.
    mockFileText.mockResolvedValue(
      "ä".repeat(MAX_CUSTOM_WORKOUT_FILE_BYTES / 2 + 1),
    );

    const result = await pickCustomWorkoutFile();

    expect(result).toEqual({ status: "failed", reason: "TOO_LARGE" });
  });

  it("returns TOO_LARGE without reading when the asset size exceeds the limit", async () => {
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({
        uri: "file:///cache/a.json",
        size: 2 * MAX_CUSTOM_WORKOUT_FILE_BYTES,
      }),
    );

    const result = await pickCustomWorkoutFile();

    expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "failed", reason: "TOO_LARGE" });
    expect(mockFileText).not.toHaveBeenCalled();
  });

  it("deletes the cached copy when the asset size exceeds the limit", async () => {
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({
        uri: "file:///cache/a.json",
        size: 2 * MAX_CUSTOM_WORKOUT_FILE_BYTES,
      }),
    );

    await pickCustomWorkoutFile();

    expect(mockFileConstructor).toHaveBeenCalledWith("file:///cache/a.json");
    expect(mockFileDelete).toHaveBeenCalledTimes(1);
  });

  it("returns TOO_LARGE when the size is unknown and the text exceeds the limit", async () => {
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({ uri: "file:///cache/a.json" }),
    );
    mockFileText.mockResolvedValue(
      "x".repeat(MAX_CUSTOM_WORKOUT_FILE_BYTES + 1),
    );

    const result = await pickCustomWorkoutFile();

    expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "failed", reason: "TOO_LARGE" });
  });

  it("returns READ_FAILED when the picker rejects", async () => {
    mockGetDocumentAsync.mockRejectedValue(new Error("picker broke"));

    const result = await pickCustomWorkoutFile();

    expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "failed", reason: "READ_FAILED" });
  });

  it("returns READ_FAILED when reading the file text rejects", async () => {
    mockGetDocumentAsync.mockResolvedValue(generatePickedResult());
    mockFileText.mockRejectedValue(new Error("read broke"));

    const result = await pickCustomWorkoutFile();

    expect(mockFileConstructor).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "failed", reason: "READ_FAILED" });
  });

  it("calls the picker synchronously before any await", () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

    void pickCustomWorkoutFile();

    expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1);
  });
});

describe("pickCustomWorkoutFile: web", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, "OS", "web");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reads the text from the asset file and builds no File", async () => {
    const text = jest.fn().mockResolvedValue('{"aiwl":1}');
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({ uri: "blob:a", size: 120, file: { text } }),
    );

    const result = await pickCustomWorkoutFile();

    expect(text).toHaveBeenCalledTimes(1);
    expect(mockFileConstructor).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "picked", text: '{"aiwl":1}' });
  });

  it("returns TOO_LARGE when the size is unknown and the text exceeds the limit", async () => {
    const text = jest
      .fn()
      .mockResolvedValue("x".repeat(MAX_CUSTOM_WORKOUT_FILE_BYTES + 1));
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({ uri: "blob:a", file: { text } }),
    );

    const result = await pickCustomWorkoutFile();

    expect(result).toEqual({ status: "failed", reason: "TOO_LARGE" });
  });

  it("returns READ_FAILED when the asset has no file", async () => {
    mockGetDocumentAsync.mockResolvedValue(
      generatePickedResult({ uri: "blob:a", size: 120 }),
    );

    const result = await pickCustomWorkoutFile();

    expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "failed", reason: "READ_FAILED" });
  });

  it("calls the picker synchronously before any await", () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

    void pickCustomWorkoutFile();

    expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1);
  });
});
