import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { Logger } from "@/services/Logger";
import { useAuthStore } from "@/store/authStore";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { act, renderHook } from "@testing-library/react-native";
import { useStatisticsExport } from "./useStatisticsExport";

const mockShareCsv = jest.fn();
const mockAlert = jest.fn();

jest.mock("@/features/statistics/services/shareCsv", () => ({
  shareCsv: (...args: unknown[]) => mockShareCsv(...args),
}));

jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const DAY = 1000 * 60 * 60 * 24;

const addWorkout = (id: string, timestamp: number, duration = 600): void => {
  useCompletedWorkoutsStore.getState().addCompletedWorkout({
    id,
    timestamp,
    exercises: [],
    duration,
  });
};

describe("useStatisticsExport: workouts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger, "logError").mockResolvedValue(undefined);
    act(() => {
      useAuthStore.setState({ auth: { userId: "u1" } });
      useCompletedWorkoutsStore.getState().clearWorkoutHistory();
      useExerciseProgressStore.setState({ testHistory: [] });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    act(() => {
      useAuthStore.setState({ auth: null });
    });
  });

  it("cannot export without rows", () => {
    const { result } = renderHook(() =>
      useStatisticsExport({ kind: "workouts", scale: "total" }),
    );

    expect(result.current.canExport).toBe(false);
  });

  it("refuses without a logged in user", async () => {
    addWorkout("w1", Date.now() - DAY);
    act(() => {
      useAuthStore.setState({ auth: null });
    });
    const { result } = renderHook(() =>
      useStatisticsExport({ kind: "workouts", scale: "total" }),
    );

    expect(result.current.canExport).toBe(false);
    await act(async () => {
      await result.current.exportCsv();
    });

    expect(mockShareCsv).not.toHaveBeenCalled();
  });

  it("exports only the workouts of the selected range, oldest first", async () => {
    addWorkout("old", Date.now() - 60 * DAY);
    addWorkout("mid", Date.now() - 3 * DAY, 1800);
    addWorkout("new", Date.now() - DAY, 900);
    const { result } = renderHook(() =>
      useStatisticsExport({ kind: "workouts", scale: "week" }),
    );

    expect(result.current.canExport).toBe(true);
    await act(async () => {
      await result.current.exportCsv();
    });

    expect(mockShareCsv).toHaveBeenCalledTimes(1);
    const [fileName, csv] = mockShareCsv.mock.calls[0] as [string, string];
    expect(fileName).toMatch(/^workouts_week_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe(
      "statistics.export.headers.date,statistics.export.headers.durationMinutes,statistics.export.headers.exerciseCount,statistics.export.headers.xp,statistics.export.headers.movedWeightKg",
    );
    expect(lines).toHaveLength(4);
    expect(lines[1]).toMatch(/,30,0,0,0$/);
    expect(lines[2]).toMatch(/,15,0,0,0$/);
    expect(lines[3]).toBe("");
  });

  it("shares once when the export runs twice before the first ends", async () => {
    addWorkout("w1", Date.now() - DAY);
    let finish: () => void = () => {};
    mockShareCsv.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = renderHook(() =>
      useStatisticsExport({ kind: "workouts", scale: "total" }),
    );

    let first: Promise<void> = Promise.resolve();
    await act(async () => {
      first = result.current.exportCsv();
      await result.current.exportCsv();
    });
    await act(async () => {
      finish();
      await first;
    });

    expect(mockShareCsv).toHaveBeenCalledTimes(1);
  });

  it("alerts with the common error when sharing fails", async () => {
    addWorkout("w1", Date.now() - DAY);
    mockShareCsv.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() =>
      useStatisticsExport({ kind: "workouts", scale: "total" }),
    );

    await act(async () => {
      await result.current.exportCsv();
    });

    expect(mockAlert).toHaveBeenCalledWith("common.error");
    expect(result.current.isExporting).toBe(false);
  });
});

describe("useStatisticsExport: strength tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.setState({ auth: { userId: "u1" } });
      useCompletedWorkoutsStore.getState().clearWorkoutHistory();
      useExerciseProgressStore.setState({
        testHistory: [
          {
            ...DEFAULT_MAX_VALUES,
            testAt: Date.now() - 100 * DAY,
            kneeDominant: { barbell: 50 },
          },
          {
            ...DEFAULT_MAX_VALUES,
            testAt: Date.now() - DAY,
            kneeDominant: { barbell: 100 },
          },
        ],
      });
    });
  });

  afterEach(() => {
    act(() => {
      useAuthStore.setState({ auth: null });
      useExerciseProgressStore.setState({ testHistory: [] });
    });
  });

  it("exports the strength tests of the range with empty cells for gaps", async () => {
    const { result } = renderHook(() =>
      useStatisticsExport({ kind: "strength-tests", scale: "month" }),
    );

    expect(result.current.canExport).toBe(true);
    await act(async () => {
      await result.current.exportCsv();
    });

    const [fileName, csv] = mockShareCsv.mock.calls[0] as [string, string];
    expect(fileName).toMatch(/^strength-tests_month_\d{4}-\d{2}-\d{2}\.csv$/);
    const lines = csv.slice(1).split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatch(/,100,,,,$/);
  });

  it("ignores workouts when the strength test tab is active", () => {
    addWorkout("w1", Date.now() - DAY);
    act(() => {
      useExerciseProgressStore.setState({ testHistory: [] });
    });
    const { result } = renderHook(() =>
      useStatisticsExport({ kind: "strength-tests", scale: "total" }),
    );

    expect(result.current.canExport).toBe(false);
  });
});
