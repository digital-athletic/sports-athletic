/**
 * The workout builder's model. A draft contains a name, an optional warm-up,
 * an optional cool-down and sections. This file validates a draft and converts
 * it to and from an AIWL template.
 *
 * Every draft that validates converts into a template the athlete app imports,
 * because each skill in the table below offers only the tags its skill tree
 * can serve in both weight variants. Prevention areas belong to the prevention section,
 * which offers no body region. The table follows the athlete app's skill trees
 * and must change when they change.
 */
import type { AiwlBlock, AiwlTemplate } from "../types/team";

export const REGION_TAGS = [
  "REGION_UPPER_BODY",
  "REGION_LOWER_BODY",
  "REGION_CORE",
  "REGION_FULL_BODY",
] as const;

export const PREVENTION_TAGS = [
  "PREVENTION_SHOULDER",
  "PREVENTION_KNEE_HIP",
  "PREVENTION_SPINE",
  "PREVENTION_ANKLE",
  "PREVENTION_WRIST_ELBOW",
] as const;

export type RegionTag = (typeof REGION_TAGS)[number];
export type PreventionTag = (typeof PREVENTION_TAGS)[number];
export type BuilderTag = RegionTag | PreventionTag;

export type SectionKind = "picks" | "duration";

export interface BuilderSkill {
  /** The AIWL skill code, e.g. "GKS". */
  id: string;
  kind: SectionKind;
  tags: readonly BuilderTag[];
}

const picks = (id: string, tags: readonly BuilderTag[]): BuilderSkill => ({
  id,
  kind: "picks",
  tags,
});

const cardio = (id: string): BuilderSkill => ({
  id,
  kind: "duration",
  tags: [],
});

const UPPER_AND_LOWER = ["REGION_UPPER_BODY", "REGION_LOWER_BODY"] as const;

/**
 * The fixed list of skills, in the order the builder offers them. The list
 * omits warm-up and cool-down, which are the draft's two checkboxes. Zone 1
 * has two trees: CARDIO_1_SHORT with 10 second sprints and CARDIO_1_LAKTAT
 * with 30 second intervals.
 */
export const BUILDER_SKILLS: readonly BuilderSkill[] = [
  picks("MOB", [...UPPER_AND_LOWER, "REGION_CORE"]),
  picks("GKS", ["REGION_UPPER_BODY", "REGION_FULL_BODY"]),
  picks("BAS", []),
  picks("PREV", PREVENTION_TAGS),
  picks("SWR1", [...UPPER_AND_LOWER, "REGION_CORE"]),
  picks("SK", UPPER_AND_LOWER),
  picks("PLYO_MEDIUM", ["REGION_LOWER_BODY"]),
  picks("WUSKSA", UPPER_AND_LOWER),
  picks("BR", UPPER_AND_LOWER),
  cardio("CARDIO_1_SHORT"),
  cardio("CARDIO_1_LAKTAT"),
  cardio("CARDIO_2"),
  cardio("CARDIO_3"),
  cardio("CARDIO_4"),
  cardio("CARDIO_5"),
];

const WARM_UP_SKILL = "WU";
const COOL_DOWN_SKILL = "CD";

/** Exercises for a picks section, minutes for a cardio section. */
export const AMOUNT_RANGES: Record<SectionKind, { min: number; max: number }> =
  {
    picks: { min: 1, max: 20 },
    duration: { min: 5, max: 120 },
  };

/** The unit of a section's amount, also its translation key. */
export const AMOUNT_UNITS = {
  picks: "exercises",
  duration: "minutes",
} as const satisfies Record<SectionKind, string>;

const DEFAULT_AMOUNTS: Record<SectionKind, number> = {
  picks: 5,
  duration: 20,
};

// The athlete app's import caps: 20 blocks and 100 name characters.
export const MAX_SECTIONS = 20;
export const MAX_NAME_LENGTH = 100;

export interface SectionDraft {
  /** A local key for React lists and error messages; never saved. */
  key: string;
  skill: string;
  tags: BuilderTag[];
  /** NaN while the field is empty. */
  amount: number;
}

/** The warm-up or the cool-down: ticked or not, with its exercise count. */
export interface BookendDraft {
  enabled: boolean;
  /** NaN while the field is empty. */
  amount: number;
}

export interface WorkoutDraft {
  name: string;
  warmUp: BookendDraft;
  coolDown: BookendDraft;
  sections: SectionDraft[];
}

export type DraftError =
  | { code: "NAME_REQUIRED" }
  | { code: "NAME_TOO_LONG" }
  | { code: "SECTION_REQUIRED" }
  | { code: "TOO_MANY_SECTIONS" }
  | { code: "WARM_UP_OUT_OF_RANGE" }
  | { code: "COOL_DOWN_OUT_OF_RANGE" }
  | { code: "UNKNOWN_SKILL"; sectionKey: string }
  | { code: "AMOUNT_OUT_OF_RANGE"; sectionKey: string }
  | { code: "TAG_NOT_ALLOWED"; sectionKey: string };

