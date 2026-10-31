import { type LevelTag, WorkoutConstants } from "@/constants/workoutConstants";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { readSkillIntensity } from "@/features/training/workoutGenerator/exerciseValues/skillIntensity";
import { readGenderLevelValue } from "@/features/training/workoutGenerator/exerciseValues/startAndTargetValues";
import { readStartWorkingRepetitions } from "@/features/training/workoutGenerator/setListBuilders/maxStrengthLadder";
import {
  BEFORE_SUPPORT_REST_SECONDS,
  BETWEEN_SUPPORT_SETS_REST_SECONDS,
  LAST_WORKING_SET_REST_SECONDS,
  readWorkingSetRests,
  WARM_UP_REST_SECONDS,
} from "@/features/training/workoutGenerator/setListBuilders/maxStrengthSetListBuilder";
import {
  HYPERTROPHY_WARM_UP_REST,
  isExplosivePowerSkill,
  opensWeightedPairWithWarmUpSet,
} from "@/features/training/workoutGenerator/setListBuilders/standardSetListBuilder";
import { readSkillCatalogEntry } from "@/features/training/workoutGenerator/generationInput/skillCatalogEntry";
import {
  SUPPORT_SET_REPETITIONS,
  SUPPORT_SET_SECONDS,
} from "@/features/training/workoutGenerator/setListBuilders/supportExercisePick";
import { readTrainingDayTimingDefaults } from "@/features/training/workoutGenerator/setListBuilders/trainingDayTiming";
import { readSkillSetListKind } from "@/features/training/workoutGenerator/stages/setListBuilding";
import type { IntensityValueType } from "@/features/training/models/Intensity";
import {
  GenderTagSchema,
  isTrainingLevel,
  type TrainingLevelType,
} from "@/schemas/common.schema";

const SECONDS_PER_REPETITION = 4;
const TRANSITION_OVERHEAD = 1.1;

/** What an athlete does in one set: repetitions, or a timed hold. */
interface SetWork {
  repetitions?: number;
  durationSeconds?: number;
}

/** The sets and rests of one exercise of a standard skill. */
interface StandardExerciseTiming {
  sets: number;
  restBetweenSetsSeconds: number;
  closingRestSeconds: number;
  work: SetWork;
}

const readWorkSeconds = ({ repetitions, durationSeconds }: SetWork): number =>
  durationSeconds ?? (repetitions ?? 0) * SECONDS_PER_REPETITION;

const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

/**
 * Estimates the seconds of one max strength exercise at the start value of its
 * level's ladder: warm up sets, working sets, support sets and rests, plus 10%.
 *
 * estimateMaxStrengthExerciseSeconds("PROFESSIONAL") → 1161.6
 */
export const estimateMaxStrengthExerciseSeconds = (level: LevelTag): number => {
  const warmUp = WorkoutConstants.MAX_STRENGTH_REPETITIONS_WARMUP.map(
    ({ repetitions }) =>
      readWorkSeconds({ repetitions }) + WARM_UP_REST_SECONDS,
  );
  const working = readStartWorkingRepetitions(level).map((repetitions) =>
    readWorkSeconds({ repetitions }),
  );
  const supportSet = Math.max(
    readWorkSeconds({ repetitions: SUPPORT_SET_REPETITIONS }),
    SUPPORT_SET_SECONDS,
  );
  const gap =
    BEFORE_SUPPORT_REST_SECONDS +
    supportSet +
    BETWEEN_SUPPORT_SETS_REST_SECONDS +
    supportSet +
    readWorkingSetRests(level).afterSupport;
  const seconds =
    sum(warmUp) +
    sum(working) +
    (working.length - 1) * gap +
    LAST_WORKING_SET_REST_SECONDS;
  return seconds * TRANSITION_OVERHEAD;
};

/**
 * Estimates the seconds of one exercise of a standard skill: 4 s per
 * repetition or the duration of a timed set, the rests between sets and the
 * closing rest, plus 10%.
 *
 * estimateExerciseSeconds({ sets: 2, restBetweenSetsSeconds: 10, closingRestSeconds: 10, work: { durationSeconds: 30 } })
 * → 88
 */
export const estimateExerciseSeconds = ({
  sets,
  restBetweenSetsSeconds,
  closingRestSeconds,
  work,
}: StandardExerciseTiming): number =>
  (sets * readWorkSeconds(work) +
    (sets - 1) * restBetweenSetsSeconds +
    closingRestSeconds) *
  TRANSITION_OVERHEAD;

const readTrainingLevel = (level: LevelTag): TrainingLevelType => {
  const key = level.toLowerCase();
  return isTrainingLevel(key) ? key : "default";
};

