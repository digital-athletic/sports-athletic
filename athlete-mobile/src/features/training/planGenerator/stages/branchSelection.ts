import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type {
  DirectionEntry,
  DirectionsMap,
  RegionTagEntry,
} from "@/schemas/generator.schema";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import { mapReduce } from "@/utils/functional";
import { getTagValues } from "@/utils/tagUtils";
import type { PlanGenerationInput } from "../planGenerationInput/planGenerationInput";
import {
  filterSlotCandidates,
  filterWeightType,
  isOneSided,
  type SlotCandidate,
  type WeightType,
} from "./branchSlotFilters";
import type { DerivedProfile } from "./profileDerivation";
import { MAX_STRENGTH_SKILLS, STRENGTH_SKILLS } from "./skillCodes";
import {
  drawItem,
  isPlaceWeighted,
  type MovementRegion,
  readEntryPool,
  type SelectionDay,
  type SkillContext,
} from "./tagEntryPool";

/** A branch copy the stage picked for a skill. */
export interface SelectedBranch {
  readonly branchId: string;
  readonly tags: readonly string[];
  readonly levels: SkillBranchType["levels"];
}

/** The picks of one skill on one day, or an empty skill when none resolved. */
export type SkillBranchSelection =
  | {
      readonly type: "BRANCHES";
      readonly skill: string;
      readonly branches: readonly SelectedBranch[];
    }
  | { readonly type: "EMPTY_SKILL"; readonly skill: string };

/** One skill of a day with the tag entries of its region configuration. */
export interface SkillSelectionRequest {
  readonly skill: string;
  readonly tagEntries: readonly RegionTagEntry[];
}

/** One step of the fold: the skill's picks and the used branches after it. */
export interface SkillSelectionStep {
  readonly selection: SkillBranchSelection;
  readonly usedBranchIds: readonly string[];
}

/** The picks of every skill of one day, in request order. */
export interface DayBranchSelection {
  readonly selections: readonly SkillBranchSelection[];
  readonly usedBranchIds: readonly string[];
}

const BIG_MUSCLES_BY_REGION: Readonly<Record<MovementRegion, string[]>> = {
  UPPER_BODY: ["CHEST", "LATISSIMUS"],
  LOWER_BODY: ["GLUTES", "QUADRICEPS"],
  CORE: [],
  FULL_BODY: ["GLUTES", "QUADRICEPS", "CHEST", "LATISSIMUS"],
};

const ISOLATED_SHARE = 0.3;
/** The chance a slot draws weighted while both quotas are open. */
const WEIGHTED_DRAW_SHARE = 0.5;
/** The share of weighted slots per athlete group, Plan Workout Generation. */
const WEIGHTED_SHARES = {
  CHILD: 0.3,
  NON_STUDIO: 0.5,
  STUDIO_STRENGTH: 0.8,
  STUDIO_OTHER: 0.6,
} as const;

/**
 * The weighted share of Plan Workout Generation, or null when it does not
 * apply: at a place without weights, and for max strength.
 */
const readWeightedShare = (context: SkillContext): number | null => {
  const { skill, day, profile } = context;
  if (MAX_STRENGTH_SKILLS.includes(skill)) return null;
  if (!isPlaceWeighted(context)) return null;
  if (profile.ageGroup === WorkoutConstants.AGE_GROUPS.CHILD) {
    return WEIGHTED_SHARES.CHILD;
  }
  if (day.place !== "STUDIO") return WEIGHTED_SHARES.NON_STUDIO;
  return STRENGTH_SKILLS.includes(skill)
    ? WEIGHTED_SHARES.STUDIO_STRENGTH
    : WEIGHTED_SHARES.STUDIO_OTHER;
};

/** Keys count exercises; a larger count reads the largest key. */
const readDirectionSequence = (
  directions: DirectionsMap,
  count: number,
): readonly DirectionEntry[] => {
  const keys = Object.keys(directions).map(Number);
  if (count === 0 || keys.length === 0) return [];
  const key = Object.hasOwn(directions, String(count))
    ? count
    : Math.max(...keys);
  return directions[String(key)];
};

type Quotas = Readonly<Record<WeightType, number>>;

const createQuotas = (share: number, slotCount: number): Quotas => {
  const weighted = Math.ceil(share * slotCount);
  return { WEIGHTED: weighted, BODYWEIGHT: slotCount - weighted };
};

/** A slot draws its type while both quotas are open, then takes the open one. */
const drawWeightType = (quotas: Quotas, random: () => number): WeightType => {
  if (quotas.WEIGHTED > 0 && quotas.BODYWEIGHT > 0) {
    return random() < WEIGHTED_DRAW_SHARE ? "WEIGHTED" : "BODYWEIGHT";
  }
  return quotas.WEIGHTED > 0 ? "WEIGHTED" : "BODYWEIGHT";
};

