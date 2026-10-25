import type { GenerationInputFactoryOptions } from "@test/factories/generationInput";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateTaggedBranches } from "@test/factories/skillTree";
import { generateBranchesBlock } from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { restrictTemplateBranchesBlock } from "./templateBranchRestriction";

describe("templateBranchRestriction: restrictTemplateBranchesBlock", () => {
  it("keeps every listed branch no athlete rule restricts, in listed order", () => {
    const block = generateBranchesBlock("GKS", ["2", "1", "2"]);
    const input = generateRuleFamilyInput({
      skillTrees: {
        GKS: generateTaggedBranches({ "1": ["REGION_CORE"], "2": [] }),
      },
    });

    expect(restrictTemplateBranchesBlock(block, input).branches).toEqual([
      "2",
      "1",
      "2",
    ]);
  });

  it.each<[string, string, GenerationInputFactoryOptions]>([
    ["a branch blocked for knee pain", "BLOCK_KNEE", { pains: ["KNEE_LEFT"] }],
    ["a child branch for an adult", "AGE_CHILD", { birthday: "1990-06-15" }],
    ["an adult branch for a child", "AGE_ADULT", { birthday: "2016-01-01" }],
    ["a male branch for a female athlete", "GENDER_MALE", { gender: "FEMALE" }],
  ])("drops %s and keeps the others", (_behaviour, tag, athlete) => {
    const block = generateBranchesBlock("GKS", ["1", "2"]);
    const input = generateRuleFamilyInput({
      ...athlete,
      skillTrees: { GKS: generateTaggedBranches({ "1": [tag], "2": [] }) },
    });

    expect(restrictTemplateBranchesBlock(block, input).branches).toEqual(["2"]);
  });

  it.each<[string, string, GenerationInputFactoryOptions, unknown]>([
    [
      "pain",
      "BLOCK_KNEE",
      { pains: ["KNEE_LEFT"] },
      { type: "NO_EXERCISES", subtype: "PAIN", params: ["KNEE"] },
    ],
    [
      "age group",
      "AGE_CHILD",
      { birthday: "1990-06-15" },
      { type: "NO_EXERCISES", subtype: "AGE", params: [] },
    ],
    [
      "gender",
      "GENDER_MALE",
      { gender: "FEMALE" },
      { type: "NO_EXERCISES", subtype: "GENDER", params: [] },
    ],
  ])(
    "throws the %s error when that rule removes every listed branch",
    (_rule, tag, athlete, error) => {
      const block = generateBranchesBlock("GKS", ["1"]);
      const input = generateRuleFamilyInput({
        ...athlete,
        skillTrees: { GKS: generateTaggedBranches({ "1": [tag] }) },
      });

      expect(
        catchThrownValue(() => restrictTemplateBranchesBlock(block, input)),
      ).toStrictEqual(error);
    },
  );

  it("keeps a block whose listed branches the catalog lacks for the handler to report", () => {
    const block = generateBranchesBlock("GKS", ["999999"]);

    expect(
      restrictTemplateBranchesBlock(block, generateRuleFamilyInput()),
    ).toBe(block);
  });
});
