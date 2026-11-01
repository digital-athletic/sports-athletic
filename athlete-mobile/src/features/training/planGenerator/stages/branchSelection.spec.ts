import {
  generateBranchSelectionInput,
  generateDirectionSequence,
  generateMultiEntryRequest,
  generateSelectionBranches,
  generateSkillSelectionRequest,
} from "@test/factories/branchSelection";
import { generateDerivedProfile } from "@test/factories/derivedProfile";
import { generateRegionTagEntry } from "@test/factories/regionConfigs";
import {
  generateSkillBranch,
  generateTreeBranch,
} from "@test/factories/skillTree";
import type { PlanGenerationInput } from "../planGenerationInput/planGenerationInput";
import type { BranchRuleChainDay } from "../ruleFamilies/branchRuleChain";
import {
  selectDayBranches,
  selectSkillBranches,
  type SkillSelectionRequest,
} from "./branchSelection";

const advancedAthlete = generateDerivedProfile();
const hallDay: BranchRuleChainDay = { place: "HALL", usedBranchIds: [] };

// One slot without a type draw takes two draws: involvement, then the pick.
const COMPLEX = 0.5;
const ISOLATED = 0.1;
const FIRST = 0;
const LAST = 0.99;

const selectBranchIds = (
  input: PlanGenerationInput,
  request: SkillSelectionRequest,
  day: BranchRuleChainDay = hallDay,
  profile = advancedAthlete,
): string[] => {
  const { selection } = selectSkillBranches(request, day, profile, input);
  return selection.type === "BRANCHES"
    ? selection.branches.map(({ branchId }) => branchId)
    : [];
};

