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

export interface TemplateInterpreterOptions<TEntry> {
  handlers: BlockHandlerRegistry;
  finishRules: WorkoutFinishRules;
  createSetListBuilder: (input: WorkoutInput) => SetListBuilder<TEntry>;
  /** The skill trees picks blocks resolve from; the bundled trees when absent. */
  skillTrees?: Readonly<Record<string, SkillTreeType>>;
  /** Replaces workout setup for a source with its own checks; setUpWorkout when absent. */
  setUpWorkout?: typeof setUpWorkout;
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
    setUpWorkout: setUpSourceWorkout = setUpWorkout,
  }: TemplateInterpreterOptions<TEntry>,
): FinishedWorkout<TEntry> => {
  const workoutInput = setUpSourceWorkout(input, template, skillTrees);
  return finishWorkout(
    walkTemplateBlocks(template, workoutInput, handlers),
    finishRules,
    createSetListBuilder(workoutInput),
  );
};