export const createEmptyDraft = (): WorkoutDraft => ({
  name: "",
  warmUp: { enabled: false, amount: DEFAULT_AMOUNTS.picks },
  coolDown: { enabled: false, amount: DEFAULT_AMOUNTS.picks },
  sections: [],
});

export const findBuilderSkill = (id: string): BuilderSkill | undefined =>
  BUILDER_SKILLS.find((skill) => skill.id === id);

const isPreventionTag = (tag: string): tag is PreventionTag =>
  (PREVENTION_TAGS as readonly string[]).includes(tag);

/** The group a skill's tags belong to, also the translation key of its label. */
export const tagGroupOf = (skill: BuilderSkill): "regions" | "prevention" =>
  skill.tags.some(isPreventionTag) ? "prevention" : "regions";

export const sectionKind = (section: SectionDraft): SectionKind =>
  findBuilderSkill(section.skill)?.kind ?? "picks";

export const createSection = (key: string, skillId: string): SectionDraft => ({
  key,
  skill: skillId,
  tags: [],
  amount: DEFAULT_AMOUNTS[findBuilderSkill(skillId)?.kind ?? "picks"],
});

/**
 * Switches the skill of a section and drops the tags the new skill does not
 * offer. A switch between exercises and minutes resets the amount.
 */
export const changeSectionSkill = (
  section: SectionDraft,
  skillId: string,
): SectionDraft => {
  const next = findBuilderSkill(skillId);
  if (!next) return section;
  return {
    ...section,
    skill: skillId,
    tags: section.tags.filter((tag) => next.tags.includes(tag)),
    amount:
      next.kind === sectionKind(section)
        ? section.amount
        : DEFAULT_AMOUNTS[next.kind],
  };
};

/** True when the skill of the section offers the tag. */
export const isTagSelectable = (
  section: SectionDraft,
  tag: BuilderTag,
): boolean => findBuilderSkill(section.skill)?.tags.includes(tag) ?? false;

export const toggleSectionTag = (
  section: SectionDraft,
  tag: BuilderTag,
): SectionDraft => {
  if (section.tags.includes(tag)) {
    return { ...section, tags: section.tags.filter((t) => t !== tag) };
  }
  if (!isTagSelectable(section, tag)) return section;
  return { ...section, tags: [...section.tags, tag] };
};

/** Moves the section at `index` by `offset` places; out of range is a no-op. */
export const moveSection = (
  sections: SectionDraft[],
  index: number,
  offset: number,
): SectionDraft[] => {
  const target = index + offset;
  if (
    index < 0 ||
    index >= sections.length ||
    target < 0 ||
    target >= sections.length
  ) {
    return sections;
  }
  const next = [...sections];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
};

const isAmountInRange = (amount: number, kind: SectionKind): boolean => {
  const { min, max } = AMOUNT_RANGES[kind];
  return Number.isInteger(amount) && amount >= min && amount <= max;
};

const validateSection = (section: SectionDraft): DraftError[] => {
  const skill = findBuilderSkill(section.skill);
  if (!skill) return [{ code: "UNKNOWN_SKILL", sectionKey: section.key }];
  const errors: DraftError[] = [];
  if (!isAmountInRange(section.amount, skill.kind)) {
    errors.push({ code: "AMOUNT_OUT_OF_RANGE", sectionKey: section.key });
  }
  if (!section.tags.every((tag) => isTagSelectable(section, tag))) {
    errors.push({ code: "TAG_NOT_ALLOWED", sectionKey: section.key });
  }
  return errors;
};

const isBookendValid = (bookend: BookendDraft): boolean =>
  !bookend.enabled || isAmountInRange(bookend.amount, "picks");

/** The number of blocks the draft saves: the sections plus the ticked warm-up and cool-down. */
export const countBlocks = (draft: WorkoutDraft): number =>
  draft.sections.length +
  Number(draft.warmUp.enabled) +
  Number(draft.coolDown.enabled);

/** Every reason the draft cannot be saved; empty when it can. */
export const validateDraft = (draft: WorkoutDraft): DraftError[] => {
  const name = draft.name.trim();
  const errors: DraftError[] = [];
  if (name === "") errors.push({ code: "NAME_REQUIRED" });
  if (name.length > MAX_NAME_LENGTH) errors.push({ code: "NAME_TOO_LONG" });
  if (draft.sections.length === 0) errors.push({ code: "SECTION_REQUIRED" });
  if (countBlocks(draft) > MAX_SECTIONS) {
    errors.push({ code: "TOO_MANY_SECTIONS" });
  }
  if (!isBookendValid(draft.warmUp)) {
    errors.push({ code: "WARM_UP_OUT_OF_RANGE" });
  }
  if (!isBookendValid(draft.coolDown)) {
    errors.push({ code: "COOL_DOWN_OUT_OF_RANGE" });
  }
  return [...errors, ...draft.sections.flatMap(validateSection)];
};

