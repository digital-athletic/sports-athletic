/**
 * The workout builder's model: a draft of a name and sections, its validation,
 * and the conversion between a draft and an AIWL template.
 *
 * Every draft that validates converts into a template the athlete app imports,
 * because of two rules. First, each skill in the table below offers only the
 * tags its skill tree can serve in both weight variants. Second, a section takes
 * tags from one group only: the generator joins the tags of one group with OR
 * but the groups with AND, so a mixed pick such as stability with the upper body
 * and the knee finds no exercise. The table is checked in
 * athlete-mobile/src/features/customWorkouts/teamWorkoutBuilderTemplates.spec.ts,
 * which must change together with it.
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
  regionTags: readonly RegionTag[];
  preventionTags: readonly PreventionTag[];
}

const cardio = (id: string): BuilderSkill => ({
  id,
  kind: "duration",
  regionTags: [],
  preventionTags: [],
});

/**
 * The fixed list of skills, in the order the builder offers them. Zone 1 is
 * CARDIO_1_LAKTAT, the zone 1 tree with a heart rate range like zones 2 to 5.
 * CARDIO_1_SHORT contains 10 second sprints and is not offered.
 */
export const BUILDER_SKILLS: readonly BuilderSkill[] = [
  {
    id: "WU",
    kind: "picks",
    regionTags: ["REGION_UPPER_BODY", "REGION_LOWER_BODY"],
    preventionTags: ["PREVENTION_KNEE_HIP", "PREVENTION_ANKLE"],
  },
  {
    id: "MOB",
    kind: "picks",
    regionTags: ["REGION_UPPER_BODY", "REGION_LOWER_BODY", "REGION_CORE"],
    preventionTags: [
      "PREVENTION_SHOULDER",
      "PREVENTION_KNEE_HIP",
      "PREVENTION_SPINE",
      "PREVENTION_ANKLE",
    ],
  },
  {
    id: "GKS",
    kind: "picks",
    regionTags: ["REGION_UPPER_BODY", "REGION_FULL_BODY"],
    preventionTags: [
      "PREVENTION_SHOULDER",
      "PREVENTION_KNEE_HIP",
      "PREVENTION_ANKLE",
    ],
  },
  {
    id: "PREV",
    kind: "picks",
    regionTags: REGION_TAGS,
    preventionTags: PREVENTION_TAGS,
  },
  {
    id: "SWR1",
    kind: "picks",
    regionTags: ["REGION_UPPER_BODY", "REGION_LOWER_BODY", "REGION_CORE"],
    preventionTags: [
      "PREVENTION_SHOULDER",
      "PREVENTION_KNEE_HIP",
      "PREVENTION_SPINE",
      "PREVENTION_ANKLE",
    ],
  },
  {
    id: "SK",
    kind: "picks",
    regionTags: ["REGION_UPPER_BODY", "REGION_LOWER_BODY"],
    preventionTags: [],
  },
  {
    id: "PLYO_MEDIUM",
    kind: "picks",
    regionTags: ["REGION_LOWER_BODY"],
    preventionTags: [],
  },
  {
    id: "CD",
    kind: "picks",
    regionTags: ["REGION_UPPER_BODY", "REGION_LOWER_BODY"],
    preventionTags: [],
  },
  cardio("CARDIO_1_LAKTAT"),
  cardio("CARDIO_2"),
  cardio("CARDIO_3"),
  cardio("CARDIO_4"),
  cardio("CARDIO_5"),
];

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

export interface WorkoutDraft {
  name: string;
  sections: SectionDraft[];
}

export type DraftError =
  | { code: "NAME_REQUIRED" }
  | { code: "NAME_TOO_LONG" }
  | { code: "SECTION_REQUIRED" }
  | { code: "TOO_MANY_SECTIONS" }
  | { code: "UNKNOWN_SKILL"; sectionKey: string }
  | { code: "AMOUNT_OUT_OF_RANGE"; sectionKey: string }
  | { code: "TAG_NOT_ALLOWED"; sectionKey: string };

export const findBuilderSkill = (id: string): BuilderSkill | undefined =>
  BUILDER_SKILLS.find((skill) => skill.id === id);

const isRegionTag = (tag: string): tag is RegionTag =>
  (REGION_TAGS as readonly string[]).includes(tag);

const isPreventionTag = (tag: string): tag is PreventionTag =>
  (PREVENTION_TAGS as readonly string[]).includes(tag);

const isBuilderTag = (tag: unknown): tag is BuilderTag =>
  typeof tag === "string" && (isRegionTag(tag) || isPreventionTag(tag));

