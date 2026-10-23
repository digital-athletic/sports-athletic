import { act, renderHook } from "@testing-library/react-native";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { type PickedCustomWorkoutFile } from "./pickCustomWorkoutFile";
import { useImportCustomWorkout } from "./useImportCustomWorkout";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockAlert = jest.fn();
jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

const mockLogError = jest.fn();
jest.mock("@/services/Logger", () => ({
  Logger: { logError: (...args: unknown[]) => mockLogError(...args) },
}));

const mockPickCustomWorkoutFile = jest.fn();
jest.mock("./pickCustomWorkoutFile", () => ({
  pickCustomWorkoutFile: () => mockPickCustomWorkoutFile(),
}));

const ERROR_TITLE = "screens.home.additionalTrainings.importErrorTitle";
const INVALID_FORMAT =
  "screens.home.additionalTrainings.importError.invalidFormat";
const UNSUPPORTED_CONTENT =
  "screens.home.additionalTrainings.importError.unsupportedContent";
const READ_FAILED = "screens.home.additionalTrainings.importError.readFailed";

// e.g. '{"aiwl":1,"id":"MY_CORE","name":{"en":"Core"},"blocks":[{"kind":"picks","skill":"GKS","picks":[{"tags":[],"count":2}]}]}'
const generateTemplateText = (
  overrides: { id?: string; name?: string; blocks?: unknown[] } = {},
): string =>
  JSON.stringify({
    aiwl: 1,
    id: overrides.id ?? "MY_CORE",
    name: { en: overrides.name ?? "Core", de: "Rumpf" },
    blocks: overrides.blocks ?? [
      { kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] },
    ],
  });

// e.g. { status: "picked", text: "{...}" }
const generatePicked = (text: string): PickedCustomWorkoutFile => ({
  status: "picked",
  text,
});

// e.g. [{ id: "custom-abc", teamId: null, importedAt: 1, template: { id: "MY_CORE", ... } }]
const readOwnWorkouts = () =>
  Object.values(useCustomWorkoutsStore.getState().workoutsById);

// e.g. runImport({ status: "canceled" }) renders the hook and awaits one import of that picker result
const runImport = async (picked: PickedCustomWorkoutFile) => {
  mockPickCustomWorkoutFile.mockResolvedValue(picked);
  const { result } = renderHook(() => useImportCustomWorkout());
  await act(async () => {
    await result.current.importCustomWorkout();
  });
};

describe("useImportCustomWorkout: saving", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
  });

  it("saves a valid file as an own training without an alert", async () => {
    await runImport(generatePicked(generateTemplateText()));

    expect(mockPickCustomWorkoutFile).toHaveBeenCalledTimes(1);
    expect(readOwnWorkouts()).toHaveLength(1);
    expect(readOwnWorkouts()[0].teamId).toBeNull();
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("replaces the entry and keeps its app id when the same file id is imported again", async () => {
    await runImport(generatePicked(generateTemplateText({ name: "Core" })));
    const firstAppId = readOwnWorkouts()[0].id;

    await runImport(generatePicked(generateTemplateText({ name: "Core v2" })));

    expect(readOwnWorkouts()).toHaveLength(1);
    expect(readOwnWorkouts()[0].id).toBe(firstAppId);
    expect(readOwnWorkouts()[0].template.name.en).toBe("Core v2");
  });
});

