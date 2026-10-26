import React from "react";
import { fireEvent, render } from "../utils/testUtils";

import { SelectionModal } from "./SelectionModal";

describe("SelectionModal", () => {
  const mockItems = [
    { value: "item1", displayName: "Item One" },
    { value: "item2", displayName: "Item Two" },
    { value: "item3", displayName: "Item Three" },
  ];

  it("renders modal when visible is true", async () => {
    const { getByText } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={[]}
        visible={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(getByText("Item One")).toBeTruthy();
    expect(getByText("Item Two")).toBeTruthy();
    expect(getByText("Item Three")).toBeTruthy();
  });

  it("exposes the selection as checked state on checkbox rows", async () => {
    const { getByRole } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={["item1"]}
        visible={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(getByRole("checkbox", { checked: true })).toBeTruthy();
  });

  it("renders select text in header", async () => {
    const { getByText } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={[]}
        visible={true}
        selectText="Choose an option"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(getByText("Choose an option")).toBeTruthy();
  });

  it("calls onConfirm with selected items when confirm button is pressed", async () => {
    const onConfirm = jest.fn();
    const { getByText } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={[]}
        visible={true}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        confirmText="OK"
      />,
    );

    const item1 = getByText("Item One").parent!;
    await fireEvent.press(item1);

    const confirmButton = getByText("OK");
    await fireEvent.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith(["item1"]);
  });

  it("handles single selection mode", async () => {
    const onConfirm = jest.fn();
    const { getByText } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={[]}
        visible={true}
        single={true}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        confirmText="OK"
      />,
    );

    const item1 = getByText("Item One").parent!;
    const item2 = getByText("Item Two").parent!;

    await fireEvent.press(item1);
    await fireEvent.press(item2);

    const confirmButton = getByText("OK");
    await fireEvent.press(confirmButton);

    // In single selection mode, only the last selected item should be confirmed
    expect(onConfirm).toHaveBeenCalledWith(["item2"]);
  });

  it("handles multi-selection mode", async () => {
    const onConfirm = jest.fn();
    const { getByText } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={[]}
        visible={true}
        single={false}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        confirmText="OK"
      />,
    );

    const item1 = getByText("Item One").parent!;
    const item2 = getByText("Item Two").parent!;

    await fireEvent.press(item1);
    await fireEvent.press(item2);

    const confirmButton = getByText("OK");
    await fireEvent.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith(["item1", "item2"]);
  });

  it("calls onCancel when cancel button is pressed", async () => {
    const onCancel = jest.fn();
    const { getByLabelText } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={[]}
        visible={true}
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    const closeButton = getByLabelText("Close");
    await fireEvent.press(closeButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("preserves initial selected items on cancel", async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const { getByText, getByLabelText } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={["item1"]}
        visible={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    // Select item2
    const item2 = getByText("Item Two").parent!;
    await fireEvent.press(item2);

    // Cancel
    const closeButton = getByLabelText("Close");
    await fireEvent.press(closeButton);

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders custom confirm text", async () => {
    const { getByText } = await render(
      <SelectionModal
        items={mockItems}
        selectedItems={[]}
        visible={true}
        confirmText="Save"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(getByText("Save")).toBeTruthy();
  });
});
