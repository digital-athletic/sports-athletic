import GKS from "../../../assets/data/templates/GKS.json";
import PREVKNEE from "../../../assets/data/templates/PREVKNEE.json";
import {
  isTemplateRunnable,
  MAX_CUSTOM_WORKOUT_BLOCKS,
  MAX_CUSTOM_WORKOUT_DURATION_SECONDS,
  MAX_CUSTOM_WORKOUT_NAME_LANGUAGES,
  MAX_CUSTOM_WORKOUT_NAME_LENGTH,
  MAX_CUSTOM_WORKOUT_PICK_COUNT,
  MAX_CUSTOM_WORKOUT_PICKS_PER_BLOCK,
  MAX_CUSTOM_WORKOUT_REST_SECONDS,
  MAX_CUSTOM_WORKOUT_SET_DURATION_SECONDS,
  MAX_CUSTOM_WORKOUT_SETS,
  MAX_CUSTOM_WORKOUT_TAGS_PER_PICK,
  validateCustomWorkoutText,
} from "./validateCustomWorkout";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { Template } from "@/schemas/aiwl.schema";

// Windows Notepad and some export tools write this invisible U+FEFF mark at the
// start of a UTF-8 file. JSON.parse rejects it, so a valid file would fail import.
// Built from the code point because a literal character is invisible in the source.
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

// e.g. { aiwl: 1, id: "MY_CORE", name: { en: "Core", de: "Rumpf" }, blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }] }
const generateCustomTemplate = (
  overrides: Partial<Template> = {},
): Template => ({
  aiwl: 1,
  id: "MY_CORE",
  name: { en: "Core", de: "Rumpf" },
  blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }],
  ...overrides,
});

// e.g. { aiwl: 1, id: "MY_CORE", name: { en: "Core" }, blocks: [{ kind: "duration", skill: "GKS", duration: 300 }] }
const generateTemplateWithBlock = (
  block: Template["blocks"][number],
): Template => generateCustomTemplate({ blocks: [block] });

// e.g. ("NO_SUCH_TAG", "REGION_UPPER_BODY") gives picks { withWeights: [{ tags: ["NO_SUCH_TAG"], count: 2 }], withoutWeights: [{ tags: ["REGION_UPPER_BODY"], count: 2 }] }
const generateWeightVariantTemplate = (
  withWeightsTag: string,
  withoutWeightsTag: string,
): Template =>
  generateTemplateWithBlock({
    kind: "picks",
    skill: "GKS",
    picks: {
      withWeights: [{ tags: [withWeightsTag], count: 2 }],
      withoutWeights: [{ tags: [withoutWeightsTag], count: 2 }],
    },
  });

describe("validateCustomWorkoutText: accepted files", () => {
  it("returns the parsed template for a valid file", () => {
    const template = generateCustomTemplate();

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: true, template });
  });

  it("keeps the German name of a valid file", () => {
    const template = generateCustomTemplate();

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result.success && result.template.name.de).toBe("Rumpf");
  });

  it("accepts a file that starts with a byte order mark", () => {
    const template = generateCustomTemplate();

    const result = validateCustomWorkoutText(
      BYTE_ORDER_MARK + JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: true, template });
  });

  it("accepts the bundled GKS template text", () => {
    const result = validateCustomWorkoutText(
      JSON.stringify(GKS),
      getAllSkillTrees(),
    );

    expect(result.success).toBe(true);
  });

  it("accepts the bundled PREVKNEE template text", () => {
    const result = validateCustomWorkoutText(
      JSON.stringify(PREVKNEE),
      getAllSkillTrees(),
    );

    expect(result.success).toBe(true);
  });

  it("accepts the file id of a bundled template", () => {
    const template = generateCustomTemplate({ id: "PREV" });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: true, template });
  });
});

describe("validateCustomWorkoutText: invalid format", () => {
  it("returns INVALID_FORMAT for text that is not JSON", () => {
    const result = validateCustomWorkoutText("{ not json", getAllSkillTrees());

    expect(result).toEqual({ success: false, error: "INVALID_FORMAT" });
  });

  it.each(["", "null", "[]"])(
    "returns INVALID_FORMAT for the text %j",
    (text) => {
      const result = validateCustomWorkoutText(text, getAllSkillTrees());

      expect(result).toEqual({ success: false, error: "INVALID_FORMAT" });
    },
  );

  it("returns INVALID_FORMAT for an empty blocks list", () => {
    const template = generateCustomTemplate({ blocks: [] });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "INVALID_FORMAT" });
  });

  it("returns INVALID_FORMAT when the name is missing", () => {
    const { name: _name, ...withoutName } = generateCustomTemplate();

    const result = validateCustomWorkoutText(
      JSON.stringify(withoutName),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "INVALID_FORMAT" });
  });

  it("returns INVALID_FORMAT for aiwl version 2", () => {
    const result = validateCustomWorkoutText(
      JSON.stringify({ ...generateCustomTemplate(), aiwl: 2 }),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "INVALID_FORMAT" });
  });

  it("returns INVALID_FORMAT for an extra top level key", () => {
    const result = validateCustomWorkoutText(
      JSON.stringify({ ...generateCustomTemplate(), unknownKey: true }),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "INVALID_FORMAT" });
  });
});

