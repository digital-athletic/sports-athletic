import { TagGroups } from "@/constants/tagGroups";
import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import type { Superset } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";
import { isBigMuscleExercise } from "./muscleGroups";
import { pickSupersetPartner } from "./supersetPartner";

const AGONISTS = [
  ["CHEST"],
  ["QUADRICEPS"],
  ["RECTUS_ABDOMINIS"],
  ["SHOULDER"],
];
const ANTAGONISTS = [
  ["LATISSIMUS", "NECK", "UPPER_BACK"],
  ["GLUTES"],
  ["LOWER_BACK"],
  ["LATISSIMUS"],
];
const SECOND_AGONISTS = [
  ["BICEPS"],
  ["WRIST_EXTENSOR"],
  ["SHOULDER_FRONT"],
  ["CALF"],
  ["INNER_THIGH"],
  ["SCAPULAR_STABILIZER_FRONT"],
  ["HIP_EXTERNAL_ROTATOR"],
  ["NECK_FRONT"],
];
const SECOND_ANTAGONISTS = [
  ["TRICEPS"],
  ["WRIST_FLEXOR"],
  ["SHOULDER_REAR"],
  ["ANKLE", "SHIN"],
  ["OUTER_THIGH"],
  ["SCAPULAR_STABILIZER_REAR"],
  ["HIP_INTERNAL_ROTATOR"],
  ["NECK_REAR"],
];
// Searched in this order; the first table that holds a muscle names its opposite
const OPPOSING_MUSCLE_TABLES = [
  [AGONISTS, ANTAGONISTS],
  [ANTAGONISTS, AGONISTS],
  [SECOND_AGONISTS, SECOND_ANTAGONISTS],
  [SECOND_ANTAGONISTS, SECOND_AGONISTS],
];

/** The leads still to pair and the partners left, by muscle size. */
interface LeadPairing {
  exercises: ExerciseType[];
  isSuperset: boolean;
  random: () => number;
  big: BranchExerciseReference[];
  small: BranchExerciseReference[];
}

/**
 * Lists the muscles that oppose the given ones, for the superset partner rank.
 *
 * listOpposingMuscles(["CHEST", "GLUTES"]) → ["LATISSIMUS", "NECK", "UPPER_BACK", "QUADRICEPS"]
 */
export const listOpposingMuscles = (muscles: string[]): string[] =>
  muscles.flatMap((muscle) => {
    for (const [groups, opposites] of OPPOSING_MUSCLE_TABLES) {
      const index = groups.findIndex((group) => group.includes(muscle));
      if (index > -1) return opposites[index];
    }
    return [];
  });

const findCatalogExercise = (
  exercises: ExerciseType[],
  exerciseId: string,
): ExerciseType | undefined =>
  exercises.find((exercise) => exercise.id === exerciseId);

const readOtherSideExerciseId = (
  entry: BranchExerciseReference,
  exercise: ExerciseType | undefined,
): string | null | undefined =>
  getTagValues(entry.branchTags, TagGroups.SIDE).includes("ONE")
    ? exercise?.otherSideExerciseId
    : undefined;

/**
 * Pairs branches in the order they were drawn: a one sided exercise with its
 * other side, any other exercise with the next one.
 */
const pairBranchesInDrawOrder = (
  drawn: BranchExerciseReference[],
  exercises: ExerciseType[],
): ExercisePair[] => {
  const readOtherSide = (entry: BranchExerciseReference) =>
    readOtherSideExerciseId(
      entry,
      findCatalogExercise(exercises, entry.exerciseId),
    );
  const pairs: ExercisePair[] = [];
  let index = 0;
  while (index < drawn.length) {
    const first = drawn[index];
    const otherSide = readOtherSide(first);
    const next = drawn[index + 1];
    if (otherSide) {
      pairs.push({ first, second: { ...first, exerciseId: otherSide } });
      index += 1;
    } else if (next && !readOtherSide(next)) {
      pairs.push({ first, second: next });
      index += 2;
    } else {
      pairs.push({ first });
      index += 1;
    }
  }
  return pairs;
};

