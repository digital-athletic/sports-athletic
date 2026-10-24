import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import { PLACEHOLDER_BRANCH_ID } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { createExerciseMap } from "@/features/training/utils/exerciseAccessor";
import { getAreasFor } from "@/features/training/utils/exerciseUtils";
import type { BranchLookupIndex } from "./branchLookupIndex";
import { readExerciseStartValues } from "./exerciseStartValues";
import type { GenerationInput } from "./generationInput";
import type { SetListBlock, SkillSetListBuilder } from "./setListBuilder";

interface IntervalProfile {
  workSeconds: number;
  runningPauseSeconds: number;
  startIntervals: number;
}

// Zone 3 and every unlisted interval zone run 2 min intervals.
const DEFAULT_INTERVAL_PROFILE: IntervalProfile = {
  workSeconds: 120,
  runningPauseSeconds: 60,
  startIntervals: 3,
};

const INTERVAL_PROFILE_BY_ZONE = new Map<string, IntervalProfile>([
  ["CARDIO_2", { workSeconds: 60, runningPauseSeconds: 60, startIntervals: 3 }],
  [
    "CARDIO_1_LAKTAT",
    { workSeconds: 30, runningPauseSeconds: 240, startIntervals: 2 },
  ],
  [
    "CARDIO_1_SHORT",
    { workSeconds: 10, runningPauseSeconds: 80, startIntervals: 3 },
  ],
]);

const STEADY_ZONES = new Set(["CARDIO_4", "CARDIO_5"]);
// A steady run with lower body soreness lasts at most 20 minutes.
const SORE_STEADY_RUN_MAX_MINUTES = 20;
const WARM_UP_MAX_SECONDS = 5 * 60;
const FILLER_MIN_SECONDS = 60;

/**
 * Draws the one branch a cardio block runs, with one draw.
 *
 * drawCardioExercisePair([run, bike], () => 0.6) → [{ first: bike }]
 */
export const drawCardioExercisePair = (
  branches: readonly BranchExerciseReference[],
  random: () => number,
): ExercisePair[] => {
  const first = branches[Math.floor(random() * branches.length)];
  return first ? [{ first }] : [];
};

// The running pause runs the first exercise of zone 5, warm-up and filler
// the first exercise of zone 4.
const readFirstZoneExerciseId = (
  branchLookupIndex: BranchLookupIndex,
  zone: string,
): string => {
  for (const { skillTreeName, branch } of branchLookupIndex.values()) {
    if (skillTreeName !== zone) continue;
    const exerciseId =
      branch.levels[Number(Object.keys(branch.levels)[0])]?.exerciseId;
    if (exerciseId) return exerciseId;
    break;
  }
  throw new Error(`Skill tree ${zone} has no first exercise`);
};

const buildCardioEntry = (
  skill: SetListBlock["skill"],
  branchId: string,
  exerciseId: string,
  duration: number,
): GeneratedSetListEntry => ({
  branchId,
  exerciseId,
  set: [1, 1],
  skill,
  duration,
});

const buildSteadyRun = (
  lead: BranchExerciseReference,
  { skill, minutes }: SetListBlock,
  input: GenerationInput,
): GeneratedSetListEntry[] => {
  const hasSoreLowerBody = getAreasFor(
    input.muscleSoreness.map((entry) => entry.tag),
  ).includes("lowerBody");
  const runMinutes = hasSoreLowerBody
    ? Math.min(minutes, SORE_STEADY_RUN_MAX_MINUTES)
    : minutes;
  return [
    buildCardioEntry(skill, lead.branchId, lead.exerciseId, runMinutes * 60),
  ];
};

// Cardio has no feedback progression yet, so the count reads no exercise data.
const readIntervalCount = (
  lead: BranchExerciseReference,
  block: SetListBlock,
  input: GenerationInput,
  profile: IntervalProfile,
): number | undefined => {
  const exercise = createExerciseMap(input.exerciseCatalog).get(
    lead.exerciseId,
  );
  if (!exercise) return undefined;
  const startValues = readExerciseStartValues(
    {
      skillCatalog: input.skillCatalog,
      athlete: input.athlete,
      exerciseData: null,
    },
    block,
    lead,
    exercise,
  );
  return Math.min(
    startValues.repetition ?? profile.startIntervals,
    Math.floor(
      (block.minutes * 60) /
        (profile.workSeconds + profile.runningPauseSeconds),
    ),
  );
};

const buildIntervals = (
  lead: BranchExerciseReference,
  skill: SetListBlock["skill"],
  count: number,
  {
    profile,
    pauseExerciseId,
  }: { profile: IntervalProfile; pauseExerciseId: string },
): GeneratedSetListEntry[] =>
  Array.from({ length: count }, (_, index): GeneratedSetListEntry[] => [
    {
      ...buildCardioEntry(
        skill,
        lead.branchId,
        lead.exerciseId,
        profile.workSeconds,
      ),
      set: [index + 1, count],
    },
    {
      ...buildCardioEntry(
        skill,
        PLACEHOLDER_BRANCH_ID,
        pauseExerciseId,
        profile.runningPauseSeconds,
      ),
      set: [index + 1, count],
    },
  ]).flat();

const buildIntervalRun = (
  lead: BranchExerciseReference,
  block: SetListBlock,
  input: GenerationInput,
): GeneratedSetListEntry[] => {
  const profile =
    INTERVAL_PROFILE_BY_ZONE.get(block.skill) ?? DEFAULT_INTERVAL_PROFILE;
  const count = readIntervalCount(lead, block, input, profile);
  if (count === undefined) return [];
  const intervals = buildIntervals(lead, block.skill, count, {
    profile,
    pauseExerciseId: readFirstZoneExerciseId(
      input.branchLookupIndex,
      "CARDIO_5",
    ),
  });
  const buildZoneFourRun = (seconds: number) =>
    buildCardioEntry(
      block.skill,
      PLACEHOLDER_BRANCH_ID,
      readFirstZoneExerciseId(input.branchLookupIndex, "CARDIO_4"),
      seconds,
    );
  const remainingSeconds =
    block.minutes * 60 -
    count * (profile.workSeconds + profile.runningPauseSeconds);
  const warmUpSeconds = Math.min(remainingSeconds, WARM_UP_MAX_SECONDS);
  const fillerSeconds = remainingSeconds - warmUpSeconds;
  return [
    ...(warmUpSeconds > 0 ? [buildZoneFourRun(warmUpSeconds)] : []),
    ...intervals,
    ...(fillerSeconds >= FILLER_MIN_SECONDS
      ? [buildZoneFourRun(fillerSeconds)]
      : []),
  ];
};

/**
 * Builds a cardio block from its first pair: one steady run in zones 4 and 5,
 * otherwise intervals with running pauses, a zone 4 warm-up of up to 5 minutes
 * and a filler run of at least one minute. No cardio block ends on a pause.
 */
export const buildCardioSetList: SkillSetListBuilder = (
  pairs,
  block,
  input,
) => {
  const lead = pairs[0]?.first;
  if (!lead) return [];
  return STEADY_ZONES.has(block.skill)
    ? buildSteadyRun(lead, block, input)
    : buildIntervalRun(lead, block, input);
};