const sectionToBlock = (section: SectionDraft): AiwlBlock =>
  sectionKind(section) === "duration"
    ? { kind: "duration", skill: section.skill, duration: section.amount * 60 }
    : {
        kind: "picks",
        skill: section.skill,
        picks: [{ tags: section.tags, count: section.amount }],
      };

const bookendToBlocks = (bookend: BookendDraft, skill: string): AiwlBlock[] =>
  bookend.enabled
    ? [{ kind: "picks", skill, picks: [{ tags: [], count: bookend.amount }] }]
    : [];

/**
 * Converts a draft that passed validateDraft into an AIWL template, e.g.
 * { name: "Tuesday stability", sections: [{ skill: "CARDIO_2", amount: 20 }] }
 * → { aiwl: 1, id, name: { en: "Tuesday stability" }, blocks: [{ kind: "duration", skill: "CARDIO_2", duration: 1200 }] }
 */
export const draftToTemplate = (
  draft: WorkoutDraft,
  id: string,
): AiwlTemplate => ({
  aiwl: 1,
  id,
  name: { en: draft.name.trim() },
  blocks: [
    ...bookendToBlocks(draft.warmUp, WARM_UP_SKILL),
    ...draft.sections.map(sectionToBlock),
    ...bookendToBlocks(draft.coolDown, COOL_DOWN_SKILL),
  ],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPositiveInteger = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 1;

/** The English name of a stored template, or "" when it has none. */
export const readTemplateName = (template: unknown): string => {
  if (!isRecord(template) || !isRecord(template.name)) return "";
  const name = template.name.en;
  return typeof name === "string" ? name : "";
};

/**
 * The only pick of a picks block. Undefined when the block has no pick or
 * several, or when the count is no whole number from 1 up.
 */
const readSinglePick = (
  block: Record<string, unknown>,
): { tags: unknown; count: number } | undefined => {
  const picksList = block.picks;
  if (block.kind !== "picks" || !Array.isArray(picksList)) return undefined;
  if (picksList.length !== 1) return undefined;
  const [pick]: unknown[] = picksList;
  if (!isRecord(pick) || !isPositiveInteger(pick.count)) return undefined;
  return { tags: pick.tags, count: pick.count };
};

const blockToSection = (
  block: unknown,
  key: string,
): SectionDraft | undefined => {
  if (!isRecord(block) || typeof block.skill !== "string") return undefined;
  const skill = findBuilderSkill(block.skill);
  if (!skill) return undefined;
  if (block.kind === "duration" && skill.kind === "duration") {
    const minutes =
      typeof block.duration === "number" ? block.duration / 60 : undefined;
    if (!isPositiveInteger(minutes)) return undefined;
    return { key, skill: skill.id, tags: [], amount: minutes };
  }
  if (skill.kind !== "picks") return undefined;
  const pick = readSinglePick(block);
  if (!pick || !Array.isArray(pick.tags)) return undefined;
  const stored: unknown[] = pick.tags;
  // A stored tag the skill does not offer is dropped, like an unknown block.
  const tags = skill.tags.filter((tag) => stored.includes(tag));
  return { key, skill: skill.id, tags, amount: pick.count };
};

/** Reads the block as a warm-up or cool-down when the block's skill is `skill`. */
const blockToBookend = (
  block: unknown,
  skill: string,
): BookendDraft | undefined => {
  if (!isRecord(block) || block.skill !== skill) return undefined;
  const pick = readSinglePick(block);
  return pick ? { enabled: true, amount: pick.count } : undefined;
};

/**
 * Reads a stored template back into a draft. A leading warm-up and a trailing
 * cool-down become the two checkboxes. A block the builder cannot show, such
 * as a skill outside its list, is dropped. Returns undefined when the value is
 * no template. `makeKey` gives each section its local key.
 */
export const templateToDraft = (
  template: unknown,
  makeKey: () => string,
): WorkoutDraft | undefined => {
  if (!isRecord(template) || !Array.isArray(template.blocks)) return undefined;
  const blocks: unknown[] = template.blocks;
  const empty = createEmptyDraft();
  const warmUp = blockToBookend(blocks[0], WARM_UP_SKILL);
  const coolDown = blockToBookend(blocks.at(-1), COOL_DOWN_SKILL);
  const middle = blocks.slice(warmUp ? 1 : 0, coolDown ? -1 : undefined);
  return {
    name: readTemplateName(template),
    warmUp: warmUp ?? empty.warmUp,
    coolDown: coolDown ?? empty.coolDown,
    sections: middle.flatMap((block) => {
      const section = blockToSection(block, makeKey());
      return section ? [section] : [];
    }),
  };
};
