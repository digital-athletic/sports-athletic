import type { Block } from "@/schemas/aiwl.schema";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
} from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { requireSupportedTemplateBlocks } from "./templateBlockCheck";

describe("templateBlockCheck: requireSupportedTemplateBlocks", () => {
  it("accepts picks and branches blocks in any order", () => {
    const template = generateShortTemplate([
      generatePicksBlock("MOB"),
      generateBranchesBlock("GKS", ["510"]),
      generatePicksBlock("BAS"),
    ]);

    expect(() => requireSupportedTemplateBlocks(template)).not.toThrow();
  });

  it("accepts a duration block of a cardio zone", () => {
    const template = generateShortTemplate([
      generatePicksBlock("WU"),
      { kind: "duration", skill: "CARDIO_2", duration: 1200 },
    ]);

    expect(() => requireSupportedTemplateBlocks(template)).not.toThrow();
  });

  it.each<{ behaviour: string; block: Block; what: string }>([
    {
      behaviour: "an exercises block",
      block: { kind: "exercises", skill: "TEST", exercises: ["25"] },
      what: "exercises",
    },
    {
      behaviour: "a duration block of a skill other than a cardio zone",
      block: { kind: "duration", skill: "MOB", duration: 300 },
      what: "duration",
    },
    {
      behaviour: "the field bodyParts on a cardio duration block",
      block: {
        kind: "duration",
        skill: "CARDIO_2",
        duration: 1200,
        bodyParts: { regions: ["core"] },
      },
      what: "bodyParts",
    },
    {
      behaviour: "the field bodyParts on a picks block",
      block: generatePicksBlock("MOB", { bodyParts: { regions: ["core"] } }),
      what: "bodyParts",
    },
  ])("throws BLOCK_KIND for $behaviour", ({ block, what }) => {
    const template = generateShortTemplate([generatePicksBlock("BR"), block]);

    expect(
      catchThrownValue(() => requireSupportedTemplateBlocks(template)),
    ).toStrictEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["short.blocks[1]", what],
    });
  });

  it.each<{ behaviour: string; block: Block }>([
    {
      behaviour: "a picks block",
      block: generatePicksBlock("MOB", { order: "asDrawn" }),
    },
    {
      behaviour: "a branches block",
      block: generateBranchesBlock("GKS", ["510"], { order: "muscleGroups" }),
    },
    {
      behaviour: "a cardio duration block",
      block: {
        kind: "duration",
        skill: "CARDIO_2",
        duration: 1200,
        order: "asDrawn",
      },
    },
  ])("accepts the field order on $behaviour", ({ block }) => {
    const template = generateShortTemplate([generatePicksBlock("BR"), block]);

    expect(() => requireSupportedTemplateBlocks(template)).not.toThrow();
  });

  it("throws for the first offending block in template order", () => {
    const template = generateShortTemplate([
      generatePicksBlock("MOB"),
      generatePicksBlock("BAS", { bodyParts: { regions: ["core"] } }),
      { kind: "duration", skill: "CD", duration: 300 },
    ]);

    expect(
      catchThrownValue(() => requireSupportedTemplateBlocks(template)),
    ).toStrictEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["short.blocks[1]", "bodyParts"],
    });
  });

  it("throws for an unsupported field after a valid branches block", () => {
    const template = generateShortTemplate([
      generateBranchesBlock("GKS", ["510"]),
      generatePicksBlock("MOB", { bodyParts: { regions: ["core"] } }),
    ]);

    expect(
      catchThrownValue(() => requireSupportedTemplateBlocks(template)),
    ).toStrictEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["short.blocks[1]", "bodyParts"],
    });
  });

  it("names bodyParts on a picks block that also sets order", () => {
    const template = generateShortTemplate([
      generatePicksBlock("MOB", {
        order: "asDrawn",
        bodyParts: { regions: ["core"] },
      }),
    ]);

    expect(
      catchThrownValue(() => requireSupportedTemplateBlocks(template)),
    ).toStrictEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["short.blocks[0]", "bodyParts"],
    });
  });

  it("names the duration kind of a duration block that also sets order", () => {
    const template = generateShortTemplate([
      { kind: "duration", skill: "CD", duration: 300, order: "asDrawn" },
    ]);

    expect(
      catchThrownValue(() => requireSupportedTemplateBlocks(template)),
    ).toStrictEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["short.blocks[0]", "duration"],
    });
  });
});
