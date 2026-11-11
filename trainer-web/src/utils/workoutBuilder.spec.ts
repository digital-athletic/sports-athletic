import { describe, expect, it } from "vitest";
import {
  BUILDER_SKILLS,
  MAX_NAME_LENGTH,
  MAX_SECTIONS,
  PREVENTION_TAGS,
  REGION_TAGS,
  createSection,
  draftToTemplate,
  isTagSelectable,
  templateToDraft,
  toggleSectionTag,
  validateDraft,
  type BuilderTag,
  type SectionDraft,
  type WorkoutDraft,
} from "./workoutBuilder";

const ALL_TAGS: readonly BuilderTag[] = [...REGION_TAGS, ...PREVENTION_TAGS];

const pickSkills = BUILDER_SKILLS.filter((skill) => skill.kind === "picks");
const cardioSkills = BUILDER_SKILLS.filter(
  (skill) => skill.kind === "duration",
);

const section = (
  skill: string,
  amount: number,
  tags: BuilderTag[] = [],
  key = "s1",
): SectionDraft => ({ key, skill, tags, amount });

const draftWith = (
  sections: SectionDraft[],
  name = "Tuesday stability",
): WorkoutDraft => ({ name, sections });

/** A key generator that counts up, like the builder's own. */
const keys = (): (() => string) => {
  let next = 0;
  return () => `k${next++}`;
};

describe("draftToTemplate", () => {
  it.each(pickSkills.map((skill) => [skill.id, skill.regionTags.slice(0, 1)]))(
    "writes %s as a picks block with the exercise count",
    (skillId, tags) => {
      const template = draftToTemplate(
        draftWith([section(skillId, 7, [...tags])]),
        "id-1",
      );
      expect(template.blocks).toEqual([
        { kind: "picks", skill: skillId, picks: [{ tags, count: 7 }] },
      ]);
    },
  );

  it.each(cardioSkills.map((skill) => [skill.id]))(
    "writes %s as a duration block in seconds",
    (skillId) => {
      const template = draftToTemplate(
        draftWith([section(skillId, 20)]),
        "id-1",
      );
      expect(template.blocks).toEqual([
        { kind: "duration", skill: skillId, duration: 1200 },
      ]);
    },
  );

  it("writes the version, id and trimmed English name", () => {
    const template = draftToTemplate(
      draftWith([section("CARDIO_2", 30)], "  Tuesday stability  "),
      "id-1",
    );
    expect(template).toMatchObject({
      aiwl: 1,
      id: "id-1",
      name: { en: "Tuesday stability" },
    });
  });
});

