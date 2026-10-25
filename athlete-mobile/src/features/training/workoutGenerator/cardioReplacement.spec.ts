import { loadExercises } from "@/data/loadExercises";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateCardioBlock } from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { replaceCardioBlock } from "./cardioReplacement";
import { setUpWorkout } from "./workoutSetup";

const exerciseCatalog = loadExercises();

describe("cardioReplacement: replaceCardioBlock", () => {
  const input = setUpWorkout(generateRuleFamilyInput({ exerciseCatalog }));

  it("swaps the block for the CARDIO_5 branch and names the skill it replaces", () => {
    const result = replaceCardioBlock(
      generateCardioBlock("CARDIO_3", 600),
      input,
    );

    expect(result).toMatchObject({
      status: "filled",
      block: {
        kind: "branches",
        skill: "CARDIO_5",
        branches: ["576"],
        duration: 600,
      },
      usedBranchIds: ["576"],
      swappedFromSkill: "CARDIO_3",
    });
    expect(
      result.status === "filled" &&
        result.exercises.map(({ branchId, exerciseId }) => [
          branchId,
          exerciseId,
        ]),
    ).toEqual([["576", "39"]]);
  });

  it.each([
    [1500, 1200],
    [1200, 1200],
    [600, 600],
  ])("caps a duration of %s seconds at %s seconds", (duration, expected) => {
    const result = replaceCardioBlock(
      generateCardioBlock("CARDIO_4", duration),
      input,
    );

    expect(result.block.kind === "branches" && result.block.duration).toBe(
      expected,
    );
  });

  it("leaves a block without a duration without one", () => {
    const { block } = replaceCardioBlock(
      generateCardioBlock("CARDIO_2"),
      input,
    );

    expect(block).toEqual({
      kind: "branches",
      skill: "CARDIO_5",
      branches: ["576"],
    });
  });

  // the catalog lacks exercise 39, so the branch keeps its slot as "-1"
  it("keeps the slot with exercise ID -1 when the catalog lacks the exercise", () => {
    const result = replaceCardioBlock(generateCardioBlock("CARDIO_3"), {
      ...input,
      exerciseCatalog: exerciseCatalog.filter(({ id }) => id !== "39"),
    });

    expect(
      result.status === "filled" &&
        result.exercises.map(({ exerciseId }) => exerciseId),
    ).toEqual(["-1"]);
  });

  it("throws the raw error when the skill trees hold no CARDIO_5 branch 576", () => {
    const thrown = catchThrownValue(() =>
      replaceCardioBlock(generateCardioBlock("CARDIO_3"), {
        ...input,
        branchLookupIndex: new Map(),
      }),
    );

    expect(thrown).toEqual({
      type: "NO_EXERCISES",
      subtype: "CARDIO_5_MISSING",
      params: [],
    });
  });
});