describe("validateCustomWorkoutText: unsupported content", () => {
  it("returns UNSUPPORTED_CONTENT for an unknown skill", () => {
    const template = generateTemplateWithBlock({
      kind: "picks",
      skill: "NOPE",
      picks: [{ tags: [], count: 2 }],
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("returns UNSUPPORTED_CONTENT for an unknown tag", () => {
    const template = generateTemplateWithBlock({
      kind: "picks",
      skill: "GKS",
      picks: [{ tags: ["NO_SUCH_TAG"], count: 2 }],
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("returns UNSUPPORTED_CONTENT for an unknown tag when the block falls back to the whole tree", () => {
    const template = generateTemplateWithBlock({
      kind: "picks",
      skill: "GKS",
      fallbackToWholeTree: true,
      picks: [{ tags: ["NO_SUCH_TAG"], count: 2 }],
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("returns UNSUPPORTED_CONTENT for a duration block of a skill other than a cardio zone", () => {
    const template = generateTemplateWithBlock({
      kind: "duration",
      skill: "GKS",
      duration: 300,
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("returns UNSUPPORTED_CONTENT for a branches block", () => {
    const template = generateTemplateWithBlock({
      kind: "branches",
      skill: "GKS",
      branches: ["GKS_BRANCH"],
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("returns UNSUPPORTED_CONTENT for bodyParts on a picks block", () => {
    const template = generateTemplateWithBlock({
      kind: "picks",
      skill: "GKS",
      picks: [{ tags: [], count: 2 }],
      bodyParts: { regions: ["core"] },
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("returns UNSUPPORTED_CONTENT for order on a picks block", () => {
    const template = generateTemplateWithBlock({
      kind: "picks",
      skill: "GKS",
      picks: [{ tags: [], count: 2 }],
      order: "asDrawn",
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("returns UNSUPPORTED_CONTENT when only the weighted picks have an unknown tag", () => {
    const template = generateWeightVariantTemplate(
      "NO_SUCH_TAG",
      "REGION_UPPER_BODY",
    );

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });
});

describe("validateCustomWorkoutText: import limits", () => {
  it.each<[string, Template]>([
    [
      "the pick count",
      generateTemplateWithBlock({
        kind: "picks",
        skill: "GKS",
        picks: [{ tags: [], count: MAX_CUSTOM_WORKOUT_PICK_COUNT + 1 }],
      }),
    ],
    [
      "the sets",
      generateTemplateWithBlock({
        kind: "picks",
        skill: "GKS",
        sets: MAX_CUSTOM_WORKOUT_SETS + 1,
        picks: [{ tags: [], count: 2 }],
      }),
    ],
    [
      "the set duration",
      generateTemplateWithBlock({
        kind: "picks",
        skill: "GKS",
        setDuration: MAX_CUSTOM_WORKOUT_SET_DURATION_SECONDS + 1,
        picks: [{ tags: [], count: 2 }],
      }),
    ],
    [
      "the block duration",
      generateTemplateWithBlock({
        kind: "duration",
        skill: "GKS",
        duration: MAX_CUSTOM_WORKOUT_DURATION_SECONDS + 1,
      }),
    ],
    [
      "the rest",
      generateTemplateWithBlock({
        kind: "picks",
        skill: "GKS",
        rest: { betweenSets: MAX_CUSTOM_WORKOUT_REST_SECONDS + 1 },
        picks: [{ tags: [], count: 2 }],
      }),
    ],
    [
      "the number of blocks",
      generateCustomTemplate({
        blocks: Array.from({ length: MAX_CUSTOM_WORKOUT_BLOCKS + 1 }, () => ({
          kind: "picks" as const,
          skill: "GKS",
          picks: [{ tags: [], count: 1 }],
        })),
      }),
    ],
    [
      "the number of picks entries",
      generateTemplateWithBlock({
        kind: "picks",
        skill: "GKS",
        picks: Array.from(
          { length: MAX_CUSTOM_WORKOUT_PICKS_PER_BLOCK + 1 },
          () => ({ tags: [], count: 1 }),
        ),
      }),
    ],
    [
      "the number of weighted picks entries",
      generateTemplateWithBlock({
        kind: "picks",
        skill: "GKS",
        picks: {
          withWeights: Array.from(
            { length: MAX_CUSTOM_WORKOUT_PICKS_PER_BLOCK + 1 },
            () => ({ tags: [], count: 1 }),
          ),
          withoutWeights: [{ tags: [], count: 1 }],
        },
      }),
    ],
    [
      "the number of tags",
      generateTemplateWithBlock({
        kind: "picks",
        skill: "GKS",
        picks: [
          {
            tags: Array.from(
              { length: MAX_CUSTOM_WORKOUT_TAGS_PER_PICK + 1 },
              () => "REGION_UPPER_BODY",
            ),
            count: 1,
          },
        ],
      }),
    ],
    [
      "the name length",
      generateCustomTemplate({
        name: { en: "a".repeat(MAX_CUSTOM_WORKOUT_NAME_LENGTH + 1) },
      }),
    ],
    [
      "the number of name languages",
      generateCustomTemplate({
        name: {
          en: "Core",
          ...Object.fromEntries(
            Array.from(
              { length: MAX_CUSTOM_WORKOUT_NAME_LANGUAGES },
              (_, index) => [`l${index}`, "Core"],
            ),
          ),
        },
      }),
    ],
  ])("returns UNSUPPORTED_CONTENT when %s exceeds its limit", (_, template) => {
    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("returns UNSUPPORTED_CONTENT for a huge sets value", () => {
    const template = generateTemplateWithBlock({
      kind: "picks",
      skill: "GKS",
      sets: 1_000_000_000,
      picks: [{ tags: [], count: 2 }],
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: false, error: "UNSUPPORTED_CONTENT" });
  });

  it("accepts sets and rest exactly at their limits", () => {
    const template = generateTemplateWithBlock({
      kind: "picks",
      skill: "GKS",
      sets: MAX_CUSTOM_WORKOUT_SETS,
      rest: { betweenSets: MAX_CUSTOM_WORKOUT_REST_SECONDS },
      picks: [{ tags: [], count: 2 }],
    });

    const result = validateCustomWorkoutText(
      JSON.stringify(template),
      getAllSkillTrees(),
    );

    expect(result).toEqual({ success: true, template });
  });
});

describe("isTemplateRunnable: weights variants", () => {
  it("returns true for a template whose picks resolve with and without weights", () => {
    const template = generateWeightVariantTemplate(
      "REGION_UPPER_BODY",
      "REGION_UPPER_BODY",
    );

    expect(isTemplateRunnable(template, getAllSkillTrees())).toBe(true);
  });

  it("returns true for a plain picks list without weight variants", () => {
    expect(
      isTemplateRunnable(generateCustomTemplate(), getAllSkillTrees()),
    ).toBe(true);
  });

  it("returns false when only the withWeights picks have an unknown tag", () => {
    const template = generateWeightVariantTemplate(
      "NO_SUCH_TAG",
      "REGION_UPPER_BODY",
    );

    expect(isTemplateRunnable(template, getAllSkillTrees())).toBe(false);
  });

  it("returns false when only the withoutWeights picks have an unknown tag", () => {
    const template = generateWeightVariantTemplate(
      "REGION_UPPER_BODY",
      "NO_SUCH_TAG",
    );

    expect(isTemplateRunnable(template, getAllSkillTrees())).toBe(false);
  });

  it("returns false for a template with a duration block of a skill other than a cardio zone", () => {
    const template = generateTemplateWithBlock({
      kind: "duration",
      skill: "GKS",
      duration: 300,
    });

    expect(isTemplateRunnable(template, getAllSkillTrees())).toBe(false);
  });
});

describe("isTemplateRunnable: cardio duration blocks", () => {
  it("returns true for a template of one cardio duration block", () => {
    const template = generateTemplateWithBlock({
      kind: "duration",
      skill: "CARDIO_2",
      duration: 1200,
    });

    expect(isTemplateRunnable(template, getAllSkillTrees())).toBe(true);
  });

  it("returns true for a picks block followed by a cardio duration block", () => {
    const template = generateCustomTemplate({
      blocks: [
        { kind: "picks", skill: "WU", picks: [{ tags: [], count: 5 }] },
        { kind: "duration", skill: "CARDIO_4", duration: 1800 },
      ],
    });

    expect(isTemplateRunnable(template, getAllSkillTrees())).toBe(true);
  });

  it("returns false for a cardio duration block with bodyParts", () => {
    const template = generateTemplateWithBlock({
      kind: "duration",
      skill: "CARDIO_2",
      duration: 1200,
      bodyParts: { regions: ["lowerBody"] },
    });

    expect(isTemplateRunnable(template, getAllSkillTrees())).toBe(false);
  });

  it("returns false for a cardio zone without a tree", () => {
    const template = generateTemplateWithBlock({
      kind: "duration",
      skill: "CARDIO_2",
      duration: 1200,
    });

    expect(isTemplateRunnable(template, {})).toBe(false);
  });
});
