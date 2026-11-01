import { fireEvent, render } from "../../utils/testUtils";
import { type ChecklistSetSummary } from "./hooks/useTrainingListRows";
import {
  TrainingListItem,
  type TrainingListItemProps,
} from "./TrainingListItem";

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
