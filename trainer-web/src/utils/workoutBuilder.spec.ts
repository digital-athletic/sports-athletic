import { describe, expect, it } from "vitest";
import {
  BUILDER_SKILLS,
  MAX_NAME_LENGTH,
  MAX_SECTIONS,
  PREVENTION_TAGS,
  REGION_TAGS,
  changeSectionSkill,
  createEmptyDraft,
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
): WorkoutDraft => ({ ...createEmptyDraft(), name, sections });

/** A key generator that counts up, like the builder's own. */
const keys = (): (() => string) => {
  let next = 0;
  return () => `k${next++}`;
};

describe("draftToTemplate", () => {
  it.each(pickSkills.map((skill) => [skill.id, skill.tags.slice(0, 1)]))(
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

  it("starts with the warm-up and ends with the cool-down", () => {
    const template = draftToTemplate(
      {
        ...draftWith([section("GKS", 5), section("CARDIO_2", 20, [], "s2")]),
        warmUp: { enabled: true, amount: 4 },
        coolDown: { enabled: true, amount: 3 },
      },
      "id-1",
    );
    expect(template.blocks.map((block) => block.skill)).toEqual([
      "WU",
      "GKS",
      "CARDIO_2",
      "CD",
    ]);
    expect(template.blocks[0]).toEqual({
      kind: "picks",
      skill: "WU",
      picks: [{ tags: [], count: 4 }],
    });
    expect(template.blocks[3]).toEqual({
      kind: "picks",
      skill: "CD",
      picks: [{ tags: [], count: 3 }],
    });
  });

  it("writes neither warm-up nor cool-down when both are unticked", () => {
    const template = draftToTemplate(draftWith([section("GKS", 5)]), "id-1");
    expect(template.blocks.map((block) => block.skill)).toEqual(["GKS"]);
  });

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

  it("reports TAG_NOT_ALLOWED for a body region in the prevention section", () => {
    expect(
      validateDraft(
        draftWith([section("PREV", 5, ["REGION_UPPER_BODY"], "bad")]),
      ),
    ).toEqual([{ code: "TAG_NOT_ALLOWED", sectionKey: "bad" }]);
  });

  it.each([
    ["warmUp", "WARM_UP_OUT_OF_RANGE"],
    ["coolDown", "COOL_DOWN_OUT_OF_RANGE"],
  ] as const)("reports a ticked %s with 21 exercises", (part, code) => {
    expect(
      validateDraft({
        ...draftWith([section("GKS", 5)]),
        [part]: { enabled: true, amount: 21 },
      }),
    ).toEqual([{ code }]);
  });

  it("ignores the amount of an unticked warm-up", () => {
    expect(
      validateDraft({
        ...draftWith([section("GKS", 5)]),
        warmUp: { enabled: false, amount: Number.NaN },
      }),
    ).toEqual([]);
  });

  it(`counts warm-up and cool-down towards the ${MAX_SECTIONS} sections`, () => {
    const sections = Array.from({ length: MAX_SECTIONS - 1 }, (_, index) =>
      section("GKS", 5, [], `s${index}`),
    );
    const draft = {
      ...draftWith(sections),
      warmUp: { enabled: true, amount: 5 },
    };
    expect(validateDraft(draft)).toEqual([]);
    expect(
      validateDraft({ ...draft, coolDown: { enabled: true, amount: 5 } }),
    ).toEqual([{ code: "TOO_MANY_SECTIONS" }]);
  });
});

describe("training list", () => {
  it("offers neither warm-up nor cool-down", () => {
    const ids = BUILDER_SKILLS.map((skill) => skill.id);
    expect(ids).not.toContain("WU");
    expect(ids).not.toContain("CD");
  });

  it.each(["BAS", "BR", "WUSKSA", "CARDIO_1_SHORT", "CARDIO_1_LAKTAT"])(
    "offers %s",
    (skillId) => {
      expect(BUILDER_SKILLS.map((skill) => skill.id)).toContain(skillId);
    },
  );
});

describe("tags", () => {
  it("offers the five prevention areas and no body region for prevention", () => {
    const prev = createSection("s1", "PREV");
    expect(ALL_TAGS.filter((tag) => isTagSelectable(prev, tag))).toEqual(
      PREVENTION_TAGS,
    );
  });

  it.each(
    BUILDER_SKILLS.filter((skill) => skill.id !== "PREV").map((skill) => [
      skill.id,
    ]),
  )("%s offers no prevention area", (skillId) => {
    const empty = createSection("s1", skillId);
    expect(
      PREVENTION_TAGS.filter((tag) => isTagSelectable(empty, tag)),
    ).toEqual([]);
  });

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

  it("takes several tags and removes a checked one", () => {
    let prev = createSection("s1", "PREV");
    prev = toggleSectionTag(prev, "PREVENTION_KNEE_HIP");
    prev = toggleSectionTag(prev, "PREVENTION_SPINE");
    expect(prev.tags).toEqual(["PREVENTION_KNEE_HIP", "PREVENTION_SPINE"]);
    expect(toggleSectionTag(prev, "PREVENTION_SPINE").tags).toEqual([
      "PREVENTION_KNEE_HIP",
    ]);
  });
});

describe("changeSectionSkill", () => {
  it("drops the prevention areas when prevention becomes another training", () => {
    const prev = section("PREV", 5, ["PREVENTION_KNEE_HIP"]);
    expect(changeSectionSkill(prev, "GKS").tags).toEqual([]);
  });

  it("keeps the body regions the new training also offers", () => {
    const gks = section("GKS", 5, ["REGION_UPPER_BODY", "REGION_FULL_BODY"]);
    expect(changeSectionSkill(gks, "MOB").tags).toEqual(["REGION_UPPER_BODY"]);
  });

  it("keeps the exercise count between two exercise trainings", () => {
    expect(changeSectionSkill(section("GKS", 8), "MOB").amount).toBe(8);
  });

  it("resets the amount when exercises become minutes", () => {
    expect(changeSectionSkill(section("GKS", 8), "CARDIO_2").amount).toBe(20);
  });

  it("leaves the section unchanged for an unknown training", () => {
    const gks = section("GKS", 8);
    expect(changeSectionSkill(gks, "NOPE")).toBe(gks);
  });
});

describe("templateToDraft", () => {
  it("reads a saved template back into the same sections", () => {
    const draft: WorkoutDraft = {
      ...draftWith([
        section("PREV", 6, ["PREVENTION_SHOULDER", "PREVENTION_SPINE"], "k0"),
        section("GKS", 8, [], "k1"),
        section("CARDIO_1_SHORT", 45, [], "k2"),
      ]),
      warmUp: { enabled: true, amount: 4 },
      coolDown: { enabled: true, amount: 2 },
    };
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
  ])("reports %s as not editable", (_label, template) => {
    expect(templateToDraft(template, keys())).toBeUndefined();
  });

  it.each([
    ["an unknown skill", picks("NOPE")],
    ["a warm-up in the middle", picks("WU")],
    ["a cardio skill written as picks", picks("CARDIO_2")],
    [
      "an exercise skill written as a duration",
      { kind: "duration", skill: "GKS", duration: 600 },
    ],
    [
      "a duration that is not whole minutes",
      { kind: "duration", skill: "CARDIO_2", duration: 90 },
    ],
    [
      "a block with two picks",
      {
        kind: "picks",
        skill: "GKS",
        picks: [
          { tags: [], count: 2 },
          { tags: [], count: 3 },
        ],
      },
    ],
    [
      "a pick without a count",
      { kind: "picks", skill: "GKS", picks: [{ tags: [] }] },
    ],
    [
      "a pick with no exercise",
      { kind: "picks", skill: "GKS", picks: [{ tags: [], count: 0 }] },
    ],
    [
      "a pick with a fraction of exercises",
      { kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2.5 }] },
    ],
    [
      "a duration of zero",
      { kind: "duration", skill: "CARDIO_2", duration: 0 },
    ],
  ])("drops %s and reads the other sections", (_label, block) => {
    const template = {
      ...base,
      blocks: [picks("MOB"), block, picks("GKS")],
    };
    expect(
      templateToDraft(template, keys())?.sections.map((s) => s.skill),
    ).toEqual(["MOB", "GKS"]);
  });

  it("drops the tags the training does not offer and reads the section", () => {
    const template = {
      ...base,
      blocks: [
        {
          kind: "picks",
          skill: "MOB",
          picks: [
            {
              tags: ["PREVENTION_KNEE_HIP", "REGION_CORE", "EQUIPMENT_BAND"],
              count: 3,
            },
          ],
        },
      ],
    };
    expect(templateToDraft(template, keys())?.sections).toEqual([
      section("MOB", 3, ["REGION_CORE"], "k0"),
    ]);
  });

  const bookend = (skill: string, count: number) => ({
    kind: "picks",
    skill,
    picks: [{ tags: [], count }],
  });
  const ticks = (blocks: unknown[]) => {
    const draft = templateToDraft({ ...base, blocks }, keys());
    return {
      warmUp: draft?.warmUp.enabled && draft.warmUp.amount,
      coolDown: draft?.coolDown.enabled && draft.coolDown.amount,
      sections: draft?.sections.map((s) => s.skill),
    };
  };

  it.each([
    [
      "only a warm-up",
      [bookend("WU", 4)],
      { warmUp: 4, coolDown: false, sections: [] },
    ],
    [
      "only a cool-down",
      [bookend("CD", 3)],
      { warmUp: false, coolDown: 3, sections: [] },
    ],
    [
      "a warm-up and a cool-down without sections",
      [bookend("WU", 4), bookend("CD", 3)],
      { warmUp: 4, coolDown: 3, sections: [] },
    ],
    [
      "a cool-down first and a warm-up last",
      [bookend("CD", 3), picks("GKS"), bookend("WU", 4)],
      { warmUp: false, coolDown: false, sections: ["GKS"] },
    ],
    [
      "a warm-up with two picks",
      [
        {
          kind: "picks",
          skill: "WU",
          picks: [
            { tags: [], count: 2 },
            { tags: [], count: 3 },
          ],
        },
        picks("GKS"),
      ],
      { warmUp: false, coolDown: false, sections: ["GKS"] },
    ],
  ])("reads %s", (_label, blocks, expected) => {
    expect(ticks(blocks)).toEqual(expected);
  });
});
