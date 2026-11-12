import i18n from "@/i18n";
import { type Block, type Template } from "@/schemas/aiwl.schema";

export const TRAINING_TIMES = [15, 30, 45, 60] as const;
export type TrainingTime = (typeof TRAINING_TIMES)[number];

export type GeneratedTrainingFocus =
  | "hypertrophy"
  | "explosive"
  | "mobility"
  | "cardio";
export type GeneratedTrainingRegion =
  | "upperBody"
  | "lowerBody"
  | "core"
  | "fullBody";

export type GeneratedTrainingInput = {
  minutes: TrainingTime;
  focus: GeneratedTrainingFocus;
  /** Ignored for cardio. The full body lifts the restriction to regions. */
  regions: GeneratedTrainingRegion[];
};

const WARM_UP_SKILL = "WU";
const COOL_DOWN_SKILL = "CD";

// The explosive power skill tree has no core exercises.
const FOCUS_SKILLS: Record<
  GeneratedTrainingFocus,
  { skill: string; regions: GeneratedTrainingRegion[] }
> = {
  hypertrophy: {
    skill: "SWR1",
    regions: ["upperBody", "lowerBody", "core", "fullBody"],
  },
  explosive: { skill: "SK", regions: ["upperBody", "lowerBody", "fullBody"] },
  mobility: {
    skill: "MOB",
    regions: ["upperBody", "lowerBody", "core", "fullBody"],
  },
  cardio: { skill: "CARDIO_2", regions: [] },
};

const REGION_TAGS: Record<
  Exclude<GeneratedTrainingRegion, "fullBody">,
  string
> = {
  upperBody: "REGION_UPPER_BODY",
  lowerBody: "REGION_LOWER_BODY",
  core: "REGION_CORE",
};

// Rough minutes one exercise takes with the sets and rests of its skill.
const MINUTES_PER_EXERCISE: Record<string, number> = {
  WU: 1.5,
  CD: 1,
  MOB: 1.5,
  SWR1: 4,
  SK: 5,
};
const WARM_UP_SHARE = 0.15;
const COOL_DOWN_SHARE = 0.08;

/** Regions the form offers for a focus, in display order. */
export const listRegionsForFocus = (
  focus: GeneratedTrainingFocus,
): GeneratedTrainingRegion[] => FOCUS_SKILLS[focus].regions;

const countExercises = (minutes: number, skill: string): number =>
  Math.max(1, Math.round(minutes / MINUTES_PER_EXERCISE[skill]));

const buildUnrestrictedBlock = (skill: string, minutes: number): Block => ({
  kind: "picks",
  skill,
  picks: [{ tags: [], count: countExercises(minutes, skill) }],
});

/** One pick per region, with the exercises split evenly over the regions. */
const buildRegionPicks = (
  regions: GeneratedTrainingRegion[],
  count: number,
): { tags: string[]; count: number }[] => {
  const tags = regions.flatMap((region) =>
    region === "fullBody" ? [] : [REGION_TAGS[region]],
  );
  if (regions.includes("fullBody") || tags.length === 0) {
    return [{ tags: [], count }];
  }
  const trained = tags.slice(0, count);
  const share = Math.floor(count / trained.length);
  const leftover = count % trained.length;
  return trained.map((tag, index) => ({
    tags: [tag],
    count: share + (index < leftover ? 1 : 0),
  }));
};

const buildMainBlock = (
  { focus, regions }: GeneratedTrainingInput,
  minutes: number,
): Block => {
  const { skill, regions: offered } = FOCUS_SKILLS[focus];
  if (focus === "cardio") {
    return { kind: "duration", skill, duration: Math.round(minutes) * 60 };
  }
  return {
    kind: "picks",
    skill,
    picks: buildRegionPicks(
      regions.filter((region) => offered.includes(region)),
      countExercises(minutes, skill),
    ),
  };
};

const planBlockMinutes = (block: Block): number => {
  if (block.kind === "duration") return block.duration / 60;
  if (block.kind !== "picks" || !Array.isArray(block.picks)) return 0;
  const exercises = block.picks.reduce((sum, pick) => sum + pick.count, 0);
  return exercises * (MINUTES_PER_EXERCISE[block.skill] ?? 0);
};

/** Rough length of a generated template in minutes. */
export const planTemplateMinutes = (template: Template): number =>
  template.blocks.reduce((sum, block) => sum + planBlockMinutes(block), 0);

const buildName = ({
  focus,
  minutes,
}: GeneratedTrainingInput): Template["name"] => {
  const nameIn = (language: string) =>
    i18n.getFixedT(language)("screens.home.generateTraining.trainingName", {
      focus: i18n.getFixedT(language)(
        `screens.home.generateTraining.focuses.${focus}`,
      ),
      minutes,
    });
  return { en: nameIn("en"), de: nameIn("de") };
};

/**
 * Builds the AIWL template of a generated training: a warm-up, the main
 * section of the focus and a cool-down, sized to the training time.
 */
export const buildGeneratedTemplate = (
  input: GeneratedTrainingInput,
  id: string,
): Template => {
  const warmUp = buildUnrestrictedBlock(
    WARM_UP_SKILL,
    input.minutes * WARM_UP_SHARE,
  );
  const coolDown = buildUnrestrictedBlock(
    COOL_DOWN_SKILL,
    input.minutes * COOL_DOWN_SHARE,
  );
  const mainMinutes =
    input.minutes - planBlockMinutes(warmUp) - planBlockMinutes(coolDown);
  return {
    aiwl: 1,
    id,
    name: buildName(input),
    blocks: [warmUp, buildMainBlock(input, mainMinutes), coolDown],
  };
};
