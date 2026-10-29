import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import { PLACEHOLDER_BRANCH_ID } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import { createExerciseMap } from "@/features/training/utils/exerciseAccessor";
import { getAreasFor } from "@/features/training/utils/exerciseUtils";
import type { BranchLookupIndex } from "../generationInput/branchLookupIndex";
import { readExerciseStartValues } from "../exerciseValues/exerciseStartValues";
import type { GenerationInput } from "../generationInput/generationInput";
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
 * Draws the one branch a cardio block runs, with one draw. PR 4's dispatch
 * calls it in place of pairing, at the old draw position before the block's
 * set list.
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

interface ZoneExerciseIds {
  runningPause: string;
  zoneFour: string;
}

const readFirstExerciseIdOfZone = (
  firstBranches: Map<string, SkillBranchType>,
  zone: string,
): string => {
  const levels = firstBranches.get(zone)?.levels;
  const exerciseId = levels?.[Number(Object.keys(levels)[0])]?.exerciseId;
  if (!exerciseId) throw new Error(`Skill tree ${zone} has no first exercise`);
  return exerciseId;
};

// The running pause runs the first exercise of zone 5, warm-up and filler
// the first exercise of zone 4. One pass over the index finds both.
const readZoneExerciseIds = (
  branchLookupIndex: BranchLookupIndex,
): ZoneExerciseIds => {
  const firstBranches = new Map<string, SkillBranchType>();
  for (const { skillTreeName, branch } of branchLookupIndex.values()) {
    if (!firstBranches.has(skillTreeName)) {
      firstBranches.set(skillTreeName, branch);
    }
  }
  return {
    runningPause: readFirstExerciseIdOfZone(firstBranches, "CARDIO_5"),
    zoneFour: readFirstExerciseIdOfZone(firstBranches, "CARDIO_4"),
  };
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
      storedProgress: null,
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

// The old builder loops while the index stays below the count, so a count of
// 2.5 runs 3 intervals and a count that is not a number runs none.
const countBuiltIntervals = (count: number): number =>
  Number.isNaN(count) ? 0 : Math.max(0, Math.ceil(count));

// Each set tuple carries the count itself, as the old builder writes it.
const buildIntervals = (
  lead: BranchExerciseReference,
  skill: SetListBlock["skill"],
  count: number,
  {
    profile,
    pauseExerciseId,
  }: { profile: IntervalProfile; pauseExerciseId: string },
): GeneratedSetListEntry[] =>
  Array.from(
    { length: countBuiltIntervals(count) },
    (_, index): GeneratedSetListEntry[] => [
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
    ],
  ).flat();

const buildIntervalRun = (
  lead: BranchExerciseReference,
  block: SetListBlock,
  input: GenerationInput,
): GeneratedSetListEntry[] => {
  const profile =
    INTERVAL_PROFILE_BY_ZONE.get(block.skill) ?? DEFAULT_INTERVAL_PROFILE;
  const count = readIntervalCount(lead, block, input, profile);
  if (count === undefined) return [];
  const exerciseIds = readZoneExerciseIds(input.branchLookupIndex);
  const intervals = buildIntervals(lead, block.skill, count, {
    profile,
    pauseExerciseId: exerciseIds.runningPause,
  });
  const buildZoneFourRun = (seconds: number) =>
    buildCardioEntry(
      block.skill,
      PLACEHOLDER_BRANCH_ID,
      exerciseIds.zoneFour,
      seconds,
    );
  const remainingSeconds =
    block.minutes * 60 -
    countBuiltIntervals(count) *
      (profile.workSeconds + profile.runningPauseSeconds);
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
 * and a filler run of at least one minute. No cardio block ends on the pause
 * exercise (999999). A block without pairs builds nothing, where the old
 * builder throws a TypeError.
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
