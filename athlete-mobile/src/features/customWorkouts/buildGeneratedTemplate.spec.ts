import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { type Block } from "@/schemas/aiwl.schema";
import {
  buildGeneratedTemplate,
  type GeneratedTrainingFocus,
  type GeneratedTrainingRegion,
  listRegionsForFocus,
  planTemplateMinutes,
  TRAINING_TIMES,
} from "./buildGeneratedTemplate";
import { validateCustomWorkoutValue } from "./validateCustomWorkout";

const FOCUSES: GeneratedTrainingFocus[] = [
  "hypertrophy",
  "explosive",
  "mobility",
  "cardio",
];

/** Tags of every pick of a picks block, e.g. ["REGION_UPPER_BODY"]. */
const listPickTags = (block: Block): string[] =>
  block.kind === "picks" && Array.isArray(block.picks)
    ? block.picks.flatMap((pick) => pick.tags)
    : [];

/** Exercise count of a picks block over all its picks, e.g. 3. */
const countPicks = (block: Block): number =>
  block.kind === "picks" && Array.isArray(block.picks)
    ? block.picks.reduce((sum, pick) => sum + pick.count, 0)
    : 0;

describe("buildGeneratedTemplate: structure", () => {
  it("frames the main section with a warm-up and a cool-down", () => {
    const template = buildGeneratedTemplate(
      { minutes: 30, focus: "hypertrophy", regions: ["upperBody"] },
      "GENERATED_1",
    );

    expect(template.blocks.map((block) => block.skill)).toEqual([
      "WU",
      "SWR1",
      "CD",
    ]);
  });

  it.each([
    ["hypertrophy", "SWR1"],
    ["explosive", "SK"],
    ["mobility", "MOB"],
    ["cardio", "CARDIO_2"],
  ] as const)("trains the focus %s with the skill %s", (focus, skill) => {
    const template = buildGeneratedTemplate(
      { minutes: 30, focus, regions: ["upperBody"] },
      "GENERATED_1",
    );

    expect(template.blocks[1].skill).toBe(skill);
  });

  it("uses the given id and the AIWL version 1", () => {
    const template = buildGeneratedTemplate(
      { minutes: 30, focus: "mobility", regions: ["core"] },
      "GENERATED_42",
    );

    expect(template).toMatchObject({ aiwl: 1, id: "GENERATED_42" });
  });

  it("names the training after its focus and time in English and German", () => {
    const template = buildGeneratedTemplate(
      { minutes: 45, focus: "hypertrophy", regions: ["upperBody"] },
      "GENERATED_1",
    );

    expect(template.name).toEqual({
      en: "Hypertrophy 45 min",
      de: "Muskelaufbau 45 Min.",
    });
  });
});

describe("buildGeneratedTemplate: regions", () => {
  it("restricts the main section to the chosen region", () => {
    const template = buildGeneratedTemplate(
      { minutes: 30, focus: "hypertrophy", regions: ["lowerBody"] },
      "GENERATED_1",
    );

    expect(listPickTags(template.blocks[1])).toEqual(["REGION_LOWER_BODY"]);
  });

  it("splits the exercises of the main section over several regions", () => {
    const template = buildGeneratedTemplate(
      { minutes: 60, focus: "hypertrophy", regions: ["upperBody", "core"] },
      "GENERATED_1",
    );
    const main = template.blocks[1];

    expect(listPickTags(main)).toEqual(["REGION_UPPER_BODY", "REGION_CORE"]);
    expect(main.kind === "picks" && Array.isArray(main.picks)).toBe(true);
    const counts =
      main.kind === "picks" && Array.isArray(main.picks)
        ? main.picks.map((pick) => pick.count)
        : [];
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("draws from the whole skill for the full body", () => {
    const template = buildGeneratedTemplate(
      { minutes: 30, focus: "hypertrophy", regions: ["fullBody"] },
      "GENERATED_1",
    );

    expect(listPickTags(template.blocks[1])).toEqual([]);
    expect(countPicks(template.blocks[1])).toBeGreaterThan(0);
  });

  it("keeps the warm-up and the cool-down unrestricted", () => {
    const template = buildGeneratedTemplate(
      { minutes: 30, focus: "hypertrophy", regions: ["lowerBody"] },
      "GENERATED_1",
    );

    expect(listPickTags(template.blocks[0])).toEqual([]);
    expect(listPickTags(template.blocks[2])).toEqual([]);
  });

  it("builds a cardio duration block without regions", () => {
    const template = buildGeneratedTemplate(
      { minutes: 30, focus: "cardio", regions: [] },
      "GENERATED_1",
    );

    expect(template.blocks[1]).toMatchObject({ kind: "duration" });
    expect(template.blocks[1]).not.toHaveProperty("picks");
  });

  it("offers no region for cardio and no core for explosive power", () => {
    expect(listRegionsForFocus("cardio")).toEqual([]);
    expect(listRegionsForFocus("explosive")).toEqual([
      "upperBody",
      "lowerBody",
      "fullBody",
    ]);
    expect(listRegionsForFocus("hypertrophy")).toEqual([
      "upperBody",
      "lowerBody",
      "core",
      "fullBody",
    ]);
  });
});

/** Every single region of a focus plus all its body regions together. */
const listRegionChoices = (
  focus: GeneratedTrainingFocus,
): GeneratedTrainingRegion[][] => {
  const regions = listRegionsForFocus(focus);
  if (regions.length === 0) return [[]];
  return [
    ...regions.map((region) => [region]),
    regions.filter((region) => region !== "fullBody"),
  ];
};

describe("buildGeneratedTemplate: every time, focus and region", () => {
  const cases = TRAINING_TIMES.flatMap((minutes) =>
    FOCUSES.flatMap((focus) =>
      listRegionChoices(focus).map(
        (regions) => [minutes, focus, regions] as const,
      ),
    ),
  );

  it.each(cases)(
    "plans %i minutes of %s for %j within 5 minutes of the time",
    (minutes, focus, regions) => {
      const template = buildGeneratedTemplate(
        { minutes, focus, regions },
        "GENERATED_1",
      );

      expect(
        Math.abs(planTemplateMinutes(template) - minutes),
      ).toBeLessThanOrEqual(5);
    },
  );

  it.each(cases)(
    "passes the import validation for %i minutes of %s for %j",
    (minutes, focus, regions) => {
      const template = buildGeneratedTemplate(
        { minutes, focus, regions },
        "GENERATED_1",
      );

      expect(validateCustomWorkoutValue(template, getAllSkillTrees())).toEqual({
        success: true,
        template,
      });
    },
  );
});
