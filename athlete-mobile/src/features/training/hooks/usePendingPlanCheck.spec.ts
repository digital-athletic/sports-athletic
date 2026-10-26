import PlanGenerator from "@/features/training/generators/PlanGenerator";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import * as storedPlanCheck from "@/features/training/utils/storedPlanCheck";
import { useAuthStore } from "@/store/authStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { renderHook, waitFor } from "@testing-library/react-native";
import { usePendingPlanCheck } from "./usePendingPlanCheck";

const storedPlan = { start: "2026-10-05", sections: [] } as TrainingPlanType;
const regeneratedPlan = {
  start: "2026-10-05",
  sections: [
    { start: "2026-10-05", numOfWeeks: 4, type: "SWR1", trainings: [] },
  ],
} as unknown as TrainingPlanType;

const markedPlan = (plan: TrainingPlanType = storedPlan) =>
  useUserWorkoutStore.setState({ planCheckPending: true, trainingPlan: plan });

const checkFinished = () =>
  waitFor(() =>
    expect(useUserWorkoutStore.getState().planCheckPending).toBe(false),
  );

describe("usePendingPlanCheck", () => {
  let generatePlan: jest.SpyInstance;
  let isBroken: jest.SpyInstance;

  beforeEach(() => {
    generatePlan = jest
      .spyOn(PlanGenerator, "generatePlan")
      .mockReturnValue(regeneratedPlan);
    isBroken = jest
      .spyOn(storedPlanCheck, "isStoredPlanBroken")
      .mockReturnValue(true);
    useAuthStore.setState({ auth: { userId: "athlete" } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("regenerates a marked plan that is broken", async () => {
    markedPlan();
    await renderHook(() => usePendingPlanCheck());
    await checkFinished();
    expect(useUserWorkoutStore.getState().trainingPlan).toBe(regeneratedPlan);
  });

  it("keeps a marked plan that is not broken", async () => {
    isBroken.mockReturnValue(false);
    markedPlan();
    await renderHook(() => usePendingPlanCheck());
    await checkFinished();
    expect(generatePlan).not.toHaveBeenCalled();
  });

  it("regenerates a broken plan whose start date holds a time", async () => {
    markedPlan({ ...storedPlan, start: "2026-10-05T00:00:00.000Z" });
    await renderHook(() => usePendingPlanCheck());
    await checkFinished();
    expect(useUserWorkoutStore.getState().trainingPlan).toBe(regeneratedPlan);
  });

  it("keeps the stored plan when regeneration fails", async () => {
    generatePlan.mockImplementation(() => {
      throw new Error("plan creation failed");
    });
    markedPlan();
    await renderHook(() => usePendingPlanCheck());
    await checkFinished();
    expect(useUserWorkoutStore.getState().trainingPlan).toBe(storedPlan);
  });

  it("checks nothing when no plan is marked", async () => {
    useUserWorkoutStore.setState({
      planCheckPending: false,
      trainingPlan: storedPlan,
    });
    await renderHook(() => usePendingPlanCheck());
    await waitFor(() =>
      expect(useUserWorkoutStore.persist.hasHydrated()).toBe(true),
    );
    expect(isBroken).not.toHaveBeenCalled();
  });

  it("waits for a signed in user before checking", async () => {
    useAuthStore.setState({ auth: null });
    markedPlan();
    await renderHook(() => usePendingPlanCheck());
    await waitFor(() =>
      expect(useUserWorkoutStore.persist.hasHydrated()).toBe(true),
    );
    expect(useUserWorkoutStore.getState().planCheckPending).toBe(true);
  });
});