describe("validateDraft", () => {
  it("accepts a draft with a name and a section in range", () => {
    expect(
      validateDraft(draftWith([section("GKS", 5, ["REGION_FULL_BODY"])])),
    ).toEqual([]);
  });

  it.each([
    ["an empty name", ""],
    ["a blank name", "   "],
  ])("reports only NAME_REQUIRED for %s", (_label, name) => {
    expect(validateDraft(draftWith([section("GKS", 5)], name))).toEqual([
      { code: "NAME_REQUIRED" },
    ]);
  });

  it(`accepts a name of ${MAX_NAME_LENGTH} characters`, () => {
    const name = "a".repeat(MAX_NAME_LENGTH);
    expect(validateDraft(draftWith([section("GKS", 5)], name))).toEqual([]);
  });

  it(`reports only NAME_TOO_LONG for a name over ${MAX_NAME_LENGTH} characters`, () => {
    const name = "a".repeat(MAX_NAME_LENGTH + 1);
    expect(validateDraft(draftWith([section("GKS", 5)], name))).toEqual([
      { code: "NAME_TOO_LONG" },
    ]);
  });

  it("reports only SECTION_REQUIRED for a draft without sections", () => {
    expect(validateDraft(draftWith([]))).toEqual([
      { code: "SECTION_REQUIRED" },
    ]);
  });

  it(`accepts ${MAX_SECTIONS} sections`, () => {
    const sections = Array.from({ length: MAX_SECTIONS }, (_, index) =>
      section("GKS", 5, [], `s${index}`),
    );
    expect(validateDraft(draftWith(sections))).toEqual([]);
  });

  it(`reports only TOO_MANY_SECTIONS for more than ${MAX_SECTIONS} sections`, () => {
    const sections = Array.from({ length: MAX_SECTIONS + 1 }, (_, index) =>
      section("GKS", 5, [], `s${index}`),
    );
    expect(validateDraft(draftWith(sections))).toEqual([
      { code: "TOO_MANY_SECTIONS" },
    ]);
  });

  it.each([
    ["no exercise", "GKS", 0],
    ["21 exercises", "GKS", 21],
    ["an empty exercise field", "GKS", Number.NaN],
    ["a fraction of exercises", "GKS", 2.5],
    ["4 minutes", "CARDIO_2", 4],
    ["121 minutes", "CARDIO_2", 121],
  ])("reports only AMOUNT_OUT_OF_RANGE for %s", (_label, skillId, amount) => {
    expect(
      validateDraft(draftWith([section(skillId, amount, [], "bad")])),
    ).toEqual([{ code: "AMOUNT_OUT_OF_RANGE", sectionKey: "bad" }]);
  });

  it.each([
    ["exercises", "GKS", 1, 20],
    ["minutes", "CARDIO_2", 5, 120],
  ])("accepts the bounds of the %s range", (_label, skillId, min, max) => {
    expect(
      validateDraft(
        draftWith([
          section(skillId, min, [], "min"),
          section(skillId, max, [], "max"),
        ]),
      ),
    ).toEqual([]);
  });

  it("names the section whose amount is out of range", () => {
    expect(
      validateDraft(
        draftWith([
          section("GKS", 5, [], "good"),
          section("CARDIO_3", 200, [], "bad"),
        ]),
      ),
    ).toEqual([{ code: "AMOUNT_OUT_OF_RANGE", sectionKey: "bad" }]);
  });

  it("reports TAG_NOT_ALLOWED for a tag the skill does not offer", () => {
    expect(
      validateDraft(draftWith([section("SK", 5, ["REGION_CORE"], "bad")])),
    ).toEqual([{ code: "TAG_NOT_ALLOWED", sectionKey: "bad" }]);
  });

  it("reports TAG_NOT_ALLOWED for a section that mixes the two groups", () => {
    expect(
      validateDraft(
        draftWith([
          section(
            "PREV",
            5,
            ["REGION_UPPER_BODY", "PREVENTION_KNEE_HIP"],
            "bad",
          ),
        ]),
      ),
    ).toEqual([{ code: "TAG_NOT_ALLOWED", sectionKey: "bad" }]);
  });
});

describe("tags", () => {
  it.each(BUILDER_SKILLS.map((skill) => [skill.id, skill]))(
    "%s offers only its listed tags",
    (_id, skill) => {
      const listed = new Set<BuilderTag>([
        ...skill.regionTags,
        ...skill.preventionTags,
      ]);
      const empty = createSection("s1", skill.id);
      for (const tag of ALL_TAGS) {
        expect(isTagSelectable(empty, tag), tag).toBe(listed.has(tag));
      }
    },
  );

  it("offers no tag for a cardio skill", () => {
    for (const skill of cardioSkills) {
      const empty = createSection("s1", skill.id);
      expect(ALL_TAGS.filter((tag) => isTagSelectable(empty, tag))).toEqual([]);
    }
  });

  it("does not add a tag the skill does not offer", () => {
    const sk = createSection("s1", "SK");
    expect(toggleSectionTag(sk, "REGION_CORE").tags).toEqual([]);
  });

  it("takes several tags of one group", () => {
    let prev = createSection("s1", "PREV");
    prev = toggleSectionTag(prev, "REGION_UPPER_BODY");
    prev = toggleSectionTag(prev, "REGION_CORE");
    expect(prev.tags).toEqual(["REGION_UPPER_BODY", "REGION_CORE"]);
  });

  it("refuses a prevention tag once a region tag is checked", () => {
    const prev = toggleSectionTag(
      createSection("s1", "PREV"),
      "REGION_UPPER_BODY",
    );
    for (const tag of PREVENTION_TAGS) {
      expect(isTagSelectable(prev, tag), tag).toBe(false);
      expect(toggleSectionTag(prev, tag).tags).toEqual(["REGION_UPPER_BODY"]);
    }
  });

  it("refuses a region tag once a prevention tag is checked", () => {
    const prev = toggleSectionTag(
      createSection("s1", "PREV"),
      "PREVENTION_SPINE",
    );
    for (const tag of REGION_TAGS) {
      expect(isTagSelectable(prev, tag), tag).toBe(false);
    }
  });

  it("offers the other group again after the last tag is unchecked", () => {
    let prev = toggleSectionTag(createSection("s1", "PREV"), "REGION_CORE");
    prev = toggleSectionTag(prev, "REGION_CORE");
    expect(prev.tags).toEqual([]);
    expect(isTagSelectable(prev, "PREVENTION_SPINE")).toBe(true);
  });
});