/** The generator finds no exercise for a pick that mixes the two groups. */
const isOneGroup = (tags: readonly BuilderTag[]): boolean =>
  tags.every(isRegionTag) || tags.every(isPreventionTag);

const allowedTagsOf = (skill: BuilderSkill): readonly BuilderTag[] => [
  ...skill.regionTags,
  ...skill.preventionTags,
];

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
  const allowed = allowedTagsOf(next);
  return {
    ...section,
    skill: skillId,
    tags: section.tags.filter((tag) => allowed.includes(tag)),
    amount:
      next.kind === sectionKind(section)
        ? section.amount
        : DEFAULT_AMOUNTS[next.kind],
  };
};

/**
 * True when the tag can be checked: the skill offers it, and the section
 * contains no tag of the other group.
 */
export const isTagSelectable = (
  section: SectionDraft,
  tag: BuilderTag,
): boolean => {
  const skill = findBuilderSkill(section.skill);
  return (
    skill !== undefined &&
    allowedTagsOf(skill).includes(tag) &&
    isOneGroup([...section.tags, tag])
  );
};

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

const isAmountInRange = (section: SectionDraft): boolean => {
  const { min, max } = AMOUNT_RANGES[sectionKind(section)];
  return (
    Number.isInteger(section.amount) &&
    section.amount >= min &&
    section.amount <= max
  );
};

const hasAllowedTags = (
  section: SectionDraft,
  skill: BuilderSkill,
): boolean => {
  const allowed = allowedTagsOf(skill);
  return (
    section.tags.every((tag) => allowed.includes(tag)) &&
    isOneGroup(section.tags)
  );
};

const validateSection = (section: SectionDraft): DraftError[] => {
  const skill = findBuilderSkill(section.skill);
  if (!skill) return [{ code: "UNKNOWN_SKILL", sectionKey: section.key }];
  const errors: DraftError[] = [];
  if (!isAmountInRange(section)) {
    errors.push({ code: "AMOUNT_OUT_OF_RANGE", sectionKey: section.key });
  }
  if (!hasAllowedTags(section, skill)) {
    errors.push({ code: "TAG_NOT_ALLOWED", sectionKey: section.key });
  }
  return errors;
};

/** Every reason the draft cannot be saved; empty when it can. */
export const validateDraft = (draft: WorkoutDraft): DraftError[] => {
  const name = draft.name.trim();
  const errors: DraftError[] = [];
  if (name === "") errors.push({ code: "NAME_REQUIRED" });
  if (name.length > MAX_NAME_LENGTH) errors.push({ code: "NAME_TOO_LONG" });
  if (draft.sections.length === 0) errors.push({ code: "SECTION_REQUIRED" });
  if (draft.sections.length > MAX_SECTIONS) {
    errors.push({ code: "TOO_MANY_SECTIONS" });
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
  blocks: draft.sections.map(sectionToBlock),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The English name of a stored template, or "" when it has none. */
export const readTemplateName = (template: unknown): string => {
  if (!isRecord(template) || !isRecord(template.name)) return "";
  const name = template.name.en;
  return typeof name === "string" ? name : "";
};

const blockToSection = (
  block: unknown,
  key: string,
): SectionDraft | undefined => {
  if (!isRecord(block) || typeof block.skill !== "string") return undefined;
  const skill = findBuilderSkill(block.skill);
  if (!skill) return undefined;
  if (block.kind === "duration" && skill.kind === "duration") {
    if (typeof block.duration !== "number" || block.duration % 60 !== 0) {
      return undefined;
    }
    return { key, skill: skill.id, tags: [], amount: block.duration / 60 };
  }
  if (block.kind !== "picks" || skill.kind !== "picks") return undefined;
  const picks = block.picks;
  if (!Array.isArray(picks) || picks.length !== 1) return undefined;
  const [pick] = picks;
  if (!isRecord(pick) || typeof pick.count !== "number") return undefined;
  const tags: unknown = pick.tags;
  if (!Array.isArray(tags) || !tags.every(isBuilderTag)) return undefined;
  return { key, skill: skill.id, tags, amount: pick.count };
};

/**
 * Reads a stored template back into a draft. Returns undefined when the
 * template contains a block the builder cannot show, such as a skill outside
 * its list.
 * `makeKey` gives each section its local key.
 */
export const templateToDraft = (
  template: unknown,
  makeKey: () => string,
): WorkoutDraft | undefined => {
  if (!isRecord(template) || !Array.isArray(template.blocks)) return undefined;
  const sections = template.blocks.map((block) =>
    blockToSection(block, makeKey()),
  );
  if (!sections.every((section) => section !== undefined)) return undefined;
  return { name: readTemplateName(template), sections };
};
