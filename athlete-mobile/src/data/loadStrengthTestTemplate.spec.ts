import {
  loadStrengthTestTemplate,
  parseStrengthTestTemplate,
} from "./loadStrengthTestTemplate";
import { loadTemplate, loadTemplates } from "./loadTemplates";
import { generateRawExercisesBlock } from "@test/factories/rawExercisesBlock";
import { generateStrengthTestTemplate } from "@test/factories/strengthTestTemplate";

describe("parseStrengthTestTemplate: valid and invalid data", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the template for data with the id TEST", () => {
    const parsed = parseStrengthTestTemplate(generateStrengthTestTemplate());

    expect(parsed.id).toBe("TEST");
  });

  it("keeps the test sets of the exercises block", () => {
    const data = generateStrengthTestTemplate({
      testSets: [{ share: 0.5, repetitions: 8, rest: 45 }],
    });

    const parsed = parseStrengthTestTemplate(data);

    expect(parsed.blocks[1]).toMatchObject({
      testSets: [{ share: 0.5, repetitions: 8, rest: 45 }],
    });
  });

  it("throws for a template whose id is not TEST", () => {
    const data = { ...generateStrengthTestTemplate(), id: "GKS" };

    expect(() => parseStrengthTestTemplate(data)).toThrow(/id/);
  });

  it("throws for a template that breaks the AIWL schema", () => {
    const data = {
      ...generateStrengthTestTemplate(),
      blocks: [generateRawExercisesBlock([])],
    };

    expect(() => parseStrengthTestTemplate(data)).toThrow("blocks[0]");
  });

  it("throws for data that is no template", () => {
    expect(() => parseStrengthTestTemplate({})).toThrow();
  });
});

describe("loadStrengthTestTemplate: bundled TEST template", () => {
  it("returns the bundled TEST template", () => {
    expect(loadStrengthTestTemplate()).toEqual({
      ...generateStrengthTestTemplate(),
      name: { en: "Strength test", de: "Krafttest" },
    });
  });

  it("is not part of the templates short workouts resolve", () => {
    expect(Object.keys(loadTemplates())).not.toContain("TEST");
  });

  it("is not found by loadTemplate", () => {
    expect(loadTemplate("TEST")).toBeUndefined();
  });
});
