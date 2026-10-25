import type { SkillBranchType } from "@/schemas/skillTree.schema";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { buildBranchLookupIndex } from "./branchLookupIndex";
import { selectReplacementSkillTree } from "./replacementSkillTree";
import { setUpWorkout } from "./workoutSetup";

/**
 * Builds a branch with the given tags and one level.
 *
 * generateBranch(["PREVENTION_KNEE"]) → { tags: ["PREVENTION_KNEE"], levels: { 1: { exerciseId: "e1" } } }
 */
const generateBranch = (
  tags: string[],
  levels: SkillBranchType["levels"] = { 1: { exerciseId: "e1" } },
): SkillBranchType => ({ tags, levels });

interface SelectionInputOptions {
  skillTrees: Record<string, Record<string, SkillBranchType>>;
  equipment?: string[];
  pains?: string[];
  soreMuscles?: string[];
}

/**
 * Builds a workout input whose branch lookup index holds only the given trees.
 *
 * generateSelectionInput({ skillTrees: { GKS: { "1": branch } }, equipment: ["DUMBBELL"] })
 * → adult athlete with weights at the place, index over GKS
 */
const generateSelectionInput = ({
  skillTrees,
  equipment,
  pains,
  soreMuscles,
}: SelectionInputOptions) =>
  setUpWorkout({
    ...generateRuleFamilyInput({ equipment, pains, soreMuscles }),
    branchLookupIndex: buildBranchLookupIndex(skillTrees),
  });

/**
 * Lists the branch IDs of the tree the selection returns for the given input.
 *
 * listTreeBranchIds("GKS", 1, { skillTrees: { GKSKG: { "3": branch } } }) → ["3"]
 */
const listTreeBranchIds = (
  skill: string,
  slotCount: number,
  options: SelectionInputOptions,
): string[] =>
  Object.keys(
    selectReplacementSkillTree(
      skill,
      slotCount,
      generateSelectionInput(options),
    ),
  );

/**
 * Builds one single-branch tree per tree name, numbered in name order.
 *
 * generateNamedSkillTrees() → { BAS: { "1": { tags: ["SKILL_BAS"], ... } }, GKS: { "2": ... }, ..., CD: { "11": ... } }
 */
const generateNamedSkillTrees = () => ({
  BAS: { "1": generateBranch(["SKILL_BAS"]) },
  GKS: { "2": generateBranch(["SKILL_GKS"]) },
  GKSKG: { "3": generateBranch(["SKILL_GKSKG"]) },
  SA: { "4": generateBranch(["SKILL_SA"]) },
  SAKG: { "5": generateBranch(["SKILL_SAKG"]) },
  SWR1: { "6": generateBranch(["SKILL_SWR1"]) },
  SWR1KG: { "7": generateBranch(["SKILL_SWR1KG"]) },
  PREV: { "8": generateBranch(["SKILL_PREV"]) },
  PREVKG: { "9": generateBranch(["SKILL_PREVKG"]) },
  MOB: { "10": generateBranch(["SKILL_MOB"]) },
  CD: { "11": generateBranch(["SKILL_CD"]) },
});

/**
 * Builds a prevention tree with two knee and three shoulder branches.
 *
 * generatePreventionTree()
 * → { "1": { tags: ["PREVENTION_KNEE", "REGION_LOWER_BODY"], ... }, "2": knee core,
 *     "3" to "5": shoulder upper body }
 */
const generatePreventionTree = () => ({
  "1": generateBranch(["PREVENTION_KNEE", "REGION_LOWER_BODY"]),
  "2": generateBranch(["PREVENTION_KNEE", "REGION_CORE"]),
  "3": generateBranch(["PREVENTION_SHOULDER", "REGION_UPPER_BODY"]),
  "4": generateBranch(["PREVENTION_SHOULDER", "REGION_UPPER_BODY"]),
  "5": generateBranch(["PREVENTION_SHOULDER", "REGION_UPPER_BODY"]),
});

