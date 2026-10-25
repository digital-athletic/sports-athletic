import type { Template } from "@/schemas/aiwl.schema";
import { type BlockHandlerRegistry, walkTemplateBlocks } from "./blockWalk";
import type { GenerationInput } from "./generationInput";
import {
  type FinishedWorkout,
  finishWorkout,
  type SetListBuilder,
  type WorkoutFinishRules,
} from "./workoutFinish";
import { setUpWorkout, type WorkoutInput } from "./workoutSetup";

export interface TemplateInterpreterOptions<TEntry> {
  handlers: BlockHandlerRegistry;
  finishRules: WorkoutFinishRules;
  createSetListBuilder: (input: WorkoutInput) => SetListBuilder<TEntry>;
}

/**
 * Runs the stages of one workout: workout setup, block walk and workout
 * finish. The handlers and the set list builder read one workout input.
 */
export const interpretTemplate = <TEntry>(
  template: Template,
  input: GenerationInput,
  {
    handlers,
    finishRules,
    createSetListBuilder,
  }: TemplateInterpreterOptions<TEntry>,
): FinishedWorkout<TEntry> => {
  const workoutInput = setUpWorkout(input, template);
  return finishWorkout(
    walkTemplateBlocks(template, workoutInput, handlers),
    finishRules,
    createSetListBuilder(workoutInput),
  );
};
