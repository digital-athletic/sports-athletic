import PlanGenerator from "@/features/training/generators/PlanGenerator";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { generateTrainingPlan } from "@/features/training/planGenerator/planGeneration";
import { loadPlanAuthoredData } from "@/data/loadPlanAuthoredData";
import { setUpPlanGeneratorFlag } from "@test/factories/generatorFlags";
import {
  generatePlanGenerationStores,
  seedPlanGenerationStores,
} from "@test/factories/planGenerationStores";
import {
  generatePlan,
  type PlanGenerationRequest,
} from "./planGeneratorRouter";

jest.mock("@/features/training/planGenerator/planGeneration", () => ({
  generateTrainingPlan: jest.fn(),
}));

const oldPlan = { start: "2026-11-02", sections: [] } as TrainingPlanType;
const newPlan = { start: "2026-11-09", sections: [] } as TrainingPlanType;

const stores = generatePlanGenerationStores();

/**
 * Builds the request both callers send, from the plan generation stores.
 *
 * generatePlanRequest()
 * → { user: { userId: "athlete", personalData, workoutData }, exercises: [],
 *     skillTrees: {}, branchData, trainingDays, places, startDate: 4 Nov 2026 }
 */
const generatePlanRequest = (): PlanGenerationRequest => ({
  user: {
    userId: "athlete",
    personalData: stores.personalData,
    workoutData: stores.workoutData,
  },
  exercises: [],
  skillTrees: {},
  branchData: stores.branchData,
  trainingDays: stores.trainingDays,
  places: stores.places,
  startDate: new Date(2026, 10, 4),
});

describe("planGeneratorRouter: generatePlan", () => {
  let oldGeneratePlan: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 1, 9, 30));
    seedPlanGenerationStores(stores);
    oldGeneratePlan = jest
      .spyOn(PlanGenerator, "generatePlan")
      .mockReturnValue(oldPlan);
    jest.mocked(generateTrainingPlan).mockReset().mockReturnValue(newPlan);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe.each([undefined, "false", "", "TRUE", "1"])(
    "plan generator flag %p",
    (flagValue) => {
      setUpPlanGeneratorFlag(flagValue);

      it("runs the old plan generator with the request inputs", () => {
        const request = generatePlanRequest();

        const plan = generatePlan(request);

        expect(plan).toBe(oldPlan);
        expect(oldGeneratePlan).toHaveBeenCalledWith(
          request.user,
          request.exercises,
          request.skillTrees,
          request.branchData,
          request.trainingDays,
          request.places,
          request.startDate,
        );
        expect(generateTrainingPlan).not.toHaveBeenCalled();
      });
    },
  );

  describe('plan generator flag "true"', () => {
    setUpPlanGeneratorFlag("true");

    it("runs the new plan generator on the input built from the stores", () => {
      const plan = generatePlan(generatePlanRequest());

      expect(plan).toBe(newPlan);
      expect(generateTrainingPlan).toHaveBeenCalledWith({
        athlete: {
          personalData: stores.personalData,
          workoutData: stores.workoutData,
        },
        seasonPhase: stores.workoutData.seasonPhase,
        weeklySchedule: stores.trainingDays,
        trainingPlaces: stores.places,
        authoredData: loadPlanAuthoredData(),
        exerciseData: stores.branchData,
        planStartDate: "2026-11-04",
        referenceDate: "2026-11-01",
        random: expect.any(Function),
      });
      expect(oldGeneratePlan).not.toHaveBeenCalled();
    });
  });
});
