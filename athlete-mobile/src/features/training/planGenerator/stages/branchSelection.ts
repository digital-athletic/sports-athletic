import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type {
  DirectionEntry,
  DirectionsMap,
  RegionTagEntry,
} from "@/schemas/generator.schema";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import type { PlanGenerationInput } from "../planGenerationInput/planGenerationInput";
import type { BranchRuleChainDay } from "../ruleFamilies/branchRuleChain";
import {
  filterSlotCandidates,
  isOneSided,
  type SlotCandidate,
  type WeightType,
} from "./branchSlotFilters";
import type { DerivedProfile } from "./profileDerivation";
import {
  drawItem,
  isPlaceWeighted,
  type MovementRegion,
  readEntryPool,
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

const MAX_STRENGTH_SKILLS = ["MAX", "MAX_STRENGTH"];
const STRENGTH_SKILLS = [
  "SWR1",
  "SWR2",
  "SWR1KG",
  "SWR2KG",
  ...MAX_STRENGTH_SKILLS,
  "SK",
  "SKKG",
  "SA",
  "SAKG",
];
const ISOLATED_SHARE = 0.3;
const WEIGHTED_DRAW_SHARE = 0.5;

/**
 * The weighted share of Plan Workout Generation, or null when it does not
 * apply: at a place without weights, and for max strength.
 */
const readWeightedShare = (context: SkillContext): number | null => {
  const { skill, day, profile } = context;
  if (MAX_STRENGTH_SKILLS.includes(skill)) return null;
  if (!isPlaceWeighted(context)) return null;
  if (profile.ageGroup === WorkoutConstants.AGE_GROUPS.CHILD) return 0.3;
  if (day.place !== "STUDIO") return 0.5;
  return STRENGTH_SKILLS.includes(skill) ? 0.8 : 0.6;
};

// Keys count exercises; a larger count reads the largest key.
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

const createQuotas = (
  share: number | null,
  slotCount: number,
): Quotas | null => {
  if (share === null) return null;
  const weighted = Math.ceil(share * slotCount);
  return { WEIGHTED: weighted, BODYWEIGHT: slotCount - weighted };
};

// A slot draws its type while both quotas are open, then takes the open one.
const drawWeightType = (
  quotas: Quotas | null,
  random: () => number,
): WeightType | null => {
  if (quotas === null) return null;
  if (quotas.WEIGHTED > 0 && quotas.BODYWEIGHT > 0) {
    return random() < WEIGHTED_DRAW_SHARE ? "WEIGHTED" : "BODYWEIGHT";
  }
  return quotas.WEIGHTED > 0 ? "WEIGHTED" : "BODYWEIGHT";
};

interface EntryState {
  readonly candidates: readonly SlotCandidate[];
  readonly directions: readonly DirectionEntry[];
  readonly untrainedBigMuscles: readonly string[];
  readonly quotas: Quotas | null;
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
  const weightType = drawWeightType(state.quotas, random);
  const involvement = random() < ISOLATED_SHARE ? "ISOLATED" : "COMPLEX";
  const result = filterSlotCandidates(state.candidates, {
    directions: state.directions,
    untrainedBigMuscles: state.untrainedBigMuscles,
    isLastSlot: state.filledSlots === slotCount - 1,
    involvement,
    prefersBarbell: MAX_STRENGTH_SKILLS.includes(context.skill),
    weightType,
  });
  const pick = drawItem(result.survivors, random);
  const pickMuscles = getTagValues(pick.branch.tags, TagGroups.MUSCLE);
  return {
    candidates: state.candidates.filter((candidate) => candidate !== pick),
    directions: state.directions.filter(
      (_, index) => index !== result.directionIndex,
    ),
    untrainedBigMuscles: state.untrainedBigMuscles.filter(
      (muscle) => !pickMuscles.includes(muscle),
    ),
    quotas:
      state.quotas && result.weightType
        ? {
            ...state.quotas,
            [result.weightType]: state.quotas[result.weightType] - 1,
          }
        : state.quotas,
    // The workout lists a one-sided exercise for each side, which takes two slots.
    filledSlots: state.filledSlots + (isOneSided(pick) ? 2 : 1),
    picks: [...state.picks, pick],
  };
};

/** The picks of a skill so far and the weighted/bodyweight quotas it has left. */
interface SkillState {
  readonly picks: readonly SlotCandidate[];
  readonly quotas: Quotas | null;
}

/**
 * Fills the slots of one tag entry from the skill's remaining quotas. A
 * candidate that resolves to an exercise the skill already holds is skipped.
 */
const fillTagEntry = (
  entry: RegionTagEntry,
  { picks: heldPicks, quotas }: SkillState,
  context: SkillContext,
): SkillState => {
  const { candidates, region } = readEntryPool(entry, context);
  const slotCount = Math.min(entry.count, candidates.length);
  let state: EntryState = {
    candidates,
    directions: region
      ? readDirectionSequence(
          context.input.authoredData.movementDirections[region],
          entry.count,
        )
      : [],
    untrainedBigMuscles: region ? BIG_MUSCLES_BY_REGION[region] : [],
    quotas,
    filledSlots: 0,
    picks: [],
  };
  while (state.filledSlots < slotCount) {
    const heldExerciseIds = [...heldPicks, ...state.picks].map(
      ({ exercise }) => exercise.id,
    );
    const open = state.candidates.filter(
      ({ exercise }) => !heldExerciseIds.includes(exercise.id),
    );
    if (open.length === 0) break;
    state = fillSlot({ ...state, candidates: open }, slotCount, context);
  }
  return { picks: [...heldPicks, ...state.picks], quotas: state.quotas };
};

const toSelectedBranch = ({
  branchId,
  branch,
}: SlotCandidate): SelectedBranch => ({
  branchId,
  tags: branch.tags,
  levels: branch.levels,
});

const listBranchIds = (picks: readonly SlotCandidate[]): string[] =>
  picks.map(({ branchId }) => branchId);

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
  day: BranchRuleChainDay,
  profile: DerivedProfile,
  input: PlanGenerationInput,
): SkillSelectionStep => {
  const skillContext: SkillContext = { skill, day, profile, input };
  // The share is a quota over all slots of the skill, Plan Workout Generation.
  const slotCount = tagEntries.reduce((sum, { count }) => sum + count, 0);
  const { picks } = tagEntries.reduce<SkillState>(
    (state, entry) =>
      fillTagEntry(entry, state, {
        ...skillContext,
        day: {
          place: day.place,
          usedBranchIds: [...day.usedBranchIds, ...listBranchIds(state.picks)],
        },
      }),
    {
      picks: [],
      quotas: createQuotas(readWeightedShare(skillContext), slotCount),
    },
  );
  return {
    selection:
      picks.length > 0
        ? { type: "BRANCHES", skill, branches: picks.map(toSelectedBranch) }
        : { type: "EMPTY_SKILL", skill },
    usedBranchIds: [...day.usedBranchIds, ...listBranchIds(picks)],
  };
};

/**
 * Selects the branches of every skill of one training day as a fold: each
 * skill starts from the used branches of the skills before it. An empty
 * skill leaves the other skills of the day as they are.
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
): DayBranchSelection =>
  requests.reduce<DayBranchSelection>(
    ({ selections, usedBranchIds }, request) => {
      const step = selectSkillBranches(
        request,
        { place, usedBranchIds },
        profile,
        input,
      );
      return {
        selections: [...selections, step.selection],
        usedBranchIds: step.usedBranchIds,
      };
    },
    { selections: [], usedBranchIds: [] },
  );
