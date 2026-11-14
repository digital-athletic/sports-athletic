import type { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { TrainingSectionType } from "@/features/training/models/TrainingSection";
import type { LegacyTrainingType } from "@/features/training/models/UserTraining";
import type { PlacesData } from "@/store/placesStore";
import { addDays, formatDateToISO, ISODateToDate } from "@/utils/date";
import { mapReduce } from "@/utils/functional";
import type { PlanGenerationInput } from "../planGenerationInput/planGenerationInput";
import type { SelectedBranch, SkillBranchSelection } from "./branchSelection";
import { readPlaceEquipment } from "./placeEquipment";
import type { PlanSection } from "./sectionLayout";
import type { TrainingDayBudget } from "./skillBudget";

/** One training day of a section: its skill minutes and the branches picked per skill. */
export interface AssembledTrainingDay {
  readonly budget: TrainingDayBudget;
  /** In the order of the budget's skills. */
  readonly selections: readonly SkillBranchSelection[];
}

/** One section of the plan with its assembled training days. */
export interface AssembledSection {
  readonly section: PlanSection;
  readonly days: readonly AssembledTrainingDay[];
}

const MONDAY = 1;
const DAYS_PER_WEEK = 7;

/**
 * Finds the first Monday on or after a date.
 *
 * findFirstMondayFrom(new Date(2026, 10, 4)) → Monday 2026-11-09
 */
const findFirstMondayFrom = (date: Date): Date =>
  addDays(date, (MONDAY + DAYS_PER_WEEK - date.getDay()) % DAYS_PER_WEEK);

/**
 * Writes a picked branch as the branch copy a stored training day holds.
 *
 * copyBranch({ branchId: "12", tags: ["REGION_CORE"], levels: { 1: { exerciseId: "40" } } })
 * → { branchId: "12", tags: ["REGION_CORE"], exercises: { 1: { exerciseId: "40" } } }
 */
const copyBranch = ({
  branchId,
  tags,
  levels,
}: SelectedBranch): ExerciseBranchType => ({
  branchId,
  tags: [...tags],
  exercises: Object.fromEntries(
    Object.entries(levels).map(([level, { exerciseId }]) => [
      level,
      { exerciseId },
    ]),
  ),
});

/**
 * Writes one training day in the stored shape. An empty skill gets no branch
 * entry but keeps its minutes, as the old generator writes it:
 * src/features/training/generators/PlanGenerator.ts, PlanGenerator.createSection
 */
const writeTrainingDay = (
  { budget, selections }: AssembledTrainingDay,
  trainingPlaces: PlacesData,
): LegacyTrainingType => ({
  weekday: budget.day.weekday,
  skills: Object.fromEntries(
    selections.flatMap((selection) =>
      selection.type === "BRANCHES"
        ? [[selection.skill, selection.branches.map(copyBranch)]]
        : [],
    ),
  ),
  lengths: Object.fromEntries(
    budget.skills.map(({ skill, minutes }) => [skill, minutes]),
  ),
  focus: budget.day.focus,
  equipment: [...readPlaceEquipment(trainingPlaces, budget.day.place)],
});

/**
 * Writes the sections and their training days in today's stored plan shape.
 * The first section starts on the first Monday on or after the plan start, and
 * each later section starts after the weeks of the one before.
 *
 * assembleTrainingPlan([{ section: { type: "BAS", numOfWeeks: 2, ... }, days }, ...],
 *   { planStartDate: "2026-11-04", trainingPlaces })
 * → { start: "2026-11-04", sections: [{ start: "2026-11-09", ... }, { start: "2026-11-23", ... }] }
 */
export const assembleTrainingPlan = (
  sections: readonly AssembledSection[],
  {
    planStartDate,
    trainingPlaces,
  }: Pick<PlanGenerationInput, "planStartDate" | "trainingPlaces">,
): TrainingPlanType => {
  const [datedSections] = mapReduce(
    sections,
    findFirstMondayFrom(ISODateToDate(planStartDate)),
    ({ section, days }, start): readonly [TrainingSectionType, Date] => [
      {
        start: formatDateToISO(start),
        numOfWeeks: section.numOfWeeks,
        type: section.type,
        cardioType: section.cardioType,
        trainings: days.map((day) => writeTrainingDay(day, trainingPlaces)),
      },
      addDays(start, section.numOfWeeks * DAYS_PER_WEEK),
    ],
  );
  return { start: planStartDate, sections: datedSections };
};
