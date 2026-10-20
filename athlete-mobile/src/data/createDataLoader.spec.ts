import * as v from "valibot";

import { TemplateSchema } from "../schemas/aiwl.schema";
import { SkillCatalogSchema } from "../schemas/skillCatalog.schema";
import { parseData } from "./createDataLoader";

const PREFIX = "Invalid data structure for ";

const gksTemplate = (blockExtra: Record<string, unknown> = {}) => ({
  aiwl: 1,
  id: "GKS",
  name: { en: "Full body stability" },
  blocks: [
    {
      kind: "picks",
      skill: "GKS",
      picks: [{ tags: [], count: 4 }],
      ...blockExtra,
    },
  ],
});

const gksCatalog = (rest: Record<string, unknown>) => ({
  GKS: { skillTree: { withWeights: ["GKS"], withoutWeights: ["GKSKG"] }, rest },
});

const failureLines = (run: () => unknown): string[] => {
  try {
    run();
  } catch (error) {
    if (error instanceof Error) return error.message.split("\n");
  }
  throw new Error("parseData did not throw");
};

describe("parseData: error message", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps the prefix with the name on the first line", () => {
    const lines = failureLines(() =>
      parseData(v.object({ a: v.string() }), { a: 1 }, "fixture"),
    );

    expect(lines[0]).toBe(`${PREFIX}fixture`);
  });

  it("appends one line per issue", () => {
    const schema = v.object({ a: v.string(), b: v.number() });

    const lines = failureLines(() =>
      parseData(schema, { a: 1, b: "x" }, "fixture"),
    );

    expect(lines).toHaveLength(3);
  });

  it("formats keys with dots and array indexes with brackets below the root", () => {
    const schema = v.object({ items: v.array(v.object({ id: v.string() })) });

    const lines = failureLines(() =>
      parseData(schema, { items: [{ id: "a" }, { id: 2 }] }, "fixture", "root"),
    );

    expect(lines[1]).toMatch(/^root\.items\[1\]\.id: /);
  });

  it("starts the path with the record key when no root is given", () => {
    const schema = v.record(v.string(), v.object({ id: v.string() }));

    const lines = failureLines(() =>
      parseData(schema, { GKS: { id: 2 } }, "fixture"),
    );

    expect(lines[1]).toMatch(/^GKS\.id: /);
  });

  it("names picks [] in template GKS at GKS.blocks[0].picks", () => {
    const lines = failureLines(() =>
      parseData(
        TemplateSchema,
        gksTemplate({ picks: [] }),
        "template GKS",
        "GKS",
      ),
    );

    expect(lines[1].startsWith("GKS.blocks[0].picks: ")).toBe(true);
  });

  it("names an unknown block key at GKS.blocks[0].minutes", () => {
    const lines = failureLines(() =>
      parseData(
        TemplateSchema,
        gksTemplate({ minutes: 10 }),
        "template GKS",
        "GKS",
      ),
    );

    expect(lines[1].startsWith("GKS.blocks[0].minutes: ")).toBe(true);
  });

  it("names a catalog rest without betweenSets at GKS.rest.betweenSets", () => {
    const rest = { withinSuperset: 45, afterExercise: 60 };

    const lines = failureLines(() =>
      parseData(SkillCatalogSchema, gksCatalog(rest), "skill catalog"),
    );

    expect(lines[1].startsWith("GKS.rest.betweenSets: ")).toBe(true);
  });
});

describe("parseData: valid input", () => {
  it("returns an equal clone that is a different object", () => {
    const data = gksTemplate();

    const result = parseData(TemplateSchema, data, "template GKS", "GKS");

    expect(result).toEqual(data);
    expect(result).not.toBe(data);
  });
});
