import { generateStoredTrainingDay } from "../../../../test/factories/storedTrainingDay";
import { generateStoredDayEntry } from "../../../../test/factories/storedBranch";
import { createStoredDayTemplate } from "./storedDayTemplate";

describe("storedDayTemplate: createStoredDayTemplate", () => {
  it("writes one branches block per stored skill in stored order, not section order", () => {
    const template = createStoredDayTemplate(
      generateStoredTrainingDay({ CD: ["1"], WU: ["2"], GKS: ["3"] }),
    );

    expect(template.blocks.map(({ skill }) => skill)).toEqual([
      "CD",
      "WU",
      "GKS",
    ]);
  });

  it("names the template as a training day", () => {
    expect(createStoredDayTemplate(generateStoredTrainingDay())).toMatchObject({
      aiwl: 1,
      id: "TRAINING_DAY",
      name: { en: "Training day" },
    });
  });

  it("lists the branch IDs of a skill in stored order, repeats included", () => {
    const template = createStoredDayTemplate(
      generateStoredTrainingDay({ SWR1: ["30", "4", "30", "100"] }),
    );

    expect(template.blocks[0]).toMatchObject({
      branches: ["30", "4", "30", "100"],
    });
  });

  it("drops entries without a branch ID", () => {
    const template = createStoredDayTemplate({
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

    expect(template.blocks[0]).toMatchObject({ branches: ["30", "4"] });
  });

  // a skill without branches still runs through the rule chain and can name
  // the error of an empty day
  it("keeps a block for a skill without branches", () => {
    const template = createStoredDayTemplate(
      generateStoredTrainingDay({ WU: [], GKS: ["510"] }),
    );

    expect(template.blocks).toMatchObject([
      { skill: "WU", branches: [] },
      { skill: "GKS", branches: ["510"] },
    ]);
  });

  it("writes no block for a day without skills", () => {
    expect(
      createStoredDayTemplate(generateStoredTrainingDay({}, { BR: 5 })).blocks,
    ).toEqual([]);
  });

  it("writes the minutes of a skill as seconds", () => {
    const template = createStoredDayTemplate(
      generateStoredTrainingDay(
        { WU: ["1"], SWR1: ["2"], CD: ["3"] },
        { WU: 5, SWR1: 25, CD: 10 },
      ),
    );

    expect(template.blocks).toMatchObject([
      { duration: 300 },
      { duration: 1500 },
      { duration: 600 },
    ]);
  });

  // Rounding to whole seconds would change a stored 0.01 minutes to 1 second.
  it.each([
    [12.5, 750],
    [0.5, 30],
    [0.01, 0.6],
  ])(
    "keeps %s fractional minutes as %s seconds without rounding",
    (minutes, seconds) => {
      const template = createStoredDayTemplate(
        generateStoredTrainingDay({ CARDIO_2: ["1"] }, { CARDIO_2: minutes }),
      );

      expect(template.blocks[0]).toMatchObject({ duration: seconds });
    },
  );

  it.each([
    ["0 minutes", { SK: 0 }],
    ["negative minutes", { SK: -1 }],
    ["missing minutes", {}],
    ["a minutes entry of another skill", { WU: 5 }],
  ])("writes no duration for %s", (_label, minutes) => {
    const template = createStoredDayTemplate(
      generateStoredTrainingDay({ SK: ["1"] }, minutes),
    );

    expect(template.blocks[0]).not.toHaveProperty("duration");
  });

  it("reads the minutes of a skill by its own key only", () => {
    const template = createStoredDayTemplate(
      generateStoredTrainingDay({ constructor: ["1"] }),
    );

    expect(template.blocks[0]).not.toHaveProperty("duration");
  });

  it("writes only the kind, skill, branches and duration of a block", () => {
    const template = createStoredDayTemplate(
      generateStoredTrainingDay({ GKS: ["510", "523"] }, { GKS: 15 }),
    );

    expect(template.blocks).toStrictEqual([
      {
        kind: "branches",
        skill: "GKS",
        branches: ["510", "523"],
        duration: 900,
      },
    ]);
  });
});
