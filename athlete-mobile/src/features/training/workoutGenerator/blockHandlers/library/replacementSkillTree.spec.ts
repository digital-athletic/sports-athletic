import {
  generateNamedSkillTrees,
  generatePreventionTree,
  generateSkillBranch,
} from "@test/factories/skillTree";
import { catchThrownValue } from "@test/factories/thrownValue";
import {
  generateWorkoutInput,
  type WorkoutInputFactoryOptions,
} from "@test/factories/workoutInput";
import { selectReplacementSkillTree } from "./replacementSkillTree";

/**
 * Lists the branch IDs of the replacement tree chosen for the given input.
 *
 * listTreeBranchIds("GKS", 1, { skillTrees: { GKSKG: { "3": branch } } }) → ["3"]
 */
const listTreeBranchIds = (
  skill: string,
  slotCount: number,
  options: WorkoutInputFactoryOptions,
): string[] =>
  Object.keys(
    selectReplacementSkillTree(skill, slotCount, generateWorkoutInput(options)),
  );

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
        "1": generateSkillBranch(["SKILL_PLYO_HIGH"]),
        "2": generateSkillBranch(["SKILL_PLYO_MEDIUM"]),
        "3": generateSkillBranch(["SKILL_PLYO_LOW"]),
        "4": generateSkillBranch(["SKILL_PLYO"]),
      },
    };

    expect(listTreeBranchIds(skill, 1, { skillTrees })).toEqual(expected);
  });

  it("drops branches without levels", () => {
    const skillTrees = {
      BAS: {
        "1": generateSkillBranch(["SKILL_BAS"]),
        "2": generateSkillBranch(["SKILL_BAS"], {}),
      },
    };

    expect(listTreeBranchIds("BAS", 1, { skillTrees })).toEqual(["1"]);
  });

  it("returns the selected tree's catalog branches", () => {
    const input = generateWorkoutInput({
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
    const input = generateWorkoutInput({
      skillTrees: { PREVKG: generatePreventionTree() },
      pains: ["KNEE_LEFT"],
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    const thrown = catchThrownValue(() =>
      selectReplacementSkillTree("PREVKNEE", 1, input),
    );

    expect(thrown).toEqual({
      type: "TOO_MUCH_SORENESS",
      subtype: "MULTIPLE_REGIONS",
      params: ["UPPER_BODY", "LOWER_BODY"],
    });
  });

  describe("special warm-up", () => {
    const skillTrees = {
      WUSPEZIAL: {
        "1": generateSkillBranch(["PAIN_KNEE", "REGION_LOWER_BODY"]),
        "2": generateSkillBranch(["PAIN_SHOULDER", "REGION_UPPER_BODY"]),
        "3": generateSkillBranch(["PAIN_SHOULDER", "REGION_UPPER_BODY"]),
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