const takeQuota = (quotas: Quotas, weightType: WeightType): Quotas => ({
  ...quotas,
  [weightType]: quotas[weightType] - 1,
});

/** The survivors of one slot after the share, and the share left for the next slot. */
interface SharedSlot {
  readonly survivors: readonly SlotCandidate[];
  readonly share: SkillShare;
}

/**
 * The weighted share of a skill over its slots. A slot draws its type before
 * the involvement and narrows its survivors after the cascading filters, so
 * the draws keep their order.
 */
interface SkillShare {
  readonly drawSlot: (
    random: () => number,
  ) => (survivors: readonly SlotCandidate[]) => SharedSlot;
}

/** A skill without a weighted-draw share draws no type and keeps every survivor. */
const NO_SHARE: SkillShare = {
  drawSlot: () => (survivors) => ({ survivors, share: NO_SHARE }),
};

const shareByQuotas = (quotas: Quotas): SkillShare => ({
  drawSlot: (random) => {
    const drawnType = drawWeightType(quotas, random);
    return (survivors) => {
      const result = filterWeightType(survivors, drawnType);
      return {
        survivors: result.survivors,
        share: shareByQuotas(takeQuota(quotas, result.weightType)),
      };
    };
  },
});

/** The share is a quota over all slots of the skill, Plan Workout Generation. */
const createSkillShare = (
  context: SkillContext,
  slotCount: number,
): SkillShare => {
  const weightedShare = readWeightedShare(context);
  return weightedShare === null
    ? NO_SHARE
    : shareByQuotas(createQuotas(weightedShare, slotCount));
};

interface EntryState {
  readonly candidates: readonly SlotCandidate[];
  readonly directions: readonly DirectionEntry[];
  readonly untrainedBigMuscles: readonly string[];
  readonly share: SkillShare;
  readonly filledSlots: number;
  readonly picks: readonly SlotCandidate[];
}

/** Fills one slot: draws the weight type, the involvement and the pick, in this order. */
const fillSlot = (
  state: EntryState,
  slotCount: number,
  context: SkillContext,
): EntryState => {
  const { random } = context.input;
  const applyShare = state.share.drawSlot(random);
  const involvement = random() < ISOLATED_SHARE ? "ISOLATED" : "COMPLEX";
  const result = filterSlotCandidates(state.candidates, {
    directions: state.directions,
    untrainedBigMuscles: state.untrainedBigMuscles,
    isLastSlot: state.filledSlots === slotCount - 1,
    involvement,
    prefersBarbell: MAX_STRENGTH_SKILLS.includes(context.skill),
  });
  const { survivors, share } = applyShare(result.survivors);
  const pick = drawItem(survivors, random);
  const pickMuscles = getTagValues(pick.branch.tags, TagGroups.MUSCLE);
  return {
    candidates: state.candidates.filter((candidate) => candidate !== pick),
    directions: state.directions.filter(
      (_, index) => index !== result.directionIndex,
    ),
    untrainedBigMuscles: state.untrainedBigMuscles.filter(
      (muscle) => !pickMuscles.includes(muscle),
    ),
    share,
    // The workout lists a one-sided exercise for each side, which takes two slots.
    filledSlots: state.filledSlots + (isOneSided(pick) ? 2 : 1),
    picks: [...state.picks, pick],
  };
};

/** The picks of a skill so far and the weighted share it has left. */
interface SkillState {
  readonly picks: readonly SlotCandidate[];
  readonly share: SkillShare;
}

/**
 * Fills the slots of one tag entry from the skill's remaining share. A
 * candidate that resolves to an exercise the skill already holds is skipped.
 */
const fillTagEntry = (
  entry: RegionTagEntry,
  { picks: heldPicks, share }: SkillState,
  context: SkillContext,
): SkillState => {
  const { candidates, region } = readEntryPool(entry, context);
  const slotCount = Math.min(entry.count, candidates.length);
  const fillOpenSlots = (state: EntryState): EntryState => {
    const heldExerciseIds = [...heldPicks, ...state.picks].map(
      ({ exercise }) => exercise.id,
    );
    const open = state.candidates.filter(
      ({ exercise }) => !heldExerciseIds.includes(exercise.id),
    );
    if (state.filledSlots >= slotCount || open.length === 0) return state;
    return fillOpenSlots(
      fillSlot({ ...state, candidates: open }, slotCount, context),
    );
  };
  const { picks, share: remainingShare } = fillOpenSlots({
    candidates,
    directions: region
      ? readDirectionSequence(
          context.input.authoredData.movementDirections[
            region === "LOWER_BODY" ? context.day.lowerBodyDirections : region
          ],
          entry.count,
        )
      : [],
    untrainedBigMuscles: region ? BIG_MUSCLES_BY_REGION[region] : [],
    share,
    filledSlots: 0,
    picks: [],
  });
  return { picks: [...heldPicks, ...picks], share: remainingShare };
};

