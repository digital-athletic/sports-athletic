import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../utils/testUtils";
import { type ChecklistSetSummary } from "./hooks/useTrainingListRows";
import {
  TrainingListItem,
  type TrainingListItemProps,
} from "./TrainingListItem";

jest.mock("expo-image", () => ({
  Image: "Image",
}));

// Renders each icon as a host node named after it, so the tests read which
// icon a component draws and the props it gets.
jest.mock("@tabler/icons-react-native/IconWeight", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconWeight", props),
}));
jest.mock("@tabler/icons-react-native/IconStopwatch", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconStopwatch", props),
}));
jest.mock("@tabler/icons-react-native/IconRepeat", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconRepeat", props),
}));

const PICTURE_URL = "https://pictures.test/exercise_pictures/squat.jpg";

// A set summary, e.g. generateSetSummary(1, "20 kg", true) is
// { index: 1, label: "20 kg", completed: true, skipped: false }.
const generateSetSummary = (
  index: number,
  label: string | undefined,
  completed = false,
  skipped = false,
): ChecklistSetSummary => ({ index, label, completed, skipped });

// Props of a pending entry with three weighted sets, e.g. sets "20 kg / 35 kg / 40 kg".
const generateItemProps = (
  overrides: Partial<TrainingListItemProps> = {},
): TrainingListItemProps => ({
  displayName: "Squat",
  pictureUrl: null,
  valueKind: null,
  sets: [
    generateSetSummary(0, "20 kg"),
    generateSetSummary(2, "35 kg"),
    generateSetSummary(4, "40 kg"),
  ],
  isNext: false,
  isTest: false,
  isCompleted: false,
  skippedCount: 0,
  repsValue: 0,
  onStart: jest.fn(),
  onRetake: jest.fn(),
  onShowInfo: jest.fn(),
  testId: "training-list-row-0",
  ...overrides,
});

describe("TrainingListItem: set summary", () => {
  it("joins the set labels with a slash", async () => {
    const { getByText } = await render(
      <TrainingListItem {...generateItemProps()} />,
    );

    expect(getByText("20 kg / 35 kg / 40 kg")).toBeTruthy();
  });

  it("leaves a set without a label out of the summary", async () => {
    const { getByText } = await render(
      <TrainingListItem
        {...generateItemProps({
          sets: [
            generateSetSummary(0, "20 kg"),
            generateSetSummary(2, undefined),
            generateSetSummary(4, "40 kg"),
          ],
        })}
      />,
    );

    expect(getByText("20 kg / 40 kg")).toBeTruthy();
  });

  it("marks a completed set as checked", async () => {
    const { getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({
          sets: [
            generateSetSummary(0, "20 kg", true),
            generateSetSummary(2, "35 kg"),
          ],
        })}
      />,
    );

    expect(
      getByTestId("training-list-row-0-set-0").props.accessibilityState,
    ).toMatchObject({ checked: true });
  });

  it("marks an open set as not checked", async () => {
    const { getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({
          sets: [
            generateSetSummary(0, "20 kg", true),
            generateSetSummary(2, "35 kg"),
          ],
        })}
      />,
    );

    expect(
      getByTestId("training-list-row-0-set-2").props.accessibilityState,
    ).toMatchObject({ checked: false });
  });

  it("marks a skipped set as not checked", async () => {
    const { getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({
          sets: [generateSetSummary(0, "20 kg", true, true)],
        })}
      />,
    );

    expect(
      getByTestId("training-list-row-0-set-0").props.accessibilityState,
    ).toMatchObject({ checked: false });
  });
});

