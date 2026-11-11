import { fireEvent, render } from "../../utils/testUtils";
import {
  type ChecklistEntry,
  type ChecklistEntryBlock,
} from "./hooks/useTrainingListRows";
import {
  TrainingListRows,
  type TrainingListRowsProps,
} from "./TrainingListRows";

// An entry with one open set at its key, e.g. generateEntry(2, "lunge", "Lunge")
// is { key: 2, exerciseId: "lunge", displayName: "Lunge", sets: [{ index: 2, ... }] }.
const generateEntry = (
  key: number,
  exerciseId: string,
  displayName: string,
  overrides: Partial<ChecklistEntry> = {},
): ChecklistEntry => ({
  key,
  exerciseId,
  displayName,
  pictureUrl: null,
  valueKind: "reps",
  isTest: false,
  sets: [{ index: key, label: "10 reps", completed: false, skipped: false }],
  completed: false,
  skippedCount: 0,
  firstOpenSetIndex: key,
  ...overrides,
});

// A block of entries, e.g. generateBlock([squatEntry, lungeEntry]) is a
// warm-up superset block keyed by its first entry whose next entry is the squat.
const generateBlock = (
  entries: ChecklistEntry[],
  skill = "WU",
): ChecklistEntryBlock => ({
  key: entries[0].key,
  skill,
  isSuperset: entries.length > 1,
  entries,
});

// Props of the list body, e.g. generateRowsProps({ blocks }) renders those blocks.
const generateRowsProps = (
  overrides: Partial<TrainingListRowsProps> = {},
): TrainingListRowsProps => ({
  blocks: [],
  exerciseList: [],
  repsDraft: {},
  featuredEntryKey: null,
  resumeSecondsOf: () => undefined,
  onStart: jest.fn(),
  onRetake: jest.fn(),
  onShowInfo: jest.fn(),
  ...overrides,
});

describe("TrainingListRows: entries", () => {
  it("renders one row per exercise entry keyed by its first set", async () => {
    const blocks = [
      generateBlock([generateEntry(0, "squat", "Squat")]),
      generateBlock([generateEntry(4, "plank", "Plank")]),
    ];

    const { getByTestId, getByText } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByTestId("training-list-row-0")).toBeTruthy();
    expect(getByTestId("training-list-row-4")).toBeTruthy();
    expect(getByText("Squat")).toBeTruthy();
    expect(getByText("Plank")).toBeTruthy();
  });

  it("shows the set summary of an entry joined with slashes", async () => {
    const blocks = [
      generateBlock([
        generateEntry(0, "squat", "Squat", {
          sets: [
            { index: 0, label: "20 kg", completed: false, skipped: false },
            { index: 2, label: "22.5 kg", completed: false, skipped: false },
          ],
        }),
      ]),
    ];

    const { getByText } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByText("20 kg / 22.5 kg")).toBeTruthy();
  });

  it("calls onStart with the entry when Start is pressed", async () => {
    const onStart = jest.fn();
    const squat = generateEntry(0, "squat", "Squat");
    const blocks = [generateBlock([squat])];

    const { getByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks, onStart })} />,
    );
    await fireEvent.press(getByTestId("training-list-row-0-start"));

    expect(onStart).toHaveBeenCalledWith(squat);
  });

  it("shows the saved time of the first open set of an entry", async () => {
    const blocks = [
      generateBlock([generateEntry(0, "squat", "Squat")]),
      generateBlock([generateEntry(4, "plank", "Plank")]),
    ];

    const { getByTestId, queryByTestId } = await render(
      <TrainingListRows
        {...generateRowsProps({
          blocks,
          resumeSecondsOf: (setIndex) => (setIndex === 4 ? 42 : undefined),
        })}
      />,
    );

    expect(
      getByTestId("training-list-row-4-start-resume-time"),
    ).toHaveTextContent("00:42");
    expect(queryByTestId("training-list-row-0-start-resume-time")).toBeNull();
  });

  it("calls onRetake with the entry when Retake is pressed", async () => {
    const onRetake = jest.fn();
    const squat = generateEntry(0, "squat", "Squat", {
      sets: [{ index: 0, label: "10 reps", completed: true, skipped: true }],
      completed: true,
      skippedCount: 1,
      firstOpenSetIndex: null,
    });
    const blocks = [generateBlock([squat])];

    const { getByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks, onRetake })} />,
    );
    await fireEvent.press(getByTestId("training-list-row-0-retake"));

    expect(onRetake).toHaveBeenCalledWith(squat);
  });

  it("opens the exercise information with the exercise id of the entry", async () => {
    const onShowInfo = jest.fn();
    const blocks = [generateBlock([generateEntry(0, "squat", "Squat")])];

    const { getByText } = await render(
      <TrainingListRows {...generateRowsProps({ blocks, onShowInfo })} />,
    );
    await fireEvent.press(getByText("Squat"));

    expect(onShowInfo).toHaveBeenCalledWith("squat");
  });
});

