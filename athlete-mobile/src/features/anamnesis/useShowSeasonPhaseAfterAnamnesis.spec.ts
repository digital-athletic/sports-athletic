import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { renderHook } from "@testing-library/react-native";
import { useShowSeasonPhaseAfterAnamnesis } from "./useShowSeasonPhaseAfterAnamnesis";

// generatePlanWithWeeks(8) starts on 3 August and its last day is 27 September, before the test day.
const generatePlanWithWeeks = (numOfWeeks: number) =>
  ({
    start: "2026-08-03",
    sections: [{ start: "2026-08-03", numOfWeeks }],
  }) as unknown as TrainingPlanType;

describe("useShowSeasonPhaseAfterAnamnesis", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 12, 10) });
    useTrainingScheduleStore.setState({
      trainingDays: [{ active: true } as TrainingDayType],
    });
    useUserWorkoutStore.getState().setSeasonPhase({
      type: SeasonPhase.COMPETITION,
      endDate: "2026-09-28",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("skips the season phase while the plan still runs", async () => {
    useUserWorkoutStore.setState({ trainingPlan: generatePlanWithWeeks(12) });

    const { result } = await renderHook(() =>
      useShowSeasonPhaseAfterAnamnesis(),
    );

    expect(result.current).toBe(false);
  });

  it("asks for the season phase after the plan has ended", async () => {
    useUserWorkoutStore.setState({ trainingPlan: generatePlanWithWeeks(8) });

    const { result } = await renderHook(() =>
      useShowSeasonPhaseAfterAnamnesis(),
    );

    expect(result.current).toBe(true);
  });

  it("asks for the season phase without an active training day", async () => {
    useUserWorkoutStore.setState({ trainingPlan: generatePlanWithWeeks(12) });
    useTrainingScheduleStore.setState({
      trainingDays: [{ active: false } as TrainingDayType],
    });

    const { result } = await renderHook(() =>
      useShowSeasonPhaseAfterAnamnesis(),
    );

    expect(result.current).toBe(true);
  });
});
