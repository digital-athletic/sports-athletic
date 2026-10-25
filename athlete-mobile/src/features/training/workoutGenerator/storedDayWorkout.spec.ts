import * as v from "valibot";
import { TemplateSchema } from "@/schemas/aiwl.schema";
import { generateStoredTrainingDay } from "@test/factories/storedTrainingDay";
import { generateStoredDayEntry } from "@test/factories/storedBranch";
import { createStoredDayWorkout } from "./storedDayWorkout";

describe("storedDayWorkout: createStoredDayWorkout", () => {
  it("writes one branches block per stored skill in stored order, not section order", () => {
    const workout = createStoredDayWorkout(
      generateStoredTrainingDay({ CD: ["1"], WU: ["2"], GKS: ["3"] }),
    );

    expect(workout.blocks.map(({ skill }) => skill)).toEqual([
      "CD",
      "WU",
      "GKS",
    ]);
  });

  it("writes the training day ID and the blocks only", () => {
    const workout = createStoredDayWorkout(
      generateStoredTrainingDay({ GKS: ["510", "523"] }, { GKS: 15 }),
    );

    expect(workout).toStrictEqual({
      id: "TRAINING_DAY",
      blocks: [
        {
          kind: "branches",
          skill: "GKS",
          branches: ["510", "523"],
          duration: 900,
        },
      ],
    });
  });

  // Even a stored day that follows the language rules lacks the document header.
  it("never passes the workout document schema", () => {
    const workout = createStoredDayWorkout(
      generateStoredTrainingDay({ GKS: ["510"] }, { GKS: 15 }),
    );

    expect(v.is(TemplateSchema, workout)).toBe(false);
  });

  it("lists the branch IDs of a skill in stored order, repeats included", () => {
    const workout = createStoredDayWorkout(
      generateStoredTrainingDay({ SWR1: ["30", "4", "30", "100"] }),
    );

    expect(workout.blocks[0]).toMatchObject({
      branches: ["30", "4", "30", "100"],
    });
  });

  it("drops entries without a branch ID", () => {
    const workout = createStoredDayWorkout({
      ...generateStoredTrainingDay(),
      skills: {
        SWR1: [
          generateStoredDayEntry("0", [], "10", { branchId: undefined }),
          generateStoredDayEntry("30"),
          generateStoredDayEntry("0", [], "10", { branchId: "" }),
          generateStoredDayEntry("4"),
        ],
      },
    });

    expect(workout.blocks[0]).toMatchObject({ branches: ["30", "4"] });
  });

  // a skill without branches still runs through the rule chain and can name
  // the error of an empty day, as in the old generator
  it("keeps a block with an empty branch list for a skill without branches", () => {
    const workout = createStoredDayWorkout(
      generateStoredTrainingDay({ WU: [], GKS: ["510"] }),
    );

    expect(workout.blocks).toMatchObject([
      { skill: "WU", branches: [] },
      { skill: "GKS", branches: ["510"] },
    ]);
  });

  it("writes no block for a day without skills", () => {
    expect(
      createStoredDayWorkout(generateStoredTrainingDay({}, { BR: 5 })).blocks,
    ).toEqual([]);
  });

  it("writes the minutes of a skill as seconds", () => {
    const workout = createStoredDayWorkout(
      generateStoredTrainingDay(
        { WU: ["1"], SWR1: ["2"], CD: ["3"] },
        { WU: 5, SWR1: 25, CD: 10 },
      ),
    );

    expect(workout.blocks).toMatchObject([
      { duration: 300 },
      { duration: 1500 },
      { duration: 600 },
    ]);
  });

  // The old generator multiplies stored minutes by 60 without rounding, so a
  // stored 0.01 minutes runs 0.6 seconds there too.
  it.each([
    [12.5, 750],
    [0.5, 30],
    [0.01, 0.6],
  ])(
    "keeps %s fractional minutes as %s seconds without rounding",
    (minutes, seconds) => {
      const workout = createStoredDayWorkout(
        generateStoredTrainingDay({ CARDIO_2: ["1"] }, { CARDIO_2: minutes }),
      );

      expect(workout.blocks[0]).toMatchObject({ duration: seconds });
    },
  );

  it.each([
    ["0 minutes", { SK: 0 }],
    ["negative minutes", { SK: -1 }],
    ["missing minutes", {}],
    ["a minutes entry of another skill", { WU: 5 }],
  ])("writes no duration for %s", (_label, minutes) => {
    const workout = createStoredDayWorkout(
      generateStoredTrainingDay({ SK: ["1"] }, minutes),
    );

    expect(workout.blocks[0]).not.toHaveProperty("duration");
  });

  it("reads the minutes of a skill by its own key only", () => {
    const workout = createStoredDayWorkout(
      generateStoredTrainingDay({ constructor: ["1"] }),
    );

    expect(workout.blocks[0]).not.toHaveProperty("duration");
  });
});
