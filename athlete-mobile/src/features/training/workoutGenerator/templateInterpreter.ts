import type { Template } from "@/schemas/aiwl.schema";
import { type BlockHandlerRegistry, walkTemplateBlocks } from "./blockWalk";
import type { GenerationInput } from "./generationInput";
import {
  type FinishedWorkout,
  finishWorkout,
  type SetListBuilder,
  type WorkoutFinishRules,
} from "./workoutFinish";
import { setUpWorkout } from "./workoutSetup";

export interface TemplateInterpreterOptions<TEntry> {
  handlers: BlockHandlerRegistry;
  finishRules: WorkoutFinishRules;
  buildSetList: SetListBuilder<TEntry>;
}

/**
 * Runs the stages of one workout: workout setup, block walk and workout finish.
 */
export const interpretTemplate = <TEntry>(
  template: Template,
  input: GenerationInput,
  { handlers, finishRules, buildSetList }: TemplateInterpreterOptions<TEntry>,
): FinishedWorkout<TEntry> =>
  finishWorkout(
    walkTemplateBlocks(template, setUpWorkout(input), handlers),
    finishRules,
    buildSetList,
  );
