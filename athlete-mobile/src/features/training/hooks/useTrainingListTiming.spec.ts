import { act, renderHook } from "@testing-library/react-native";
import { useTrainingStore } from "../trainingStore";
import { useTrainingListTiming } from "./useTrainingListTiming";

const advanceClock = (ms: number) => {
  jest.setSystemTime(Date.now() + ms);
};

describe("useTrainingListTiming", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useTrainingStore.getState().clearTraining();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts time on the list before an exercise opens as pause", async () => {
    const { result } = await renderHook(() => useTrainingListTiming());

    advanceClock(4000);
    await act(() => {
      result.current.startExercise("SWR1");
    });

    expect(useTrainingStore.getState().time.pause).toBe(4000);
  });

  it("counts time with a sheet open toward the exercise focus area", async () => {
    const { result } = await renderHook(() => useTrainingListTiming());

    await act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(30000);
    await act(() => {
      result.current.endExercise();
    });

    expect(useTrainingStore.getState().time.skill.SWR).toBe(30000);
  });

  it("counts a dismiss reported twice only once", async () => {
    const { result } = await renderHook(() => useTrainingListTiming());

    await act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(30000);
    await act(() => {
      result.current.endExercise();
    });
    advanceClock(5000);
    await act(() => {
      result.current.endExercise();
    });

    expect(useTrainingStore.getState().time.skill.SWR).toBe(30000);
  });

  it("counts time on the list after the last exercise as pause when finishing", async () => {
    const { result } = await renderHook(() => useTrainingListTiming());

    await act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(30000);
    await act(() => {
      result.current.endExercise();
    });
    advanceClock(6000);
    await act(() => {
      result.current.endPause();
    });

    const { time } = useTrainingStore.getState();
    expect(time.pause).toBe(6000);
    expect(time.skill.SWR).toBe(30000);
  });

  it("counts only the time the set timer runs toward the focus area", async () => {
    const { result } = await renderHook(() => useTrainingListTiming());

    await act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(10000);
    await act(() => {
      result.current.pauseExercise();
    });
    advanceClock(20000);
    await act(() => {
      result.current.resumeExercise();
    });
    advanceClock(5000);
    await act(() => {
      result.current.endExercise();
    });

    const { time } = useTrainingStore.getState();
    expect(time.skill.SWR).toBe(15000);
    expect(time.pause).toBe(0);
  });

  it("counts only the time before the pause when the sheet closes while paused", async () => {
    const { result } = await renderHook(() => useTrainingListTiming());

    await act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(10000);
    await act(() => {
      result.current.pauseExercise();
    });
    advanceClock(20000);
    await act(() => {
      result.current.endExercise();
    });

    const { time } = useTrainingStore.getState();
    expect(time.skill.SWR).toBe(10000);
    expect(time.pause).toBe(0);
  });

  it("ignores a second pause and a second resume", async () => {
    const { result } = await renderHook(() => useTrainingListTiming());

    await act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(10000);
    await act(() => {
      result.current.pauseExercise();
    });
    advanceClock(20000);
    await act(() => {
      result.current.pauseExercise();
      result.current.resumeExercise();
    });
    advanceClock(5000);
    await act(() => {
      result.current.resumeExercise();
    });
    advanceClock(5000);
    await act(() => {
      result.current.endExercise();
    });

    expect(useTrainingStore.getState().time.skill.SWR).toBe(20000);
  });
});
