import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { generateGenerationInput } from "@test/factories/generationInput";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { readReplacementPools } from "./replacementPools";

// Builds a PREVKNEE picks block that draws one branch with the tag.
// generatePreventionPicks("PREVENTION_ANKLE")
// → { kind: "picks", skill: "PREVKNEE", picks: [{ tags: ["PREVENTION_ANKLE"], count: 1 }] }
const generatePreventionPicks = (tag: string) =>
  generatePicksBlock("PREVKNEE", { picks: [{ tags: [tag], count: 1 }] });

describe("replacementPools: readReplacementPools", () => {
  it("keys the pool of each picks block by its replay block", () => {
    const input = generateGenerationInput();
    const kneeBlock = generateBranchesBlock("PREVKNEE", ["153"]);
    const ankleBlock = generateBranchesBlock("PREVKNEE", ["154"]);
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePreventionPicks("PREVENTION_KNEE_HIP"),
      generatePreventionPicks("PREVENTION_ANKLE"),
    ]);

    const pools = readReplacementPools(
      template,
      [
        { block: kneeBlock, templateIndex: 1 },
        { block: ankleBlock, templateIndex: 2 },
      ],
      input,
      getAllSkillTrees(),
    );

    expect([...pools.keys()]).toEqual([kneeBlock, ankleBlock]);
  });

  it("gives two blocks of one skill their own pools", () => {
    const input = generateGenerationInput();
    const kneeBlock = generateBranchesBlock("PREVKNEE", ["153"]);
    const ankleBlock = generateBranchesBlock("PREVKNEE", ["154"]);
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePreventionPicks("PREVENTION_KNEE_HIP"),
      generatePreventionPicks("PREVENTION_ANKLE"),
    ]);

    const pools = readReplacementPools(
      template,
      [
        { block: kneeBlock, templateIndex: 1 },
        { block: ankleBlock, templateIndex: 2 },
      ],
      input,
      getAllSkillTrees(),
    );

    expect(Object.keys(pools.get(kneeBlock) ?? {})).toContain("153");
    expect(Object.keys(pools.get(kneeBlock) ?? {})).not.toContain("154");
    expect(Object.keys(pools.get(ankleBlock) ?? {})).toContain("154");
    expect(Object.keys(pools.get(ankleBlock) ?? {})).not.toContain("153");
  });

  it("maps a drawn block to its own template index whatever the drawn order", () => {
    const input = generateGenerationInput();
    const kneeBlock = generateBranchesBlock("PREVKNEE", ["153"]);
    const ankleBlock = generateBranchesBlock("PREVKNEE", ["154"]);
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePreventionPicks("PREVENTION_KNEE_HIP"),
      generatePreventionPicks("PREVENTION_ANKLE"),
    ]);

    const pools = readReplacementPools(
      template,
      [
        { block: ankleBlock, templateIndex: 2 },
        { block: kneeBlock, templateIndex: 1 },
      ],
      input,
      getAllSkillTrees(),
    );

    expect(Object.keys(pools.get(ankleBlock) ?? {})).toContain("154");
  });

  it("leaves a drawn block without a template index out", () => {
    const input = generateGenerationInput();
    const kneeBlock = generateBranchesBlock("PREVKNEE", ["153"]);
    const cardioBlock = generateBranchesBlock("CARDIO_3", ["580"]);
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePreventionPicks("PREVENTION_KNEE_HIP"),
    ]);

    const pools = readReplacementPools(
      template,
      [{ block: cardioBlock }, { block: kneeBlock, templateIndex: 1 }],
      input,
      getAllSkillTrees(),
    );

    expect(pools.has(cardioBlock)).toBe(false);
  });

  it("throws an error naming a template index that matches no picks block", () => {
    const input = generateGenerationInput();
    const kneeBlock = generateBranchesBlock("PREVKNEE", ["153"]);
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePreventionPicks("PREVENTION_KNEE_HIP"),
    ]);

    const thrown = catchThrownValue(() =>
      readReplacementPools(
        template,
        [{ block: kneeBlock, templateIndex: 5 }],
        input,
        getAllSkillTrees(),
      ),
    );

    expect(thrown).toEqual(
      new Error("Template index 5 matches no picks block of the template"),
    );
  });
});
