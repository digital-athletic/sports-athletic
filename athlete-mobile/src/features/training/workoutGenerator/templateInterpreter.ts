import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { GenerationInput } from "./generationInput/generationInput";
import {
  type BlockHandlerRegistry,
  type InterpretedWorkout,
  walkTemplateBlocks,
} from "./stages/blockWalk";
import {
  type FinishedWorkout,
  finishWorkout,
  type SetListBuilder,
  type WorkoutFinishRules,
} from "./stages/workoutFinish";
import { setUpWorkout, type WorkoutInput } from "./stages/workoutSetup";
import type { WorkoutFilters } from "./workoutFilters";

export interface TemplateInterpreterOptions<TEntry> {
  handlers: BlockHandlerRegistry;
  finishRules: WorkoutFinishRules;
  createSetListBuilder: (input: WorkoutInput) => SetListBuilder<TEntry>;
  /** The skill trees picks blocks resolve from; the bundled trees when absent. */
  skillTrees?: Readonly<Record<string, SkillTreeType>>;
  /** The athlete filters every block applies. */
  filters: WorkoutFilters;
}

/**
 * Runs the stages of one workout: workout setup, block walk and workout
 * finish. The handlers and the set list builder read one workout input.
 */
export const interpretTemplate = <TEntry>(
  template: InterpretedWorkout,
  input: GenerationInput,
  {
    handlers,
    finishRules,
    createSetListBuilder,
    skillTrees,
    filters,
  }: TemplateInterpreterOptions<TEntry>,
): FinishedWorkout<TEntry> => {
  const workoutInput = setUpWorkout(input, filters, template, skillTrees);
  return finishWorkout(
    walkTemplateBlocks(template, workoutInput, handlers),
    finishRules,
    createSetListBuilder(workoutInput),
  );
};