// The highest start value of any gender, so the estimate fits every athlete
// without history.
const readHighestStart = (
  values: IntensityValueType["repetition"],
  level: TrainingLevelType,
): number =>
  Math.max(
    0,
    ...GenderTagSchema.options.map(
      (gender) => readGenderLevelValue(values, gender, level) ?? 0,
    ),
  );

// No exercise is picked yet, so the estimate gives every set the skill's start
// repetitions or duration, the longer of the weighted and the bodyweight
// config. A skill without progression uses the config start, as the set list
// builders do for an exercise without authored start values.
const readSkillSetSeconds = (skill: string, level: LevelTag): number => {
  const trainingLevel = readTrainingLevel(level);
  const bodyweightExercise = { tags: [] };
  return Math.max(
    ...[undefined, bodyweightExercise].map((exercise) => {
      const { startValue } = readSkillIntensity(
        loadSkillCatalog(),
        skill,
        exercise,
      );
      return Math.max(
        readWorkSeconds({
          repetitions: readHighestStart(startValue.repetition, trainingLevel),
        }),
        readHighestStart(startValue.duration, trainingLevel),
      );
    }),
  );
};

// Only a skill with a catalog skill tree draws weighted exercises; WUSKSA
// trains its own bodyweight tree.
const hasWarmUpSet = (skill: string): boolean =>
  opensWeightedPairWithWarmUpSet(skill) &&
  readSkillCatalogEntry(loadSkillCatalog(), skill)?.skillTree !== undefined;

// A single exercise rests after its warm up set as the set list builder does.
const estimateSingleWarmUpSeconds = (
  skill: string,
  setSeconds: number,
  betweenSets: number,
): number => {
  if (!hasWarmUpSet(skill)) return 0;
  const rest = isExplosivePowerSkill(skill)
    ? betweenSets
    : HYPERTROPHY_WARM_UP_REST;
  return (setSeconds + rest) * TRANSITION_OVERHEAD;
};

const estimateStandardSkillSeconds = (
  skill: string,
  level: LevelTag,
  exerciseCount: number,
): number => {
  if (exerciseCount <= 0) return 0;
  const skillCatalog = loadSkillCatalog();
  const { sets, superset, rest } = readTrainingDayTimingDefaults(
    skill,
    skillCatalog,
  );
  const setSeconds = readSkillSetSeconds(skill, level);
  const closingRestSeconds = Math.max(rest.betweenSets, rest.afterExercise);
  const single =
    estimateExerciseSeconds({
      sets,
      closingRestSeconds,
      restBetweenSetsSeconds: rest.betweenSets,
      work: { durationSeconds: setSeconds },
    }) + estimateSingleWarmUpSeconds(skill, setSeconds, rest.betweenSets);
  const afterBlock =
    readSkillCatalogEntry(skillCatalog, skill)?.rest?.afterBlock ?? 0;
  const blockClosing =
    Math.max(0, afterBlock - closingRestSeconds) * TRANSITION_OVERHEAD;
  if (superset === "none") return exerciseCount * single + blockClosing;
  // A superset round alternates both exercises with a rest within the superset
  // after each, so the estimate counts a pair as one exercise with that round.
  const pair = estimateExerciseSeconds({
    sets: sets + (hasWarmUpSet(skill) ? 1 : 0),
    closingRestSeconds,
    restBetweenSetsSeconds: rest.withinSuperset,
    work: { durationSeconds: 2 * setSeconds + rest.withinSuperset },
  });
  return (
    Math.floor(exerciseCount / 2) * pair +
    (exerciseCount % 2) * single +
    blockClosing
  );
};

/** A skill of a training day with its level, exercise count and minutes. */
interface SkillEstimateInput {
  skill: string;
  level: LevelTag;
  exerciseCount: number;
  minutes: number;
}

/**
 * Estimates the seconds of a skill's exercises in a training day:
 *
 * - Cardio takes its minutes.
 * - Max strength takes the seconds of its ladder per exercise.
 * - Every other skill takes its sets and rests, and pairs its exercises when
 *   it trains supersets.
 *
 * Each exercise ends with the longer of the rest between sets and the rest
 * after the exercise. The last exercise ends with the catalog `afterBlock`
 * when that rest is longer.
 *
 * estimateSkillSeconds({ skill: "MAX", level: "PROFESSIONAL", exerciseCount: 2, minutes: 30 }) → 2323.2
 */
export const estimateSkillSeconds = ({
  skill,
  level,
  exerciseCount,
  minutes,
}: SkillEstimateInput): number => {
  const kind = readSkillSetListKind(skill);
  if (kind === "cardio") return minutes * 60;
  if (kind === "maxStrength") {
    return exerciseCount * estimateMaxStrengthExerciseSeconds(level);
  }
  return estimateStandardSkillSeconds(skill, level, exerciseCount);
};