describe("replacementSkillTree: selectReplacementSkillTree", () => {
  it.each([
    ["GKS", ["DUMBBELL"], ["2"]],
    ["GKS", [], ["3"]],
    ["GKSKG", ["DUMBBELL"], ["2"]],
    ["SAKG", ["BARBELL"], ["4"]],
    ["SA", [], ["5"]],
    ["SWR2KG", ["DUMBBELL"], ["6"]],
    ["SWR", [], ["7"]],
    ["STABILITY", ["DUMBBELL"], ["1"]],
    ["STABILITY", [], ["2"]],
    ["PREVENTION", ["DUMBBELL"], ["8"]],
    ["PREVENTION", [], ["9"]],
    ["MOBILITY", [], ["10"]],
    ["CARDIO", [], ["11"]],
    ["MOB", [], ["10"]],
    ["ALL", [], ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]],
    ["UNKNOWN", [], []],
  ])("reads the tree of %s with equipment %j", (skill, equipment, expected) => {
    expect(
      listTreeBranchIds(skill, 1, {
        skillTrees: generateNamedSkillTrees(),
        equipment,
      }),
    ).toEqual(expected);
  });

  it.each([
    ["PLYO_HIGH", ["1"]],
    ["PLYO_MEDIUM", ["2", "3"]],
    ["PLYO_LOW", ["2", "3"]],
    ["PLYO", ["1", "2", "3", "4"]],
  ])("narrows the PLYO tree to the intensity tags of %s", (skill, expected) => {
    const skillTrees = {
      PLYO: {
        "1": generateBranch(["SKILL_PLYO_HIGH"]),
        "2": generateBranch(["SKILL_PLYO_MEDIUM"]),
        "3": generateBranch(["SKILL_PLYO_LOW"]),
        "4": generateBranch(["SKILL_PLYO"]),
      },
    };

    expect(listTreeBranchIds(skill, 1, { skillTrees })).toEqual(expected);
  });

  it("drops branches without levels", () => {
    const skillTrees = {
      BAS: {
        "1": generateBranch(["SKILL_BAS"]),
        "2": generateBranch(["SKILL_BAS"], {}),
      },
    };

    expect(listTreeBranchIds("BAS", 1, { skillTrees })).toEqual(["1"]);
  });

  it("returns the selected tree's catalog branches", () => {
    const input = generateSelectionInput({
      skillTrees: generateNamedSkillTrees(),
    });

    expect(selectReplacementSkillTree("BAS", 1, input)).toEqual({
      "1": input.branchLookupIndex.get("1")?.branch,
    });
  });

  // the index holds no prevention tree, so the registry's names seed empty trees
  it("selects nothing for a prevention skill whose tree the index lacks", () => {
    expect(
      listTreeBranchIds("PREVKNEE", 1, {
        skillTrees: generateNamedSkillTrees(),
        pains: ["KNEE_LEFT"],
      }),
    ).toEqual([]);
  });

  it("narrows a prevention skill to its own prevention region", () => {
    expect(
      listTreeBranchIds("PREVKNEE", 2, {
        skillTrees: { PREVKG: generatePreventionTree() },
        pains: ["KNEE_LEFT", "SHOULDER_LEFT"],
      }),
    ).toEqual(["1", "2"]);
  });

  // shoulder pain alone gives PREVSHOULDER; PREVKNEE still checks the knee region first
  it("checks its own region first when the athlete's prevention skills lack the skill", () => {
    expect(
      listTreeBranchIds("PREVKNEE", 2, {
        skillTrees: { PREVKG: generatePreventionTree() },
        pains: ["SHOULDER_LEFT"],
      }),
    ).toEqual(["1", "2"]);
  });

  it("reads the weighted prevention tree when the place has weights", () => {
    expect(
      listTreeBranchIds("PREVSHOULDER", 1, {
        skillTrees: { PREV: generatePreventionTree(), PREVKG: {} },
        equipment: ["DUMBBELL"],
        pains: ["SHOULDER_LEFT"],
      }),
    ).toEqual(["3", "4", "5"]);
  });

  it("falls back to the region of another prevention skill when its own region holds too few branches", () => {
    expect(
      listTreeBranchIds("PREVKNEE", 3, {
        skillTrees: { PREVKG: generatePreventionTree() },
        pains: ["KNEE_LEFT", "SHOULDER_LEFT"],
      }),
    ).toEqual(["3", "4", "5"]);
  });

  it("selects nothing when no prevention region holds enough branches", () => {
    expect(
      listTreeBranchIds("PREVKNEE", 4, {
        skillTrees: { PREVKG: generatePreventionTree() },
        pains: ["KNEE_LEFT", "SHOULDER_LEFT"],
      }),
    ).toEqual([]);
  });

  it("selects nothing for a prevention skill without pains", () => {
    expect(
      listTreeBranchIds("PREVKNEE", 1, {
        skillTrees: { PREVKG: generatePreventionTree() },
      }),
    ).toEqual([]);
  });

  // sore QUADRICEPS removes the lower body branch 1, so the knee region holds one
  it("counts only the branches outside the sore region", () => {
    expect(
      listTreeBranchIds("PREVKNEE", 2, {
        skillTrees: { PREVKG: generatePreventionTree() },
        pains: ["KNEE_LEFT", "SHOULDER_LEFT"],
        soreMuscles: ["QUADRICEPS"],
      }),
    ).toEqual(["3", "4", "5"]);
  });

  it("reads muscle soreness tags in any letter case", () => {
    expect(
      listTreeBranchIds("PREVKNEE", 1, {
        skillTrees: { PREVKG: generatePreventionTree() },
        pains: ["KNEE_LEFT"],
        soreMuscles: ["quadriceps"],
      }),
    ).toEqual(["2"]);
  });

  it("throws for muscle soreness in two areas", () => {
    const input = generateSelectionInput({
      skillTrees: { PREVKG: generatePreventionTree() },
      pains: ["KNEE_LEFT"],
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    let thrown: unknown;

    try {
      selectReplacementSkillTree("PREVKNEE", 1, input);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toEqual({
      type: "TOO_MUCH_SORENESS",
      subtype: "MULTIPLE_REGIONS",
      params: ["UPPER_BODY", "LOWER_BODY"],
    });
  });

  describe("special warm-up", () => {
    const skillTrees = {
      WUSPEZIAL: {
        "1": generateBranch(["PAIN_KNEE", "REGION_LOWER_BODY"]),
        "2": generateBranch(["PAIN_SHOULDER", "REGION_UPPER_BODY"]),
        "3": generateBranch(["PAIN_SHOULDER", "REGION_UPPER_BODY"]),
      },
    };

    it.each([
      [1, ["1"]],
      [2, ["2", "3"]],
      [3, []],
    ])(
      "takes the first prevention region that fills %s slots",
      (slotCount, expected) => {
        expect(
          listTreeBranchIds("WUSPEZIAL", slotCount, {
            skillTrees,
            pains: ["KNEE_LEFT", "SHOULDER_LEFT"],
          }),
        ).toEqual(expected);
      },
    );

    it("selects nothing without pains", () => {
      expect(listTreeBranchIds("WUSPEZIAL", 1, { skillTrees })).toEqual([]);
    });
  });
});
