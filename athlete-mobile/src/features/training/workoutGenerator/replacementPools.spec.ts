import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { generateGenerationInput } from "@test/factories/generationInput";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { readReplacementPools } from "./replacementPools";

// Builds a PREVKNEE branches block of the branch, picked by one pick with the tag.
// generatePreventionBlock("153", "PREVENTION_KNEE_HIP")
// → { kind: "branches", skill: "PREVKNEE", branches: ["153"], pickedFrom: { picks: [{ tags: ["PREVENTION_KNEE_HIP"], count: 1 }] } }
const generatePreventionBlock = (branchId: string, tag: string) =>
  generateBranchesBlock("PREVKNEE", [branchId], {
    pickedFrom: { picks: [{ tags: [tag], count: 1 }] },
  });

describe("replacementPools: readReplacementPools", () => {
  it("gives two blocks of one skill the pools of their own picks", () => {
    const kneeBlock = generatePreventionBlock("153", "PREVENTION_KNEE_HIP");
    const ankleBlock = generatePreventionBlock("154", "PREVENTION_ANKLE");
    const workout = generateTemplate([
      generatePicksBlock("MOB"),
      kneeBlock,
      ankleBlock,
    ]);

    const pools = readReplacementPools(
      workout,
      generateGenerationInput(),
      getAllSkillTrees(),
    );

    expect(Object.keys(pools.get(kneeBlock) ?? {})).toContain("153");
    expect(Object.keys(pools.get(kneeBlock) ?? {})).not.toContain("154");
    expect(Object.keys(pools.get(ankleBlock) ?? {})).toContain("154");
    expect(Object.keys(pools.get(ankleBlock) ?? {})).not.toContain("153");
  });

  it("leaves out a block without pickedFrom and the picks blocks", () => {
    const picksBlock = generatePicksBlock("MOB");
    const cardioBlock = generateBranchesBlock("CARDIO_3", ["580"]);
    const kneeBlock = generatePreventionBlock("153", "PREVENTION_KNEE_HIP");
    const workout = generateTemplate([picksBlock, cardioBlock, kneeBlock]);

    const pools = readReplacementPools(
      workout,
      generateGenerationInput(),
      getAllSkillTrees(),
    );

    expect([...pools.keys()]).toEqual([kneeBlock]);
  });

  it("returns no pools for a workout without pickedFrom", () => {
    const workout = generateTemplate([
      generatePicksBlock("MOB"),
      generateBranchesBlock("GKS", ["510"]),
    ]);

    const pools = readReplacementPools(
      workout,
      generateGenerationInput(),
      getAllSkillTrees(),
    );

    expect(pools.size).toBe(0);
  });
});
