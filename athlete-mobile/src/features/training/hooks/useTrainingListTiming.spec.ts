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

  it("counts time on the list before an exercise opens as pause", () => {
    const { result } = renderHook(() => useTrainingListTiming());

    advanceClock(4000);
    act(() => {
      result.current.startExercise("SWR1");
    });

    expect(useTrainingStore.getState().time.pause).toBe(4000);
  });

  it("counts time with a sheet open toward the exercise focus area", () => {
    const { result } = renderHook(() => useTrainingListTiming());

    act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(30000);
    act(() => {
      result.current.endExercise();
    });

    expect(useTrainingStore.getState().time.skill.SWR).toBe(30000);
  });

  it("counts a dismiss reported twice only once", () => {
    const { result } = renderHook(() => useTrainingListTiming());

    act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(30000);
    act(() => {
      result.current.endExercise();
    });
    advanceClock(5000);
    act(() => {
      result.current.endExercise();
    });

    expect(useTrainingStore.getState().time.skill.SWR).toBe(30000);
  });

  it("counts time on the list after the last exercise as pause when finishing", () => {
    const { result } = renderHook(() => useTrainingListTiming());

    act(() => {
      result.current.startExercise("SWR1");
    });
    advanceClock(30000);
    act(() => {
      result.current.endExercise();
    });
    advanceClock(6000);
    act(() => {
      result.current.endPause();
    });

    const { time } = useTrainingStore.getState();
    expect(time.pause).toBe(6000);
    expect(time.skill.SWR).toBe(30000);
  });
});