const toSelectedBranch = ({
  branchId,
  branch,
}: SlotCandidate): SelectedBranch => ({
  branchId,
  tags: branch.tags,
  levels: branch.levels,
});

const addUsedBranches = (
  usedBranchIds: readonly string[],
  picks: readonly SlotCandidate[],
): string[] => [...usedBranchIds, ...picks.map(({ branchId }) => branchId)];

/**
 * Selects the branches of one skill on one day, as spec section 5, rules 2 to
 * 5 define: each tag entry filters its candidates through the rule chain,
 * skips branches that resolve to nothing at or below the athlete's level, and
 * fills its slots through the cascading filters. The step takes the used
 * branches of the day in and returns them extended with its picks. A skill
 * without any pick becomes an empty skill.
 *
 * selectSkillBranches({ skill: "BAS", tagEntries: [{ tags: ["REGION_CORE"], count: 1 }] },
 *   { place: "HALL", usedBranchIds: ["7"] }, profile, input)
 * → { selection: { type: "BRANCHES", skill: "BAS", branches: [{ branchId: "12", ... }] },
 *     usedBranchIds: ["7", "12"] }
 */
export const selectSkillBranches = (
  { skill, tagEntries }: SkillSelectionRequest,
  day: SelectionDay,
  profile: DerivedProfile,
  input: PlanGenerationInput,
): SkillSelectionStep => {
  const skillContext: SkillContext = { skill, day, profile, input };
  const slotCount = tagEntries.reduce((sum, { count }) => sum + count, 0);
  const { picks } = tagEntries.reduce<SkillState>(
    (state, entry) =>
      fillTagEntry(entry, state, {
        ...skillContext,
        day: {
          ...day,
          usedBranchIds: addUsedBranches(day.usedBranchIds, state.picks),
        },
      }),
    {
      picks: [],
      share: createSkillShare(skillContext, slotCount),
    },
  );
  return {
    selection:
      picks.length > 0
        ? { type: "BRANCHES", skill, branches: picks.map(toSelectedBranch) }
        : { type: "EMPTY_SKILL", skill },
    usedBranchIds: addUsedBranches(day.usedBranchIds, picks),
  };
};

/**
 * A GKS tag entry for the full body switches the lower body of the whole day
 * to the GKS directions, as the old generator does:
 * generators/PlanGenerator.ts, PlanGenerator.createSection
 */
const hasFullBodyGks = (requests: readonly SkillSelectionRequest[]) =>
  requests.some(
    ({ skill, tagEntries }) =>
      skill === "GKS" &&
      tagEntries.some(({ tags }) => tags.includes("REGION_FULL_BODY")),
  );

/**
 * Selects the branches of every skill of one training day as a fold: each
 * skill starts from the used branches of the skills before it. An empty
 * skill leaves the other skills of the day as they are. Every skill reads
 * the prevention skills and the lower body directions of the day.
 *
 * selectDayBranches([warmUp, hypertrophy], "STUDIO", profile, input)
 * → { selections: [{ type: "BRANCHES", skill: "WU", ... }, { type: "EMPTY_SKILL", skill: "SWR1" }],
 *     usedBranchIds: ["3", "8"] }
 */
export const selectDayBranches = (
  requests: readonly SkillSelectionRequest[],
  place: TrainingDayType["place"],
  profile: DerivedProfile,
  input: PlanGenerationInput,
): DayBranchSelection => {
  const day: SelectionDay = {
    place,
    usedBranchIds: [],
    preventionSkills: requests
      .map(({ skill }) => skill)
      .filter((skill) =>
        Object.hasOwn(input.authoredData.preventionRegions, skill),
      ),
    lowerBodyDirections: hasFullBodyGks(requests)
      ? "LOWER_BODY_GKS"
      : "LOWER_BODY",
  };
  const [selections, usedBranchIds] = mapReduce(
    requests,
    day.usedBranchIds,
    (request, usedBranchIds) => {
      const step = selectSkillBranches(
        request,
        { ...day, usedBranchIds },
        profile,
        input,
      );
      return [step.selection, step.usedBranchIds] as const;
    },
  );
  return { selections, usedBranchIds };
};
