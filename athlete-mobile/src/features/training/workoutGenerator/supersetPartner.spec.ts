import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { pickSupersetPartner, rankSupersetPartner } from "./supersetPartner";

/**
 * Fakes a two sided branch reference with the exercise ID `e<id>`.
 *
 * generateBranchReference("c", ["MUSCLE_CHEST"])
 * → { branchId: "c", exerciseId: "ec", branchTags: ["SIDE_BOTH", "MUSCLE_CHEST"] }
 */
const generateBranchReference = (
  id: string,
  tags: string[],
  exerciseId = `e${id}`,
): BranchExerciseReference => ({
  branchId: id,
  exerciseId,
  branchTags: ["SIDE_BOTH", ...tags],
});

describe("supersetPartner: rankSupersetPartner", () => {
  const lead = generateBranchReference("q", [
    "MUSCLE_QUADRICEPS",
    "REGION_LOWER_BODY",
    "EXERCISE_DIRECTION_KNEE",
    "EXERCISE_DIRECTION_LOWER_BODY",
  ]);

  it.each<[string, BranchExerciseReference, number | null]>([
    [
      "an opposing muscle first",
      generateBranchReference("g", ["MUSCLE_GLUTES", "REGION_LOWER_BODY"]),
      1,
    ],
    [
      "a big muscle of another region second",
      generateBranchReference("c", ["MUSCLE_CHEST", "REGION_UPPER_BODY"]),
      2,
    ],
    [
      "a big muscle of the same region third",
      generateBranchReference("h", ["MUSCLE_HAMSTRINGS", "REGION_LOWER_BODY"]),
      3,
    ],
    [
      "a small muscle of another region fourth",
      generateBranchReference("b", ["MUSCLE_BICEPS", "REGION_UPPER_BODY"]),
      4,
    ],
    [
      "a small muscle of the same region fifth",
      generateBranchReference("k", ["MUSCLE_CALF", "REGION_LOWER_BODY"]),
      5,
    ],
    [
      "a direction without an opposite as no movement pattern",
      generateBranchReference("k", [
        "MUSCLE_CALF",
        "REGION_LOWER_BODY",
        "EXERCISE_DIRECTION_LOWER_BODY",
      ]),
      5,
    ],
    [
      "a one sided exercise as excluded",
      {
        branchId: "o",
        exerciseId: "eo",
        branchTags: ["SIDE_ONE", "MUSCLE_CHEST"],
      },
      null,
    ],
    [
      "the lead's own exercise as excluded",
      generateBranchReference("x", ["MUSCLE_CHEST"], "eq"),
      null,
    ],
    [
      "the same movement pattern as excluded",
      generateBranchReference("s", ["MUSCLE_CHEST", "EXERCISE_DIRECTION_KNEE"]),
      null,
    ],
    [
      "the same primary muscle group on one side as excluded",
      generateBranchReference("l", ["MUSCLE_QUADRICEPS_LEFT"]),
      null,
    ],
  ])("ranks %s", (_, candidate, rank) => {
    expect(rankSupersetPartner(lead, candidate, ["GLUTES"])).toBe(rank);
  });
});

describe("supersetPartner: pickSupersetPartner", () => {
  const lead = generateBranchReference("c", [
    "MUSCLE_CHEST",
    "REGION_UPPER_BODY",
  ]);
  const quadriceps = generateBranchReference("q", [
    "MUSCLE_QUADRICEPS",
    "REGION_LOWER_BODY",
  ]);
  const glutes = generateBranchReference("g", [
    "MUSCLE_GLUTES",
    "REGION_LOWER_BODY",
  ]);
  const biceps = generateBranchReference("b", [
    "MUSCLE_BICEPS",
    "REGION_UPPER_BODY",
  ]);

  it("breaks a tie among the best ranked partners with one draw", () => {
    const random = jest.fn(generateSequenceRandom([0.5]));

    const partner = pickSupersetPartner(
      lead,
      [biceps, quadriceps, glutes],
      [],
      random,
    );

    expect(partner).toBe(glutes);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it("picks the opposing muscle over a better region match", () => {
    const latissimus = generateBranchReference("l", [
      "MUSCLE_LATISSIMUS",
      "REGION_UPPER_BODY",
    ]);

    const partner = pickSupersetPartner(
      lead,
      [quadriceps, latissimus],
      ["LATISSIMUS"],
      generateSequenceRandom([0.99]),
    );

    expect(partner).toBe(latissimus);
  });

  it("draws nothing when no candidate qualifies", () => {
    const random = jest.fn(generateSequenceRandom([]));

    const partner = pickSupersetPartner(
      lead,
      [generateBranchReference("c2", ["MUSCLE_CHEST"])],
      [],
      random,
    );

    expect(partner).toBeUndefined();
    expect(random).not.toHaveBeenCalled();
  });
});
