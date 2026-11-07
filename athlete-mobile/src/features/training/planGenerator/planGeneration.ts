import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { pipe } from "@/utils/functional";
import type { PlanGenerationInput } from "./planGenerationInput/planGenerationInput";
import { selectDayBranches } from "./stages/branchSelection";
import {
  assignTrainingDayFocus,
  type FocusedTrainingDay,
} from "./stages/dayGroupingAndFocus";
import {
  type AssembledSection,
  assembleTrainingPlan,
} from "./stages/planAssembly";
import {
  type DerivedProfile,
  deriveAthleteProfile,
} from "./stages/profileDerivation";
import { selectRegionConfiguration } from "./stages/regionConfiguration";
import { layOutSections, type PlanSection } from "./stages/sectionLayout";
import {
  budgetSectionDays,
  type TrainingDayBudget,
} from "./stages/skillBudget";

/** The budgets of the training days of one section. */
interface SectionBudget {
  readonly section: PlanSection;
  readonly budgets: readonly TrainingDayBudget[];
}

/**
 * The input plus the results of the stages that ran so far. A stage adapter
 * reads the fields of earlier stages and adds its own result.
 */
interface PlanGenerationContext {
  readonly input: PlanGenerationInput;
  readonly profile?: DerivedProfile;
  readonly sections?: readonly PlanSection[];
  /** The active training days with their focus, the same for every section. */
  readonly days?: readonly FocusedTrainingDay[];
  readonly sectionBudgets?: readonly SectionBudget[];
  readonly assembledSections?: readonly AssembledSection[];
  readonly plan?: TrainingPlanType;
}

/**
 * Returns a stage result of the context, or fails when the stage that adds it
 * did not run before.
 */
const requireStageResult = <T>(value: T | undefined, field: string): T => {
  if (value === undefined) {
    throw new Error(`The plan generation context lacks ${field}`);
  }
  return value;
};

const addProfile = (context: PlanGenerationContext): PlanGenerationContext => ({
  ...context,
  profile: deriveAthleteProfile(context.input),
});

const addSections = (
  context: PlanGenerationContext,
): PlanGenerationContext => ({
  ...context,
  sections: layOutSections(
    requireStageResult(context.profile, "profile"),
    context.input.authoredData.sectionTemplates,
  ),
});

const addDayFocus = (
  context: PlanGenerationContext,
): PlanGenerationContext => ({
  ...context,
  days: assignTrainingDayFocus(
    context.input,
    requireStageResult(context.profile, "profile"),
  ).flat(),
});

const addSkillBudgets = (
  context: PlanGenerationContext,
): PlanGenerationContext => {
  const profile = requireStageResult(context.profile, "profile");
  const days = requireStageResult(context.days, "days");
  const { trainingPlaces, authoredData } = context.input;
  return {
    ...context,
    sectionBudgets: requireStageResult(context.sections, "sections").map(
      (section) => ({
        section,
        budgets: budgetSectionDays(
          { section, profile, trainingPlaces, authoredData },
          days,
        ),
      }),
    ),
  };
};

/**
 * Region configuration runs per skill and hands its tag entries straight to
 * branch selection, so both stages share this adapter.
 */
const addBranchSelections = (
  context: PlanGenerationContext,
): PlanGenerationContext => {
  const { input } = context;
  const profile = requireStageResult(context.profile, "profile");
  const selectBudgetBranches = (budget: TrainingDayBudget) =>
    selectDayBranches(
      budget.skills.map(({ skill, minutes }) => ({
        skill,
        tagEntries: selectRegionConfiguration(
          skill,
          minutes,
          profile,
          input.authoredData.regionConfigs,
        ).tagEntries,
      })),
      budget.day.place,
      profile,
      input,
    ).selections;
  return {
    ...context,
    assembledSections: requireStageResult(
      context.sectionBudgets,
      "sectionBudgets",
    ).map(({ section, budgets }) => ({
      section,
      days: budgets.map((budget) => ({
        budget,
        selections: selectBudgetBranches(budget),
      })),
    })),
  };
};

const addPlan = (context: PlanGenerationContext): PlanGenerationContext => ({
  ...context,
  plan: assembleTrainingPlan(
    requireStageResult(context.assembledSections, "assembledSections"),
    context.input,
  ),
});

/**
 * Generates the training plan of one athlete from the plan generation input.
 * The stages run in a fixed order, so the same input and random sequence
 * always yield the same plan. Input and configuration errors reach the caller
 * as the typed generator error.
 *
 * generateTrainingPlan(input)
 * → { start: "2026-11-02", sections: [{ start: "2026-11-02", type: "BAS", trainings: [...] }, ...] }
 */
export const generateTrainingPlan = (
  input: PlanGenerationInput,
): TrainingPlanType =>
  requireStageResult(
    pipe<PlanGenerationContext>(
      { input },
      addProfile,
      addSections,
      addDayFocus,
      addSkillBudgets,
      addBranchSelections,
      addPlan,
    ).plan,
    "plan",
  );