describe("TrainingListRows: skill titles", () => {
  it("shows the skill name above the first block of each skill", async () => {
    const blocks = [
      generateBlock([generateEntry(0, "jog", "Jog")], "WU"),
      generateBlock([generateEntry(2, "hop", "Hop")], "WU"),
      generateBlock([generateEntry(4, "stretch", "Stretch")], "MOB"),
    ];

    const { getByTestId, queryByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByTestId("training-list-skill-0")).toHaveTextContent("Warm-Up");
    expect(queryByTestId("training-list-skill-2")).toBeNull();
    expect(getByTestId("training-list-skill-4")).toHaveTextContent("Mobility");
  });

  it("shows the skill name again when the skill returns after another one", async () => {
    const blocks = [
      generateBlock([generateEntry(0, "jog", "Jog")], "WU"),
      generateBlock([generateEntry(2, "stretch", "Stretch")], "MOB"),
      generateBlock([generateEntry(4, "hop", "Hop")], "WU"),
    ];

    const { getAllByText } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getAllByText("Warm-Up")).toHaveLength(2);
  });

  it("shows the skill name above a superset", async () => {
    const blocks = [
      generateBlock(
        [generateEntry(0, "plank", "Plank"), generateEntry(2, "bird", "Bird")],
        "GKS",
      ),
    ];

    const { getByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByTestId("training-list-skill-0")).toHaveTextContent(
      "Full body stability",
    );
  });

  it("shows the skill code when the skill has no translation", async () => {
    const blocks = [
      generateBlock([generateEntry(0, "jog", "Jog")], "CUSTOM_SKILL"),
    ];

    const { getByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByTestId("training-list-skill-0")).toHaveTextContent(
      "CUSTOM_SKILL",
    );
  });
});

describe("TrainingListRows: superset blocks", () => {
  const supersetBlocks = [
    generateBlock([
      generateEntry(0, "squat", "Squat"),
      generateEntry(2, "lunge", "Lunge"),
    ]),
  ];

  it("frames a superset block under its first entry key", async () => {
    const { getByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks: supersetBlocks })} />,
    );

    expect(getByTestId("training-list-superset-0")).toBeTruthy();
  });

  it("puts both exercises of the superset inside the frame", async () => {
    const { getByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks: supersetBlocks })} />,
    );

    const frame = getByTestId("training-list-superset-0");

    expect(frame).toContainElement(getByTestId("training-list-row-0"));
    expect(frame).toContainElement(getByTestId("training-list-row-2"));
  });

  it("frames no block that holds a single exercise", async () => {
    const blocks = [generateBlock([generateEntry(0, "squat", "Squat")])];

    const { getByTestId, queryByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByTestId("training-list-row-0")).toBeTruthy();
    expect(queryByTestId("training-list-superset-0")).toBeNull();
  });
});

describe("TrainingListRows: the filled start button", () => {
  const blocks = [
    generateBlock([generateEntry(0, "squat", "Squat")]),
    generateBlock([
      generateEntry(2, "press", "Press"),
      generateEntry(4, "lunge", "Lunge"),
    ]),
  ];

  it("shows the Start text only on the featured exercise", async () => {
    const { getByTestId, getAllByText } = await render(
      <TrainingListRows
        {...generateRowsProps({ blocks, featuredEntryKey: 4 })}
      />,
    );

    expect(getAllByText("Start")).toHaveLength(1);
    expect(getByTestId("training-list-row-4-start")).toHaveTextContent("Start");
  });

  it("names the featured button as the start of the next exercise", async () => {
    const { getByTestId } = await render(
      <TrainingListRows
        {...generateRowsProps({ blocks, featuredEntryKey: 4 })}
      />,
    );

    expect(getByTestId("training-list-row-4-start")).toHaveAccessibleName(
      "Start next exercise",
    );
    expect(getByTestId("training-list-row-0-start")).toHaveAccessibleName(
      "Start exercise",
    );
  });

  it("shows no Start text when no exercise is featured", async () => {
    const { queryByText } = await render(
      <TrainingListRows
        {...generateRowsProps({ blocks, featuredEntryKey: null })}
      />,
    );

    expect(queryByText("Start")).toBeNull();
  });

  it("still starts an exercise from its quiet button", async () => {
    const onStart = jest.fn();

    const { getByTestId } = await render(
      <TrainingListRows
        {...generateRowsProps({ blocks, featuredEntryKey: 4, onStart })}
      />,
    );
    await fireEvent.press(getByTestId("training-list-row-2-start"));

    expect(onStart).toHaveBeenCalledWith(blocks[1].entries[0]);
  });
});
