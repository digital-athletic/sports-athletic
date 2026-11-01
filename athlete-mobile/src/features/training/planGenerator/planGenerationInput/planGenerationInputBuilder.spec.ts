import { loadPlanAuthoredData } from "@/data/loadPlanAuthoredData";
import {
  generatePlanGenerationStores,
  seedPlanGenerationStores,
} from "@test/factories/planGenerationStores";
import { buildPlanGenerationInput } from "./planGenerationInputBuilder";

describe("planGenerationInputBuilder: buildPlanGenerationInput", () => {
  const stores = generatePlanGenerationStores();
  const authoredData = loadPlanAuthoredData();
  const random = () => 0.5;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 1, 9, 30));
    seedPlanGenerationStores(stores);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("holds the stores, the authored data, the plan start date and the reference date of the clock", () => {
    const input = buildPlanGenerationInput({
      planStartDate: new Date(2026, 10, 4),
      random,
      authoredData,
    });

    expect(input).toEqual({
      athlete: {
        personalData: stores.personalData,
        workoutData: stores.workoutData,
      },
      seasonPhase: { type: "PREPARATORY", endDate: "2027-03-01" },
      weeklySchedule: stores.trainingDays,
      trainingPlaces: stores.places,
      authoredData,
      exerciseData: stores.branchData,
      planStartDate: "2026-11-04",
      referenceDate: "2026-11-01",
      random,
    });
  });

  it("holds no muscle soreness", () => {
    const input = buildPlanGenerationInput({
      planStartDate: new Date(2026, 10, 4),
      random,
      authoredData,
    });

    expect(input.athlete).not.toHaveProperty("temporalData");
    expect(input).not.toHaveProperty("muscleSoreness");
  });

  it("loads the authored data when the caller passes none", () => {
    const input = buildPlanGenerationInput({
      planStartDate: new Date(2026, 10, 4),
    });

    expect(input.authoredData).toEqual(authoredData);
  });

  it("returns a frozen input with a frozen weekly schedule", () => {
    const input = buildPlanGenerationInput({
      planStartDate: new Date(2026, 10, 4),
      random,
      authoredData,
    });

    expect(Object.isFrozen(input)).toBe(true);
    expect(Object.isFrozen(input.athlete)).toBe(true);
    expect(Object.isFrozen(input.weeklySchedule)).toBe(true);
  });
});
