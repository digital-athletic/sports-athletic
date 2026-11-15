import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { TrainingSectionType } from "@/features/training/models/TrainingSection";
import type { AiwlTrainingType } from "@/features/training/models/UserTraining";
import type { Block } from "@/schemas/aiwl.schema";
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
const SECONDS_PER_MINUTE = 60;
/** The AIWL header needs an id and a name; no screen shows either for a plan day. */
const TRAINING_DAY_WORKOUT_ID_PREFIX = "TRAINING_DAY_";
const TRAINING_DAY_WORKOUT_NAME = { en: "Training day" };

/**
 * Finds the first Monday on or after a date.
 *
 * findFirstMondayFrom(new Date(2026, 10, 4)) → Monday 2026-11-09
 */
const findFirstMondayFrom = (date: Date): Date =>
  addDays(date, (MONDAY + DAYS_PER_WEEK - date.getDay()) % DAYS_PER_WEEK);

/**
 * Writes the branches block of a skill: its branch IDs in pick order and its
 * minutes as whole seconds. A skill whose minutes round to 0 s gets no
 * duration, as a stored day without minutes runs.
 *
 * writeBranchesBlock("SWR1", [{ branchId: "7", ... }, { branchId: "9", ... }], 12.5)
 * → { kind: "branches", skill: "SWR1", branches: ["7", "9"], duration: 750 }
 */
const writeBranchesBlock = (
  skill: string,
  branches: readonly SelectedBranch[],
  skillMinutes: number,
): Block => {
  const duration = Math.round(skillMinutes * SECONDS_PER_MINUTE);
  return {
    kind: "branches",
    skill,
    branches: branches.map(({ branchId }) => branchId),
    ...(duration > 0 ? { duration } : {}),
  };
};

/**
 * Writes one branches block per skill with branches, in the order of the
 * budget's skills. An empty skill gets no block. A day without any block
 * throws NO_EXERCISES/SKILL_TREE for its first skill, since an AIWL workout
 * needs a block.
 */
const writeTrainingDayBlocks = ({
  budget,
  selections,
}: AssembledTrainingDay): Block[] => {
  // the selections follow the order of the budget's skills
  const blocks = budget.skills.flatMap(({ skill, minutes }, index) => {
    const selection = selections[index];
    return selection?.type === "BRANCHES" && selection.branches.length > 0
      ? [writeBranchesBlock(skill, selection.branches, minutes)]
      : [];
  });
  if (blocks.length === 0) {
    const firstSkill = budget.skills[0]?.skill;
    throw {
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: firstSkill === undefined ? [] : [firstSkill],
    } satisfies GeneratorError;
  }
  return blocks;
};

/**
 * Writes one training day as an AIWL training: weekday, focus and the
 * equipment of the day's place, and the day's skills as an AIWL workout.
 *
 * writeTrainingDay({ budget: { day: { weekday: 3, focus: "PHASE", place: "STUDIO" },
 *   skills: [{ skill: "WU", minutes: 5 }] }, selections: [WU branch 4] }, trainingPlaces)
 * → { weekday: 3, focus: "PHASE", equipment: ["BARBELL"],
 *     workout: { aiwl: 1, id: "TRAINING_DAY_3", name: { en: "Training day" },
 *       blocks: [{ kind: "branches", skill: "WU", branches: ["4"], duration: 300 }] } }
 */
const writeTrainingDay = (
  day: AssembledTrainingDay,
  trainingPlaces: PlacesData,
): AiwlTrainingType => ({
  weekday: day.budget.day.weekday,
  workout: {
    aiwl: 1,
    id: `${TRAINING_DAY_WORKOUT_ID_PREFIX}${day.budget.day.weekday}`,
    name: { ...TRAINING_DAY_WORKOUT_NAME },
    blocks: writeTrainingDayBlocks(day),
  },
  focus: day.budget.day.focus,
  equipment: [...readPlaceEquipment(trainingPlaces, day.budget.day.place)],
});

/**
 * Writes the sections and their training days as an AIWL plan. The first
 * section starts on the first Monday on or after the plan start, and each
 * later section starts after the weeks of the one before.
 *
 * assembleTrainingPlan([{ section: { type: "BAS", numOfWeeks: 2, ... }, days }, ...],
 *   { planStartDate: "2026-11-04", trainingPlaces })
 * → { start: "2026-11-04", format: "aiwl",
 *     sections: [{ start: "2026-11-09", ... }, { start: "2026-11-23", ... }] }
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
  return { start: planStartDate, format: "aiwl", sections: datedSections };
};
