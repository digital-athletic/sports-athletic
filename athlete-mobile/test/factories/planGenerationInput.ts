import { loadPlanAuthoredData } from "@/data/loadPlanAuthoredData";
import type { TagsByGroup } from "@/features/training/models/Tags";
import type {
  PlanAthlete,
  PlanGenerationInput,
} from "@/features/training/planGenerator/planGenerationInput/planGenerationInput";
import { generatePlanGenerationStores } from "./planGenerationStores";

interface PlanAthleteOptions {
  birthday?: string;
  tags?: TagsByGroup;
}

/**
 * Builds the athlete of the plan generation input: the athlete of
 * generatePlanGenerationStores with the given birthday and anamnesis tags.
 *
 * generatePlanAthlete({ birthday: "2012-03-01", tags: { PAIN: ["KNEE_LEFT"] } })
 * → { personalData: { ..., birthday: "2012-03-01" },
 *     workoutData: { ..., tags: { PAIN: ["KNEE_LEFT"] } } }
 */
export const generatePlanAthlete = ({
  birthday,
  tags,
}: PlanAthleteOptions = {}): PlanAthlete => {
  const { personalData, workoutData } = generatePlanGenerationStores();
  return {
    personalData: {
      ...personalData,
      birthday: birthday ?? personalData.birthday,
    },
    workoutData: { ...workoutData, tags: tags ?? workoutData.tags },
  };
};

/**
 * Builds a plan generation input from the stores of
 * generatePlanGenerationStores, with the real authored data. The plan starts
 * on Monday 2026-11-02, the reference date is 2026-11-01 and the preparatory
 * phase ends on 2027-03-01, 17 weeks after the plan start.
 *
 * generatePlanGenerationInput({ referenceDate: "2026-06-15" })
 * → { athlete, seasonPhase: { type: "PREPARATORY", endDate: "2027-03-01" },
 *     weeklySchedule: [Monday HOME, ..., Thursday STUDIO, ...], trainingPlaces,
 *     authoredData, exerciseData, planStartDate: "2026-11-02",
 *     referenceDate: "2026-06-15", random }
 */
export const generatePlanGenerationInput = (
  overrides: Partial<PlanGenerationInput> = {},
): PlanGenerationInput => {
  const stores = generatePlanGenerationStores();
  return {
    athlete: generatePlanAthlete(),
    seasonPhase: { type: "PREPARATORY", endDate: "2027-03-01" },
    weeklySchedule: stores.trainingDays,
    trainingPlaces: stores.places,
    authoredData: loadPlanAuthoredData(),
    exerciseData: stores.branchData,
    planStartDate: "2026-11-02",
    referenceDate: "2026-11-01",
    random: () => 0,
    ...overrides,
  };
};