describe("TrainingListItem: skipped exercise", () => {
  // Three sets, all completed; the given positions were skipped.
  const generateSkippedSets = (skippedPositions: number[]) =>
    [0, 2, 4].map((index, position) =>
      generateSetSummary(
        index,
        "20 kg",
        true,
        skippedPositions.includes(position),
      ),
    );

  it("shows Skipped and the retake button instead of the checkmark when every set was skipped", async () => {
    const { getByText, getByLabelText, queryByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({
          sets: generateSkippedSets([0, 1, 2]),
          isCompleted: true,
          skippedCount: 3,
        })}
      />,
    );

    expect(getByText("Skipped")).toBeTruthy();
    expect(getByLabelText("Retake skipped sets")).toBeTruthy();
    expect(queryByTestId("training-list-row-0-checkmark")).toBeNull();
  });

  it("states how many sets were skipped when only some were", async () => {
    const { getByText } = await render(
      <TrainingListItem
        {...generateItemProps({
          sets: generateSkippedSets([1, 2]),
          isCompleted: true,
          skippedCount: 2,
        })}
      />,
    );

    expect(getByText("2 of 3 skipped")).toBeTruthy();
  });

  it("offers Retake and Start while other sets are still open", async () => {
    const onStart = jest.fn();
    const onRetake = jest.fn();
    const { getByText, getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({
          sets: [
            generateSetSummary(0, "20 kg", true, true),
            generateSetSummary(2, "35 kg"),
            generateSetSummary(4, "40 kg"),
          ],
          skippedCount: 1,
          onStart,
          onRetake,
        })}
      />,
    );

    expect(getByText("1 of 3 skipped")).toBeTruthy();
    await fireEvent.press(getByTestId("training-list-row-0-retake"));
    await fireEvent.press(getByTestId("training-list-row-0-start"));

    expect(onRetake).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("calls onRetake when Retake is pressed", async () => {
    const onRetake = jest.fn();
    const { getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({
          sets: generateSkippedSets([0, 1, 2]),
          isCompleted: true,
          skippedCount: 3,
          onRetake,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-row-0-retake"));

    expect(onRetake).toHaveBeenCalledTimes(1);
  });
});

describe("TrainingListItem: entry and controls", () => {
  it("shows the exercise name under the entry test id", async () => {
    const { getByTestId, getByText } = await render(
      <TrainingListItem {...generateItemProps()} />,
    );

    expect(getByTestId("training-list-row-0")).toBeTruthy();
    expect(getByText("Squat")).toBeTruthy();
  });

  it("calls onStart when Start is pressed", async () => {
    const onStart = jest.fn();
    const { getByTestId } = await render(
      <TrainingListItem {...generateItemProps({ onStart })} />,
    );

    await fireEvent.press(getByTestId("training-list-row-0-start"));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe("TrainingListItem: exercise picture", () => {
  it("shows the picture with the exercise picture URL", async () => {
    const { getByTestId } = await render(
      <TrainingListItem {...generateItemProps({ pictureUrl: PICTURE_URL })} />,
    );

    const picture = getByTestId("training-list-row-0-picture", {
      includeHiddenElements: true,
    });
    expect(picture.props.source).toEqual({ uri: PICTURE_URL });
  });

  it("shows a neutral placeholder instead of a picture when the URL is null", async () => {
    const { getByTestId, queryByTestId } = await render(
      <TrainingListItem {...generateItemProps({ pictureUrl: null })} />,
    );

    expect(
      getByTestId("training-list-row-0-picture-placeholder", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      queryByTestId("training-list-row-0-picture", {
        includeHiddenElements: true,
      }),
    ).toBeNull();
  });

  it("draws the picture over the placeholder, which shows while the picture loads", async () => {
    const { getByTestId } = await render(
      <TrainingListItem {...generateItemProps({ pictureUrl: PICTURE_URL })} />,
    );

    const placeholder = getByTestId("training-list-row-0-picture-placeholder", {
      includeHiddenElements: true,
    });
    const picture = getByTestId("training-list-row-0-picture", {
      includeHiddenElements: true,
    });
    expect(picture.parent).toBe(placeholder);
  });

  it("shows the placeholder with the value icon when the picture fails to load", async () => {
    const { getByTestId, queryByTestId, container } = await render(
      <TrainingListItem
        {...generateItemProps({ pictureUrl: PICTURE_URL, valueKind: "time" })}
      />,
    );

    await fireEvent(
      getByTestId("training-list-row-0-picture", {
        includeHiddenElements: true,
      }),
      "error",
    );

    expect(
      queryByTestId("training-list-row-0-picture", {
        includeHiddenElements: true,
      }),
    ).toBeNull();
    expect(
      getByTestId("training-list-row-0-picture-placeholder", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      container.queryAll((node) => node.type === "IconStopwatch"),
    ).toHaveLength(1);
  });

  it("tries a new picture URL again after a failed one", async () => {
    const otherPictureUrl = "https://pictures.test/exercise_pictures/lunge.jpg";
    const { getByTestId, rerender } = await render(
      <TrainingListItem {...generateItemProps({ pictureUrl: PICTURE_URL })} />,
    );
    await fireEvent(
      getByTestId("training-list-row-0-picture", {
        includeHiddenElements: true,
      }),
      "error",
    );

    await rerender(
      <TrainingListItem
        {...generateItemProps({ pictureUrl: otherPictureUrl })}
      />,
    );

    expect(
      getByTestId("training-list-row-0-picture", {
        includeHiddenElements: true,
      }).props.source,
    ).toEqual({ uri: otherPictureUrl });
  });

  it("hides the picture from screen readers", async () => {
    const { getByTestId, queryByTestId } = await render(
      <TrainingListItem {...generateItemProps({ pictureUrl: PICTURE_URL })} />,
    );

    expect(
      getByTestId("training-list-row-0-picture", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(queryByTestId("training-list-row-0-picture")).toBeNull();
  });

  it("hides the placeholder from screen readers", async () => {
    const { getByTestId, queryByTestId } = await render(
      <TrainingListItem {...generateItemProps({ pictureUrl: null })} />,
    );

    expect(
      getByTestId("training-list-row-0-picture-placeholder", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(queryByTestId("training-list-row-0-picture-placeholder")).toBeNull();
  });

  it("opens the exercise information when the picture is pressed", async () => {
    const onShowInfo = jest.fn();
    const { getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({ pictureUrl: PICTURE_URL, onShowInfo })}
      />,
    );

    await fireEvent.press(
      getByTestId("training-list-row-0-picture", {
        includeHiddenElements: true,
      }),
    );

    expect(onShowInfo).toHaveBeenCalledTimes(1);
  });

  it("opens the exercise information when the placeholder is pressed", async () => {
    const onShowInfo = jest.fn();
    const { getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({ pictureUrl: null, onShowInfo })}
      />,
    );

    await fireEvent.press(
      getByTestId("training-list-row-0-picture-placeholder", {
        includeHiddenElements: true,
      }),
    );

    expect(onShowInfo).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a picture", PICTURE_URL],
    ["no picture", null],
  ])(
    "renders the picture slot before the next arrow of a next row with %s",
    async (_label, pictureUrl) => {
      const { getByTestId } = await render(
        <TrainingListItem
          {...generateItemProps({ pictureUrl, isNext: true })}
        />,
      );

      const slot = getByTestId("training-list-row-0-picture-placeholder", {
        includeHiddenElements: true,
      });
      const arrow = getByTestId("training-list-row-0-next-arrow");
      const rowChildren = arrow.parent?.children ?? [];
      const pictureAt = rowChildren.indexOf(slot.parent!);
      const arrowAt = rowChildren.indexOf(arrow);
      expect(pictureAt).toBeGreaterThanOrEqual(0);
      expect(arrowAt).toBeGreaterThan(pictureAt);
    },
  );

  it("dims the picture of a completed row", async () => {
    const { getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({ pictureUrl: PICTURE_URL, isCompleted: true })}
      />,
    );

    const slot = getByTestId("training-list-row-0-picture-placeholder", {
      includeHiddenElements: true,
    });
    expect(StyleSheet.flatten(slot.parent?.props.style).opacity).toBe(0.5);
  });

  it("keeps the next arrow at full opacity on a completed next row", async () => {
    const { getByTestId } = await render(
      <TrainingListItem
        {...generateItemProps({ isNext: true, isCompleted: true })}
      />,
    );

    const arrow = getByTestId("training-list-row-0-next-arrow");
    expect(StyleSheet.flatten(arrow.props.style)?.opacity ?? 1).toBe(1);
  });
});

describe("TrainingListItem: placeholder icon", () => {
  const VALUE_ICONS = ["IconWeight", "IconStopwatch", "IconRepeat"];

  // Names of the value icons in the rendered tree, e.g. ["IconStopwatch"].
  const findValueIconNames = (
    container: Awaited<ReturnType<typeof render>>["container"],
  ) =>
    container
      .queryAll((node) => VALUE_ICONS.includes(String(node.type)))
      .map((icon) => String(icon.type));

  it.each([
    ["weight", "IconWeight"],
    ["time", "IconStopwatch"],
    ["reps", "IconRepeat"],
  ] as const)(
    "shows the %s icon in the placeholder",
    async (valueKind, iconName) => {
      const { container } = await render(
        <TrainingListItem
          {...generateItemProps({ pictureUrl: null, valueKind })}
        />,
      );

      expect(findValueIconNames(container)).toEqual([iconName]);
    },
  );

  it("shows no icon in the placeholder without a value kind", async () => {
    const { container } = await render(
      <TrainingListItem
        {...generateItemProps({ pictureUrl: null, valueKind: null })}
      />,
    );

    expect(findValueIconNames(container)).toEqual([]);
  });

  it("keeps the value icon behind a picture that is still loading", async () => {
    const { container } = await render(
      <TrainingListItem
        {...generateItemProps({ pictureUrl: PICTURE_URL, valueKind: "weight" })}
      />,
    );

    expect(findValueIconNames(container)).toEqual(["IconWeight"]);
  });
});

describe("TrainingListItem: next arrow", () => {
  it("shows the arrow with an accessible name for the next entry", async () => {
    const { getByTestId, getByLabelText } = await render(
      <TrainingListItem {...generateItemProps({ isNext: true })} />,
    );

    expect(getByTestId("training-list-row-0-next-arrow")).toBeTruthy();
    expect(getByLabelText("Next exercise")).toBeTruthy();
  });

  it("removes the arrow once the entry is no longer next", async () => {
    const { getByTestId, queryByTestId, rerender } = await render(
      <TrainingListItem {...generateItemProps({ isNext: true })} />,
    );
    expect(getByTestId("training-list-row-0-next-arrow")).toBeTruthy();

    await rerender(
      <TrainingListItem {...generateItemProps({ isNext: false })} />,
    );

    expect(queryByTestId("training-list-row-0-next-arrow")).toBeNull();
  });
});
