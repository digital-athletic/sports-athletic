import type { SectionTemplates } from "@/data/loadPlanAuthoredData";
import type {
  SectionEntry,
  TrainingSectionsMap,
} from "@/schemas/generator.schema";

/**
 * Builds one authored section: hypertrophy stage 1 with zone 2 cardio for one
 * week, unless overridden.
 *
 * generateSectionEntry({ type: "MAX", numOfWeeks: 3 })
 * → { type: "MAX", numOfWeeks: 3, cardioType: "CARDIO_2" }
 */
export const generateSectionEntry = (
  overrides: Partial<SectionEntry> = {},
): SectionEntry => ({
  type: "SWR1",
  numOfWeeks: 1,
  cardioType: "CARDIO_2",
  ...overrides,
});

interface SectionTemplateOptions {
  sectionsByWeeks?: Readonly<Record<number, SectionEntry[]>>;
  repeat?: SectionEntry[];
}

/**
 * Builds a section template with every week key from 1 to 20. A key without
 * given sections holds one hypertrophy stage 1 section of that many weeks.
 *
 * generateSectionTemplate({ sectionsByWeeks: { 8: [maxSection] }, repeat: [skSection] })
 * → { 1: [SWR1 1 week], ..., 8: [maxSection], ..., 20: [SWR1 20 weeks], repeat: [skSection] }
 */
export const generateSectionTemplate = ({
  sectionsByWeeks = {},
  repeat,
}: SectionTemplateOptions = {}): TrainingSectionsMap => {
  const template: TrainingSectionsMap = {};
  for (let weeks = 1; weeks <= 20; weeks++) {
    template[String(weeks)] = sectionsByWeeks[weeks] ?? [
      generateSectionEntry({ numOfWeeks: weeks }),
    ];
  }
  if (repeat) template.repeat = repeat;
  return template;
};

/**
 * Builds section templates from templates keyed by "phase/ageGroup/level" in
 * lower case. The preparatory adult advanced fallback is always present.
 *
 * generateSectionTemplates({ "pause/child/beginner": childTemplate })
 * → { preparatory: { adult: { advanced: defaultTemplate } },
 *     pause: { child: { beginner: childTemplate } } }
 */
export const generateSectionTemplates = (
  templatesByKey: Readonly<Record<string, TrainingSectionsMap>> = {},
): SectionTemplates => {
  const templates: Record<
    string,
    Record<string, Record<string, TrainingSectionsMap>>
  > = {};
  const entries = Object.entries({
    "preparatory/adult/advanced": generateSectionTemplate(),
    ...templatesByKey,
  });
  for (const [key, template] of entries) {
    const [seasonPhase, ageGroup, level] = key.split("/");
    templates[seasonPhase] ??= {};
    templates[seasonPhase][ageGroup] ??= {};
    templates[seasonPhase][ageGroup][level] = template;
  }
  return templates;
};
