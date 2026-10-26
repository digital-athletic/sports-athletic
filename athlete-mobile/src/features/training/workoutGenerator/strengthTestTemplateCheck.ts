import type {
  ExercisesBlock,
  TestSet,
} from "@/schemas/strengthTestTemplate.schema";
import type { StrengthTest, TestSetLoads } from "@/schemas/generator.schema";
import type { InterpretedWorkout } from "./stages/blockWalk";

const WARM_UP_SKILL = "WU";

const requireLiftsBlock = ({
  id,
  blocks,
}: InterpretedWorkout): ExercisesBlock => {
  const [warmUp, lifts] = blocks;
  if (warmUp?.kind !== "picks" || warmUp.skill !== WARM_UP_SKILL) {
    throw new Error(
      `${id}.blocks[0]: the strength test starts with a warm-up picks block of skill ${WARM_UP_SKILL}`,
    );
  }
  if (lifts?.kind !== "exercises") {
    throw new Error(
      `${id}.blocks[1]: the strength test needs an exercises block of lifts after the warm-up`,
    );
  }
  if (blocks.length > 2) {
    throw new Error(
      `${id}.blocks[2]: the strength test ends with its lifts block`,
    );
  }
  return lifts;
};

const checkTestSets = (
  id: string,
  testSets: readonly TestSet[] | undefined,
): void => {
  if (!testSets) {
    throw new Error(
      `${id}.blocks[1].testSets: the strength test needs testSets`,
    );
  }
  const amrapIndexes = testSets.flatMap(({ repetitions }, index) =>
    repetitions === "amrap" ? [index] : [],
  );
  if (amrapIndexes.length !== 1 || amrapIndexes[0] !== testSets.length - 1) {
    throw new Error(
      `${id}.blocks[1].testSets: the strength test ends on its one amrap test set`,
    );
  }
};

const checkLiftLoads = (
  id: string,
  exerciseIds: readonly string[],
  testSetLoads: TestSetLoads,
): void => {
  const liftWithoutLoads = exerciseIds.find(
    (exerciseId) =>
      !testSetLoads[exerciseId]?.m || !testSetLoads[exerciseId]?.w,
  );
  if (liftWithoutLoads !== undefined) {
    throw new Error(
      `${id}.blocks[1].exercises: lift ${liftWithoutLoads} has no test set loads for both genders`,
    );
  }
};

/**
 * Checks the strength test template before any block runs: a warm-up picks
 * block of skill WU, then an exercises block of lifts as the last block, test
 * sets that end on their one AMRAP set, and test set loads of both genders per
 * lift. The interpreter runs any template, so the source owns these rules.
 * Returns the lifts block, whose skill names the strength test builder.
 *
 * checkStrengthTestTemplate({ id: "TEST", blocks: [warmUp] }, loadStrengthTest())
 * → throws "TEST.blocks[1]: the strength test needs an exercises block of lifts after the warm-up"
 */
export const checkStrengthTestTemplate = (
  template: InterpretedWorkout,
  { testSetLoads }: Pick<StrengthTest, "testSetLoads">,
): ExercisesBlock => {
  const lifts = requireLiftsBlock(template);
  checkTestSets(template.id, lifts.testSets);
  checkLiftLoads(template.id, lifts.exercises, testSetLoads);
  return lifts;
};