describe("templateToDraft", () => {
  it("reads a saved template back into the same sections", () => {
    const draft = draftWith([
      section("WU", 4, ["REGION_LOWER_BODY"], "k0"),
      section("PREV", 6, ["PREVENTION_SHOULDER", "PREVENTION_SPINE"], "k1"),
      section("GKS", 8, [], "k2"),
      section("CARDIO_1_LAKTAT", 45, [], "k3"),
    ]);
    const template = draftToTemplate(draft, "id-1");

    expect(templateToDraft(template, keys())).toEqual(draft);
  });

  it("reads every builder skill back", () => {
    const draft = draftWith(
      BUILDER_SKILLS.map((skill, index) =>
        section(skill.id, skill.kind === "picks" ? 3 : 10, [], `k${index}`),
      ),
    );
    expect(validateDraft(draft)).toEqual([]);
    expect(templateToDraft(draftToTemplate(draft, "id-1"), keys())).toEqual(
      draft,
    );
  });

  it("reads a template saved in JSON and parsed again", () => {
    const draft = draftWith([section("MOB", 5, ["REGION_CORE"], "k0")]);
    const stored: unknown = JSON.parse(
      JSON.stringify(draftToTemplate(draft, "id-1")),
    );
    expect(templateToDraft(stored, keys())).toEqual(draft);
  });

  const base = { aiwl: 1, id: "id-1", name: { en: "Imported" } };
  const picks = (skill: string) => ({
    kind: "picks",
    skill,
    picks: [{ tags: [], count: 5 }],
  });

  it.each([
    ["not an object", "a template"],
    ["null", null],
    ["a template without blocks", base],
    [
      "a skill outside the builder list",
      { ...base, blocks: [picks("CARDIO_1_SHORT")] },
    ],
    ["an unknown skill", { ...base, blocks: [picks("NOPE")] }],
    [
      "a cardio skill written as picks",
      { ...base, blocks: [picks("CARDIO_2")] },
    ],
    [
      "an exercise skill written as a duration",
      { ...base, blocks: [{ kind: "duration", skill: "GKS", duration: 600 }] },
    ],
    [
      "a duration that is not whole minutes",
      {
        ...base,
        blocks: [{ kind: "duration", skill: "CARDIO_2", duration: 90 }],
      },
    ],
    [
      "a block with two picks",
      {
        ...base,
        blocks: [
          {
            kind: "picks",
            skill: "GKS",
            picks: [
              { tags: [], count: 2 },
              { tags: [], count: 3 },
            ],
          },
        ],
      },
    ],
    [
      "a pick with a tag the builder does not know",
      {
        ...base,
        blocks: [
          {
            kind: "picks",
            skill: "GKS",
            picks: [{ tags: ["EQUIPMENT_BAND"], count: 3 }],
          },
        ],
      },
    ],
    [
      "a pick without a count",
      {
        ...base,
        blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [] }] }],
      },
    ],
    [
      "one readable and one unreadable block",
      { ...base, blocks: [picks("GKS"), picks("NOPE")] },
    ],
  ])("reports %s as not editable", (_label, template) => {
    expect(templateToDraft(template, keys())).toBeUndefined();
  });
});
