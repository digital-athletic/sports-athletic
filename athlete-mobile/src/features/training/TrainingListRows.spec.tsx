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
  sets: [{ index: key, label: "10 reps", completed: false }],
  completed: false,
  firstOpenSetIndex: key,
  ...overrides,
});

// A block of entries, e.g. generateBlock([squatEntry, lungeEntry], 0) is a
// warm-up superset block keyed by its first entry whose next entry is the squat.
const generateBlock = (
  entries: ChecklistEntry[],
  nextEntryKey: number | null,
  skill = "WU",
): ChecklistEntryBlock => ({
  key: entries[0].key,
  skill,
  isSuperset: entries.length > 1,
  entries,
  nextEntryKey,
});

// Props of the list body, e.g. generateRowsProps({ blocks }) renders those blocks.
const generateRowsProps = (
  overrides: Partial<TrainingListRowsProps> = {},
): TrainingListRowsProps => ({
  blocks: [],
  exerciseList: [],
  repsDraft: {},
  resumeSecondsOf: () => undefined,
  onStart: jest.fn(),
  onShowInfo: jest.fn(),
  ...overrides,
});

describe("TrainingListRows: entries", () => {
  it("renders one row per exercise entry keyed by its first set", async () => {
    const blocks = [
      generateBlock([generateEntry(0, "squat", "Squat")], 0),
      generateBlock([generateEntry(4, "plank", "Plank")], 4),
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
      generateBlock(
        [
          generateEntry(0, "squat", "Squat", {
            sets: [
              { index: 0, label: "20 kg", completed: false },
              { index: 2, label: "22.5 kg", completed: false },
            ],
          }),
        ],
        0,
      ),
    ];

    const { getByText } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByText("20 kg / 22.5 kg")).toBeTruthy();
  });

  it("calls onStart with the entry when Start is pressed", async () => {
    const onStart = jest.fn();
    const squat = generateEntry(0, "squat", "Squat");
    const blocks = [generateBlock([squat], 0)];

    const { getByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks, onStart })} />,
    );
    await fireEvent.press(getByTestId("training-list-row-0-start"));

    expect(onStart).toHaveBeenCalledWith(squat);
  });

  it("shows the saved time of the first open set of an entry", async () => {
    const blocks = [
      generateBlock([generateEntry(0, "squat", "Squat")], 0),
      generateBlock([generateEntry(4, "plank", "Plank")], 4),
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

  it("opens the exercise information with the exercise id of the entry", async () => {
    const onShowInfo = jest.fn();
    const blocks = [generateBlock([generateEntry(0, "squat", "Squat")], 0)];

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
      generateBlock([generateEntry(0, "jog", "Jog")], 0, "WU"),
      generateBlock([generateEntry(2, "hop", "Hop")], 2, "WU"),
      generateBlock([generateEntry(4, "stretch", "Stretch")], 4, "MOB"),
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
      generateBlock([generateEntry(0, "jog", "Jog")], 0, "WU"),
      generateBlock([generateEntry(2, "stretch", "Stretch")], 2, "MOB"),
      generateBlock([generateEntry(4, "hop", "Hop")], 4, "WU"),
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
        0,
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
      generateBlock([generateEntry(0, "jog", "Jog")], 0, "CUSTOM_SKILL"),
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
  const generateSupersetBlocks = (nextEntryKey: number | null) => [
    generateBlock(
      [generateEntry(0, "squat", "Squat"), generateEntry(2, "lunge", "Lunge")],
      nextEntryKey,
    ),
  ];

  it("frames a superset block under its first entry key", async () => {
    const { getByTestId } = await render(
      <TrainingListRows
        {...generateRowsProps({ blocks: generateSupersetBlocks(0) })}
      />,
    );

    expect(getByTestId("training-list-superset-0")).toBeTruthy();
  });

  it("puts both exercises of the superset inside the frame", async () => {
    const { getByTestId } = await render(
      <TrainingListRows
        {...generateRowsProps({ blocks: generateSupersetBlocks(0) })}
      />,
    );

    const frame = getByTestId("training-list-superset-0");

    expect(frame).toContainElement(getByTestId("training-list-row-0"));
    expect(frame).toContainElement(getByTestId("training-list-row-2"));
  });

  it("frames no block that holds a single exercise", async () => {
    const blocks = [generateBlock([generateEntry(0, "squat", "Squat")], 0)];

    const { getByTestId, queryByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByTestId("training-list-row-0")).toBeTruthy();
    expect(queryByTestId("training-list-superset-0")).toBeNull();
  });

  it("shows the arrow only on the entry that comes next", async () => {
    const { getByTestId, queryByTestId } = await render(
      <TrainingListRows
        {...generateRowsProps({ blocks: generateSupersetBlocks(2) })}
      />,
    );

    expect(getByTestId("training-list-row-2-next-arrow")).toBeTruthy();
    expect(queryByTestId("training-list-row-0-next-arrow")).toBeNull();
  });

  it("shows no arrow when the superset has no next entry", async () => {
    const { getByTestId, queryByTestId } = await render(
      <TrainingListRows
        {...generateRowsProps({ blocks: generateSupersetBlocks(null) })}
      />,
    );

    expect(getByTestId("training-list-superset-0")).toBeTruthy();
    expect(queryByTestId("training-list-row-0-next-arrow")).toBeNull();
    expect(queryByTestId("training-list-row-2-next-arrow")).toBeNull();
  });

  it("shows no arrow for an exercise outside a superset", async () => {
    const blocks = [generateBlock([generateEntry(0, "squat", "Squat")], 0)];

    const { getByTestId, queryByTestId } = await render(
      <TrainingListRows {...generateRowsProps({ blocks })} />,
    );

    expect(getByTestId("training-list-row-0")).toBeTruthy();
    expect(queryByTestId("training-list-row-0-next-arrow")).toBeNull();
  });
});