describe("branchSelection: selectSkillBranches", () => {
  describe("movement direction", () => {
    it("prefers the first direction of the authored priority sequence and leaves the configuration unchanged", () => {
      const input = generateBranchSelectionInput({
        skillTrees: {
          BAS: generateSelectionBranches({
            a: [
              "REGION_UPPER_BODY",
              "EXERCISE_DIRECTION_HORIZONTAL_PUSH",
              "SIDE_BOTH",
            ],
            b: [
              "REGION_UPPER_BODY",
              "EXERCISE_DIRECTION_VERTICAL_PULL",
              "SIDE_BOTH",
            ],
          }),
        },
        movementDirections: {
          UPPER_BODY: generateDirectionSequence(1, [
            "VERTICAL_PULL",
            "HORIZONTAL_PUSH",
          ]),
        },
        draws: [COMPLEX, FIRST],
      });
      const request = generateSkillSelectionRequest(
        "BAS",
        ["REGION_UPPER_BODY"],
        1,
      );

      expect(selectBranchIds(input, request)).toEqual(["b"]);
      expect(input.authoredData.movementDirections.UPPER_BODY).toEqual(
        generateDirectionSequence(1, ["VERTICAL_PULL", "HORIZONTAL_PUSH"]),
      );
    });

    it("moves to the next direction once a slot used one", () => {
      const input = generateBranchSelectionInput({
        skillTrees: {
          BAS: generateSelectionBranches({
            a: [
              "REGION_UPPER_BODY",
              "EXERCISE_DIRECTION_VERTICAL_PULL",
              "SIDE_BOTH",
            ],
            b: [
              "REGION_UPPER_BODY",
              "EXERCISE_DIRECTION_VERTICAL_PULL",
              "SIDE_BOTH",
            ],
            c: [
              "REGION_UPPER_BODY",
              "EXERCISE_DIRECTION_HORIZONTAL_PUSH",
              "SIDE_BOTH",
            ],
          }),
        },
        movementDirections: {
          UPPER_BODY: generateDirectionSequence(2, [
            "VERTICAL_PULL",
            "HORIZONTAL_PUSH",
          ]),
        },
        draws: [COMPLEX, FIRST, COMPLEX, FIRST],
      });
      const request = generateSkillSelectionRequest(
        "BAS",
        ["REGION_UPPER_BODY"],
        2,
      );

      expect(selectBranchIds(input, request)).toEqual(["a", "c"]);
    });

    it("keeps every candidate when no direction matches", () => {
      const input = generateBranchSelectionInput({
        skillTrees: {
          BAS: generateSelectionBranches({
            a: ["REGION_UPPER_BODY", "EXERCISE_DIRECTION_VERTICAL_PULL"],
            b: ["REGION_UPPER_BODY", "EXERCISE_DIRECTION_HORIZONTAL_PUSH"],
          }),
        },
        movementDirections: {
          UPPER_BODY: generateDirectionSequence(1, ["KNEE"]),
        },
        draws: [COMPLEX, LAST],
      });
      const request = generateSkillSelectionRequest(
        "BAS",
        ["REGION_UPPER_BODY"],
        1,
      );

      expect(selectBranchIds(input, request)).toEqual(["b"]);
    });

    it("applies the movement direction before the muscle preference", () => {
      const input = generateBranchSelectionInput({
        skillTrees: {
          BAS: generateSelectionBranches({
            a: [
              "REGION_UPPER_BODY",
              "EXERCISE_DIRECTION_VERTICAL_PULL",
              "SIDE_BOTH",
            ],
            b: [
              "REGION_UPPER_BODY",
              "EXERCISE_DIRECTION_HORIZONTAL_PUSH",
              "MUSCLE_CHEST",
            ],
          }),
        },
        movementDirections: {
          UPPER_BODY: generateDirectionSequence(1, ["VERTICAL_PULL"]),
        },
        draws: [COMPLEX, LAST],
      });
      const request = generateSkillSelectionRequest(
        "BAS",
        ["REGION_UPPER_BODY"],
        1,
      );

      expect(selectBranchIds(input, request)).toEqual(["a"]);
    });
  });

  describe("side", () => {
    it("avoids a one-sided exercise in the last slot", () => {
      const input = generateBranchSelectionInput({
        skillTrees: {
          BAS: generateSelectionBranches({
            a: ["REGION_LOWER_BODY"],
            b: ["REGION_LOWER_BODY"],
          }),
        },
        oneSidedExerciseIds: ["a"],
        draws: [COMPLEX, FIRST],
      });
      const request = generateSkillSelectionRequest(
        "BAS",
        ["REGION_LOWER_BODY"],
        1,
      );

      expect(selectBranchIds(input, request)).toEqual(["b"]);
    });

    it("counts a one-sided exercise as two slots, because the workout lists both sides", () => {
      const input = generateBranchSelectionInput({
        skillTrees: {
          BAS: generateSelectionBranches({
            a: ["REGION_LOWER_BODY"],
            b: ["REGION_LOWER_BODY"],
            c: ["REGION_LOWER_BODY"],
          }),
        },
        oneSidedExerciseIds: ["a"],
        draws: [COMPLEX, FIRST],
      });
      const request = generateSkillSelectionRequest(
        "BAS",
        ["REGION_LOWER_BODY"],
        2,
      );

      expect(selectBranchIds(input, request)).toEqual(["a"]);
    });
  });

  it("prefers a big muscle the earlier slots of the tag entry left untrained", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        BAS: generateSelectionBranches({
          a: ["REGION_LOWER_BODY", "MUSCLE_GLUTES"],
          b: ["REGION_LOWER_BODY", "MUSCLE_GLUTES"],
          c: ["REGION_LOWER_BODY", "MUSCLE_QUADRICEPS"],
        }),
      },
      draws: [COMPLEX, FIRST, COMPLEX, FIRST],
    });
    const request = generateSkillSelectionRequest(
      "BAS",
      ["REGION_LOWER_BODY"],
      2,
    );

    expect(selectBranchIds(input, request)).toEqual(["a", "c"]);
  });

  it.each([
    [ISOLATED, "b"],
    [COMPLEX, "a"],
  ])(
    "draws complex or isolated 70/30 for a core slot too (draw %d → %s)",
    (involvementDraw, expectedBranchId) => {
      const input = generateBranchSelectionInput({
        skillTrees: {
          BAS: generateSelectionBranches({
            a: ["REGION_CORE", "MUSCLE_INVOLVEMENT_COMPLEX"],
            b: ["REGION_CORE", "MUSCLE_INVOLVEMENT_ISOLATED"],
          }),
        },
        draws: [involvementDraw, FIRST],
      });
      const request = generateSkillSelectionRequest("BAS", ["REGION_CORE"], 1);

      expect(selectBranchIds(input, request)).toEqual([expectedBranchId]);
    },
  );

  it("prefers barbell branches for max strength", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        MAX: generateSelectionBranches({
          "143": ["EQ_DUMBBELL"],
          "145": ["EQ_BARBELL"],
        }),
      },
      trainingPlaces: { STUDIO: { equipment: ["BARBELL", "DUMBBELL"] } },
      draws: [COMPLEX, FIRST],
    });
    const request = generateSkillSelectionRequest(
      "MAX",
      ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
      1,
    );

    expect(
      selectBranchIds(input, request, { place: "STUDIO", usedBranchIds: [] }),
    ).toEqual(["145"]);
  });

  it("reads branch 142 for the max strength rowing name, since branch 141 holds no exercise", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        MAX: {
          "141": generateSkillBranch([], {}),
          ...generateSelectionBranches({ "142": [] }),
        },
      },
      draws: [COMPLEX, FIRST],
    });
    const request = generateSkillSelectionRequest(
      "MAX",
      ["EXERCISE_NAME_ROWING"],
      1,
    );

    expect(selectBranchIds(input, request)).toEqual(["142"]);
  });

  it("fills the weighted share as a quota over the slots, drawing the type while both quotas are open", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        GKS: generateSelectionBranches({
          a: ["EQ_DUMBBELL"],
          b: ["EQ_DUMBBELL"],
        }),
        GKSKG: generateSelectionBranches({ c: [] }),
      },
      trainingPlaces: { HOME: { equipment: ["DUMBBELL"] } },
      // weighted, involvement, pick; then the bodyweight quota alone is open
      draws: [0, COMPLEX, FIRST, COMPLEX, FIRST],
    });
    const request = generateSkillSelectionRequest("GKS", [], 2);

    expect(
      selectBranchIds(input, request, { place: "HOME", usedBranchIds: [] }),
    ).toEqual(["a", "c"]);
  });

  it("counts the weighted quota over the slots of the whole skill, across its tag entries", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        GKS: generateSelectionBranches({ a: ["EQ_DUMBBELL"] }),
        GKSKG: generateSelectionBranches({ c: [] }),
      },
      trainingPlaces: { HOME: { equipment: ["DUMBBELL"] } },
      // bodyweight, involvement, pick; then the weighted quota alone is open
      draws: [0.99, COMPLEX, FIRST, COMPLEX, FIRST],
    });
    const request = generateMultiEntryRequest("GKS", [
      { tags: [], count: 1 },
      { tags: [], count: 1 },
    ]);

    expect(
      selectBranchIds(input, request, { place: "HOME", usedBranchIds: [] }),
    ).toEqual(["c", "a"]);
  });

  it("raises the configuration error OTHER/OTHER for a skill tree the authored data lacks", () => {
    const input = generateBranchSelectionInput({ skillTrees: {}, draws: [] });
    const request = generateSkillSelectionRequest("BAS", [], 1);

    expect(() => selectBranchIds(input, request)).toThrow(
      expect.objectContaining({
        type: "OTHER",
        subtype: "OTHER",
        params: ["skillTree", "BAS"],
      }),
    );
  });

  it("skips a branch when nothing resolves at or below the athlete's level", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        BAS: {
          a: generateSkillBranch([], { 2: { exerciseId: "a" } }),
          b: generateTreeBranch(["b"]),
        },
      },
      draws: [COMPLEX, FIRST],
    });
    const request = generateSkillSelectionRequest("BAS", [], 1);
    const beginner = generateDerivedProfile({ fitnessLevel: "BEGINNER" });

    expect(selectBranchIds(input, request, hallDay, beginner)).toEqual(["b"]);
  });

  it("skips a candidate that resolves to an exercise the skill already holds", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        BAS: {
          a: generateTreeBranch(["x"]),
          b: generateTreeBranch(["x"]),
          c: generateTreeBranch(["c"]),
        },
      },
      draws: [COMPLEX, FIRST, COMPLEX, FIRST],
    });
    const request = generateMultiEntryRequest("BAS", [
      { tags: [], count: 1 },
      { tags: [], count: 1 },
    ]);

    expect(selectBranchIds(input, request)).toEqual(["a", "c"]);
  });

  it("draws one region when a tag entry names several", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        BAS: generateSelectionBranches({
          a: ["REGION_UPPER_BODY"],
          b: ["REGION_LOWER_BODY"],
        }),
      },
      draws: [0.9, COMPLEX, FIRST],
    });
    const request = generateSkillSelectionRequest(
      "BAS",
      ["REGION_UPPER_BODY", "REGION_LOWER_BODY"],
      1,
    );

    expect(selectBranchIds(input, request)).toEqual(["b"]);
  });

  it("reads the skill tree a skill tag names", () => {
    const input = generateBranchSelectionInput({
      skillTrees: {
        SAKG: generateSelectionBranches({ a: [] }),
        SAS: generateSelectionBranches({ s: [] }),
      },
      draws: [COMPLEX, FIRST],
    });
    const request = generateMultiEntryRequest("SAKG", [
      generateRegionTagEntry("SKILL_SAS", 1),
    ]);

    expect(selectBranchIds(input, request)).toEqual(["s"]);
  });

  it("returns the same picks for the same draw sequence", () => {
    const buildInput = () =>
      generateBranchSelectionInput({
        skillTrees: {
          BAS: generateSelectionBranches({
            a: ["REGION_CORE"],
            b: ["REGION_CORE"],
            c: ["REGION_CORE"],
          }),
        },
        draws: [COMPLEX, 0.6, ISOLATED, 0.3],
      });
    const request = generateSkillSelectionRequest("BAS", ["REGION_CORE"], 2);

    expect(selectBranchIds(buildInput(), request)).toEqual(
      selectBranchIds(buildInput(), request),
    );
  });

  it("starts from any set of used branches and returns it extended with its picks", () => {
    const input = generateBranchSelectionInput({
      skillTrees: { BAS: generateSelectionBranches({ a: [], b: [] }) },
      draws: [COMPLEX, FIRST],
    });
    const request = generateSkillSelectionRequest("BAS", [], 1);

    const { usedBranchIds } = selectSkillBranches(
      request,
      { place: "HALL", usedBranchIds: ["a", "z"] },
      advancedAthlete,
      input,
    );

    expect(usedBranchIds).toEqual(["a", "z", "b"]);
  });
});

