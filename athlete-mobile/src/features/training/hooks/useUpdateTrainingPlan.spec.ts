import PlanGenerator from "@/features/training/generators/PlanGenerator";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { useAuthStore } from "@/store/authStore";
import { usePlacesStore } from "@/store/placesStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { act, renderHook } from "@testing-library/react-native";
import { useUpdateTrainingPlan } from "./useUpdateTrainingPlan";

const plan = { start: "2026-10-05", sections: [] } as TrainingPlanType;

describe("useUpdateTrainingPlan", () => {
  let generatePlan: jest.SpyInstance;

  beforeEach(() => {
    generatePlan = jest
      .spyOn(PlanGenerator, "generatePlan")
      .mockReturnValue(plan);
    useAuthStore.setState({ auth: { userId: "athlete" } });
    useUserWorkoutStore.setState({ trainingPlan: plan });
    usePlacesStore.getState().setPlaceEquipment("HOME", ["DUMBBELL"]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("regenerates with the equipment saved in the same step", () => {
    const { result } = renderHook(() => useUpdateTrainingPlan());

    act(() => {
      usePlacesStore
        .getState()
        .setPlaceEquipment("HOME", ["DUMBBELL", "KETTLEBELL"]);
      result.current.updateTrainingPlan();
    });

    const [, , , , , places] = generatePlan.mock.calls[0];
    expect(places.HOME.equipment).toEqual(["DUMBBELL", "KETTLEBELL"]);
  });
});