describe("useImportCustomWorkout: failures", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
  });

  it("alerts invalid format for text that is not JSON", async () => {
    await runImport(generatePicked("{ not json"));

    expect(mockPickCustomWorkoutFile).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(ERROR_TITLE, INVALID_FORMAT, [
      { text: "common.ok" },
    ]);
    expect(readOwnWorkouts()).toHaveLength(0);
  });

  it("alerts invalid format for JSON that fails the schema", async () => {
    await runImport(generatePicked(JSON.stringify({ aiwl: 2, id: "X" })));

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(ERROR_TITLE, INVALID_FORMAT, [
      { text: "common.ok" },
    ]);
    expect(readOwnWorkouts()).toHaveLength(0);
  });

  it("alerts unsupported content for an unknown skill", async () => {
    await runImport(
      generatePicked(
        generateTemplateText({
          blocks: [
            { kind: "picks", skill: "NOPE", picks: [{ tags: [], count: 2 }] },
          ],
        }),
      ),
    );

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(ERROR_TITLE, UNSUPPORTED_CONTENT, [
      { text: "common.ok" },
    ]);
    expect(readOwnWorkouts()).toHaveLength(0);
  });

  it("alerts unsupported content for a duration block", async () => {
    await runImport(
      generatePicked(
        generateTemplateText({
          blocks: [{ kind: "duration", skill: "GKS", duration: 30 }],
        }),
      ),
    );

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(ERROR_TITLE, UNSUPPORTED_CONTENT, [
      { text: "common.ok" },
    ]);
    expect(readOwnWorkouts()).toHaveLength(0);
  });

  it("alerts the read failure when the file cannot be read", async () => {
    await runImport({ status: "failed", reason: "READ_FAILED" });

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(ERROR_TITLE, READ_FAILED, [
      { text: "common.ok" },
    ]);
    expect(readOwnWorkouts()).toHaveLength(0);
  });

  it("alerts the read failure when the file is too large", async () => {
    await runImport({ status: "failed", reason: "TOO_LARGE" });

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(ERROR_TITLE, READ_FAILED, [
      { text: "common.ok" },
    ]);
    expect(readOwnWorkouts()).toHaveLength(0);
  });

  it("logs the reason when the file cannot be read", async () => {
    await runImport({ status: "failed", reason: "READ_FAILED" });

    expect(mockLogError).toHaveBeenCalledWith(
      new Error("Custom workout import: READ_FAILED"),
    );
  });

  it("logs nothing when the file content is invalid", async () => {
    await runImport(generatePicked("{ not json"));

    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("reports importing as false after a read failure", async () => {
    mockPickCustomWorkoutFile.mockResolvedValue({
      status: "failed",
      reason: "READ_FAILED",
    });
    const { result } = renderHook(() => useImportCustomWorkout());

    await act(async () => {
      await result.current.importCustomWorkout();
    });

    expect(result.current.importing).toBe(false);
  });

  it("reports importing as false after an invalid file", async () => {
    mockPickCustomWorkoutFile.mockResolvedValue(generatePicked("{ not json"));
    const { result } = renderHook(() => useImportCustomWorkout());

    await act(async () => {
      await result.current.importCustomWorkout();
    });

    expect(result.current.importing).toBe(false);
  });

  it("does nothing when the picker is canceled", async () => {
    await runImport({ status: "canceled" });

    expect(mockPickCustomWorkoutFile).toHaveBeenCalledTimes(1);
    expect(mockAlert).not.toHaveBeenCalled();
    expect(readOwnWorkouts()).toHaveLength(0);
  });
});

describe("useImportCustomWorkout: running state", () => {
  let resolvePicker: (picked: PickedCustomWorkoutFile) => void = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
    mockPickCustomWorkoutFile.mockImplementation(
      () =>
        new Promise<PickedCustomWorkoutFile>((resolve) => {
          resolvePicker = resolve;
        }),
    );
  });

  it("reports importing while the picker is pending and not after", async () => {
    const { result } = renderHook(() => useImportCustomWorkout());
    expect(result.current.importing).toBe(false);

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.importCustomWorkout();
    });
    expect(mockPickCustomWorkoutFile).toHaveBeenCalledTimes(1);
    expect(result.current.importing).toBe(true);

    await act(async () => {
      resolvePicker({ status: "canceled" });
      await running;
    });

    expect(result.current.importing).toBe(false);
  });

  it("opens the picker once when called twice while one import runs", async () => {
    const { result } = renderHook(() => useImportCustomWorkout());

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.importCustomWorkout();
      void result.current.importCustomWorkout();
    });
    expect(mockPickCustomWorkoutFile).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePicker({ status: "canceled" });
      await running;
    });
  });

  it("opens the picker again after the first import finished", async () => {
    const { result } = renderHook(() => useImportCustomWorkout());

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.importCustomWorkout();
    });
    await act(async () => {
      resolvePicker({ status: "canceled" });
      await running;
    });

    act(() => {
      void result.current.importCustomWorkout();
    });

    expect(mockPickCustomWorkoutFile).toHaveBeenCalledTimes(2);
  });
});
