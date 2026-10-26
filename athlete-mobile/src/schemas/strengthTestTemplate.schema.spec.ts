import * as v from "valibot";

import { TemplateSchema } from "./aiwl.schema";
import { StrengthTestTemplateSchema } from "./strengthTestTemplate.schema";
import { generateRawExercisesBlock } from "@test/factories/rawExercisesBlock";
import {
  generateRawBlock,
  generateRawTemplate,
} from "@test/factories/rawTemplate";

const firstIssuePath = (data: unknown): string | undefined => {
  const result = v.safeParse(StrengthTestTemplateSchema, data);
  if (result.success) return undefined;
  return (result.issues[0].path ?? [])
    .map((item) => String(item.key))
    .join(".");
};

describe("StrengthTestTemplateSchema: exercises blocks", () => {
  it("accepts a template mixing a picks block and a TEST exercises block", () => {
    const data = generateRawTemplate(generateRawBlock("picks"), {
      kind: "exercises",
      skill: "TEST",
      exercises: ["25", "50", "342", "297", "54"],
    });

    expect(v.safeParse(StrengthTestTemplateSchema, data).success).toBe(true);
  });

  it("rejects an exercises block with an empty exercises list", () => {
    const data = generateRawTemplate({
      kind: "exercises",
      skill: "TEST",
      exercises: [],
    });

    expect(v.safeParse(StrengthTestTemplateSchema, data).success).toBe(false);
  });

  it("rejects duplicate exercise IDs in one exercises block", () => {
    const data = generateRawTemplate({
      kind: "exercises",
      skill: "TEST",
      exercises: ["25", "50", "25"],
    });

    expect(v.safeParse(StrengthTestTemplateSchema, data).success).toBe(false);
  });

  // The set list stage checks the settings against the builder of the skill,
  // so the schema reads no skill code.
  it.each<[string, Record<string, unknown>]>([
    ["sets", { sets: 2 }],
    ["rest", { rest: { afterExercise: 30 } }],
    ["values", { values: "exercise" }],
    ["setDuration", { setDuration: 60 }],
  ])("accepts an exercises block that sets %s", (_label, extra) => {
    const data = generateRawTemplate({
      kind: "exercises",
      skill: "TEST",
      exercises: ["25", "50"],
      ...extra,
    });

    expect(v.safeParse(StrengthTestTemplateSchema, data).success).toBe(true);
  });

  it.each<[string, Record<string, unknown>]>([
    ["picks", { picks: [{ tags: [], count: 1 }] }],
    ["branches", { branches: ["11"] }],
    ["superset", { superset: "none" }],
    ["order", { order: "asDrawn" }],
  ])("rejects %s on an exercises block", (_label, extra) => {
    const data = generateRawTemplate({
      kind: "exercises",
      skill: "GKS",
      exercises: ["25"],
      ...extra,
    });

    expect(v.safeParse(StrengthTestTemplateSchema, data).success).toBe(false);
  });

  it("keeps the AIWL block kinds of TemplateSchema", () => {
    const data = generateRawTemplate(
      generateRawBlock("picks"),
      generateRawBlock("duration"),
      generateRawBlock("branches"),
    );

    expect(v.safeParse(StrengthTestTemplateSchema, data).success).toBe(true);
  });

  it("leaves TemplateSchema without exercises blocks", () => {
    const data = generateRawTemplate(generateRawExercisesBlock(undefined));

    expect(v.safeParse(TemplateSchema, data).success).toBe(false);
  });
});

describe("StrengthTestTemplateSchema: testSets on exercises blocks", () => {
  it("accepts test sets with a number of repetitions and with amrap", () => {
    const data = generateRawTemplate(
      generateRawExercisesBlock([
        { share: 0.5, repetitions: 8, rest: 45 },
        { share: 1, repetitions: "amrap", rest: 0 },
      ]),
    );

    expect(v.safeParse(StrengthTestTemplateSchema, data).success).toBe(true);
  });

  it("returns the test sets in the authored order", () => {
    const testSets = [
      { share: 1, repetitions: 3, rest: 10 },
      { share: 0.2, repetitions: "amrap", rest: 20 },
    ];

    const result = v.safeParse(
      StrengthTestTemplateSchema,
      generateRawTemplate(generateRawExercisesBlock(testSets)),
    );

    expect(result.success && result.output.blocks[0]).toMatchObject({
      testSets,
    });
  });

  it("accepts a share of exactly 1", () => {
    const data = generateRawTemplate(
      generateRawExercisesBlock([{ share: 1, repetitions: 1, rest: 0 }]),
    );

    expect(v.safeParse(StrengthTestTemplateSchema, data).success).toBe(true);
  });

  it.each<[string, unknown, string]>([
    ["an empty list", [], "blocks.0.testSets"],
    [
      "a share of 0",
      [{ share: 0, repetitions: 5, rest: 60 }],
      "blocks.0.testSets.0.share",
    ],
    [
      "a share of 1.01",
      [{ share: 1.01, repetitions: 5, rest: 60 }],
      "blocks.0.testSets.0.share",
    ],
    [
      "repetitions 0",
      [{ share: 0.5, repetitions: 0, rest: 60 }],
      "blocks.0.testSets.0.repetitions",
    ],
    [
      "repetitions 2.5",
      [{ share: 0.5, repetitions: 2.5, rest: 60 }],
      "blocks.0.testSets.0.repetitions",
    ],
    [
      "the repetitions text max",
      [{ share: 0.5, repetitions: "max", rest: 60 }],
      "blocks.0.testSets.0.repetitions",
    ],
    [
      "a negative rest",
      [{ share: 0.5, repetitions: 5, rest: -1 }],
      "blocks.0.testSets.0.rest",
    ],
    [
      "a fractional rest",
      [{ share: 0.5, repetitions: 5, rest: 1.5 }],
      "blocks.0.testSets.0.rest",
    ],
    [
      "an unknown key in a test set",
      [{ share: 0.5, repetitions: 5, rest: 60, weight: 20 }],
      "blocks.0.testSets.0.weight",
    ],
    [
      "a test set without a share",
      [{ repetitions: 5, rest: 60 }],
      "blocks.0.testSets.0.share",
    ],
  ])("rejects %s", (_label, testSets, path) => {
    expect(
      firstIssuePath(generateRawTemplate(generateRawExercisesBlock(testSets))),
    ).toBe(path);
  });

  it.each(["picks", "duration", "branches"] as const)(
    "rejects testSets on a %s block",
    (kind) => {
      const data = generateRawTemplate(
        generateRawBlock(kind, {
          testSets: [{ share: 1, repetitions: 5, rest: 60 }],
        }),
      );

      expect(firstIssuePath(data)).toBe("blocks.0.testSets");
    },
  );
});