/** Joins each first exercise without a partner with the last such exercise. */
const pairLeftoverSingleExercises = (pairs: ExercisePair[]): ExercisePair[] => {
  const joined = [...pairs];
  const isSingle = (pair: ExercisePair) => !pair.second;
  let singleIndex = joined.findIndex(isSingle);
  while (singleIndex !== -1) {
    const lead = singleIndex;
    const partnerIndex = joined.findLastIndex(
      (pair, index) => isSingle(pair) && index !== lead,
    );
    if (partnerIndex !== -1) {
      joined[lead] = { ...joined[lead], second: joined[partnerIndex].first };
      joined.splice(partnerIndex, 1);
    }
    const nextSingleIndex = joined.findIndex(isSingle);
    singleIndex = nextSingleIndex !== lead ? nextSingleIndex : -1;
  }
  return joined;
};

const takeSupersetPartner = (
  lead: BranchExerciseReference,
  pairing: LeadPairing,
): BranchExerciseReference | undefined => {
  const partner = pickSupersetPartner(
    lead,
    [...pairing.big, ...pairing.small],
    listOpposingMuscles(getTagValues(lead.branchTags, TagGroups.MUSCLE)),
    pairing.random,
  );
  if (partner) {
    const pool = pairing.big.includes(partner) ? pairing.big : pairing.small;
    pool.splice(pool.indexOf(partner), 1);
  }
  return partner;
};

const pairLeadExercise = (
  lead: BranchExerciseReference,
  requireCatalogEntry: boolean,
  pairing: LeadPairing,
): ExercisePair | undefined => {
  // Stored references can lack an exercise ID despite the type
  if (lead.exerciseId === undefined || lead.exerciseId === null) {
    return undefined;
  }
  const exercise = findCatalogExercise(pairing.exercises, lead.exerciseId);
  if (!exercise && requireCatalogEntry) return undefined;
  const otherSide = readOtherSideExerciseId(lead, exercise);
  if (otherSide) {
    const { branchId, branchTags } = lead;
    return {
      first: lead,
      second: { branchId, branchTags, exerciseId: otherSide },
    };
  }
  const partner = pairing.isSuperset
    ? takeSupersetPartner(lead, pairing)
    : undefined;
  return partner ? { first: lead, second: partner } : { first: lead };
};

// Big muscle leads come first, the last drawn first. A lead missing from the
// catalog is dropped only among the big muscle leads.
const pairLeadsByMuscleSize = (pairing: LeadPairing): ExercisePair[] => {
  const pairs: ExercisePair[] = [];
  const leadGroups = [
    { leads: pairing.big, requireCatalogEntry: true },
    { leads: pairing.small, requireCatalogEntry: false },
  ];
  for (const { leads, requireCatalogEntry } of leadGroups) {
    let lead = leads.pop();
    while (lead) {
      const pair = pairLeadExercise(lead, requireCatalogEntry, pairing);
      if (pair) pairs.push(pair);
      lead = leads.pop();
    }
  }
  return pairs;
};

/**
 * Pairs a skill's drawn branches into units by the block's superset rule:
 * - `drawOrder`: in draw order; `drawOrderWithLeftovers` also joins the singles.
 * - `muscles`: each lead takes its best ranked superset partner, one draw per
 *   partner found.
 * - `none`: every exercise stays single.
 * A one sided lead always pairs with its other side.
 * The caller resolves the block's `superset`, then the skill catalog entry's.
 */
export const pairBranchExercises = (
  branches: BranchExerciseReference[],
  exercises: ExerciseType[],
  superset: Superset,
  random: () => number,
): ExercisePair[] => {
  if (superset === "drawOrder") {
    return pairBranchesInDrawOrder(branches, exercises);
  }
  if (superset === "drawOrderWithLeftovers") {
    return pairLeftoverSingleExercises(
      pairBranchesInDrawOrder(branches, exercises),
    );
  }
  return pairLeadsByMuscleSize({
    exercises,
    isSuperset: superset === "muscles",
    random,
    big: branches.filter(isBigMuscleExercise),
    small: branches.filter((entry) => !isBigMuscleExercise(entry)),
  });
};