describe("branchSelection: selectDayBranches", () => {
  it("leaves a skill without usable branch empty and keeps the other skills of the day", () => {
    const input = generateBranchSelectionInput({
      skillTrees: { BAS: generateSelectionBranches({ a: [] }), MOB: {} },
      draws: [COMPLEX, FIRST],
    });

    const result = selectDayBranches(
      [
        generateSkillSelectionRequest("MOB", [], 1),
        generateSkillSelectionRequest("BAS", [], 1),
      ],
      "HALL",
      advancedAthlete,
      input,
    );

    expect(result.selections).toEqual([
      { type: "EMPTY_SKILL", skill: "MOB" },
      {
        type: "BRANCHES",
        skill: "BAS",
        branches: [
          { branchId: "a", tags: [], levels: { 1: { exerciseId: "a" } } },
        ],
      },
    ]);
  });

  it("passes the used branches of each skill on to the next skill", () => {
    const input = generateBranchSelectionInput({
      skillTrees: { BAS: generateSelectionBranches({ a: [], b: [] }) },
      draws: [COMPLEX, FIRST, COMPLEX, FIRST],
    });
    const request = generateSkillSelectionRequest("BAS", [], 1);

    const result = selectDayBranches(
      [request, request],
      "HALL",
      advancedAthlete,
      input,
    );

    expect(result.usedBranchIds).toEqual(["a", "b"]);
  });
});
