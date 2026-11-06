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

const PICTURE_URL = "https://pictures.test/exercise_pictures/squat.jpg";

// A set summary, e.g. generateSetSummary(1, "20 kg", true) is
// { index: 1, label: "20 kg", completed: true }.
const generateSetSummary = (
  index: number,
  label: string | undefined,
  completed = false,
): ChecklistSetSummary => ({ index, label, completed });

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
  repsValue: 0,
  onStart: jest.fn(),
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

  it("shows no placeholder when the exercise has a picture", async () => {
    const { queryByTestId } = await render(
      <TrainingListItem {...generateItemProps({ pictureUrl: PICTURE_URL })} />,
    );

    expect(
      queryByTestId("training-list-row-0-picture-placeholder", {
        includeHiddenElements: true,
      }),
    ).toBeNull();
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
    ["a picture", PICTURE_URL, "training-list-row-0-picture"],
    ["a placeholder", null, "training-list-row-0-picture-placeholder"],
  ])(
    "renders %s before the next arrow of a next row",
    async (_label, pictureUrl, pictureTestId) => {
      const { getByTestId } = await render(
        <TrainingListItem
          {...generateItemProps({ pictureUrl, isNext: true })}
        />,
      );

      const picture = getByTestId(pictureTestId, {
        includeHiddenElements: true,
      });
      const arrow = getByTestId("training-list-row-0-next-arrow");
      const rowChildren = arrow.parent?.children ?? [];
      const pictureAt = rowChildren.indexOf(picture.parent!);
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

    const picture = getByTestId("training-list-row-0-picture", {
      includeHiddenElements: true,
    });
    expect(StyleSheet.flatten(picture.parent?.props.style).opacity).toBe(0.5);
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
  const VALUE_ICONS = ["barbell-outline", "timer-outline", "repeat-outline"];

  // Names of the value icons in the rendered tree, e.g. ["timer-outline"].
  const findValueIconNames = (
    container: Awaited<ReturnType<typeof render>>["container"],
  ) =>
    container
      .queryAll((node) => node.type === "Ionicons")
      .map((icon) => icon.props.name)
      .filter((name) => VALUE_ICONS.includes(name));

  it.each([
    ["weight", "barbell-outline"],
    ["time", "timer-outline"],
    ["reps", "repeat-outline"],
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

  it("shows no value icon when the exercise has a picture", async () => {
    const { container } = await render(
      <TrainingListItem
        {...generateItemProps({ pictureUrl: PICTURE_URL, valueKind: "weight" })}
      />,
    );

    expect(findValueIconNames(container)).toEqual([]);
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
