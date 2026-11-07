import PlanGenerator from "@/features/training/generators/PlanGenerator";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { generateTrainingPlan } from "@/features/training/planGenerator/planGeneration";
import { useAuthStore } from "@/store/authStore";
import { usePlacesStore } from "@/store/placesStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { setUpPlanGeneratorFlag } from "@test/factories/generatorFlags";
import { act, renderHook } from "@testing-library/react-native";
import { useUpdateTrainingPlan } from "./useUpdateTrainingPlan";

jest.mock("@/features/training/planGenerator/planGeneration", () => ({
  generateTrainingPlan: jest.fn(),
}));

const plan = { start: "2026-10-05", sections: [] } as TrainingPlanType;

describe("useUpdateTrainingPlan", () => {
  let generatePlan: jest.SpyInstance;

  beforeEach(() => {
    generatePlan = jest
      .spyOn(PlanGenerator, "generatePlan")
      .mockReturnValue(plan);
    jest.mocked(generateTrainingPlan).mockReset().mockReturnValue(plan);
    useAuthStore.setState({ auth: { userId: "athlete" } });
    useUserWorkoutStore.setState({ trainingPlan: plan });
    usePlacesStore.getState().setPlaceEquipment("HOME", ["DUMBBELL"]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("regenerates with the equipment saved in the same step", async () => {
    const { result } = await renderHook(() => useUpdateTrainingPlan());

    await act(() => {
      usePlacesStore
        .getState()
        .setPlaceEquipment("HOME", ["DUMBBELL", "KETTLEBELL"]);
      result.current.updateTrainingPlan();
    });

    const [, , , , , places] = generatePlan.mock.calls[0];
    expect(places.HOME.equipment).toEqual(["DUMBBELL", "KETTLEBELL"]);
  });

  describe("plan generator flag on", () => {
    setUpPlanGeneratorFlag("true");

    it("regenerates on the new plan generator from the preserved start date", async () => {
      const { result } = await renderHook(() => useUpdateTrainingPlan());

      await act(() => {
        result.current.updateTrainingPlan();
      });

      expect(generateTrainingPlan).toHaveBeenCalledWith(
        expect.objectContaining({ planStartDate: "2026-10-05" }),
      );
      expect(generatePlan).not.toHaveBeenCalled();
    });
  });
});
