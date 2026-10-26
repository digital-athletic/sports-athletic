import * as v from "valibot";

import { TemplateSchema } from "./aiwl.schema";
import { StrengthTestTemplateSchema } from "./strengthTestTemplate.schema";
import { generateRawExercisesBlock } from "@test/factories/rawExercisesBlock";
import {
  generateRawBlock,
  generateRawTemplate,
} from "@test/factories/rawTemplate";

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
