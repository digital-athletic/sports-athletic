import React from "react";
import { fireEvent, render } from "../utils/testUtils";

import { SelectionModal } from "./SelectionModal";

describe("SelectionModal", () => {
  const mockItems = [
    { value: "item1", displayName: "Item One" },
    { value: "item2", displayName: "Item Two" },
    { value: "item3", displayName: "Item Three" },
  ];

  it("renders modal when visible is true", () => {
    const { getByText } = render(
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

  it("renders select text in header", () => {
    const { getByText } = render(
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

  it("calls onConfirm with selected items when confirm button is pressed", () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
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
    fireEvent.press(item1);

    const confirmButton = getByText("OK");
    fireEvent.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith(["item1"]);
  });

  it("handles single selection mode", () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
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

    fireEvent.press(item1);
    fireEvent.press(item2);

    const confirmButton = getByText("OK");
    fireEvent.press(confirmButton);

    // In single selection mode, only the last selected item should be confirmed
    expect(onConfirm).toHaveBeenCalledWith(["item2"]);
  });

  it("handles multi-selection mode", () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
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

    fireEvent.press(item1);
    fireEvent.press(item2);

    const confirmButton = getByText("OK");
    fireEvent.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith(["item1", "item2"]);
  });

  it("calls onCancel when cancel button is pressed", () => {
    const onCancel = jest.fn();
    const { getByLabelText } = render(
      <SelectionModal
        items={mockItems}
        selectedItems={[]}
        visible={true}
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    const closeButton = getByLabelText("close");
    fireEvent.press(closeButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("preserves initial selected items on cancel", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const { getByText, getByLabelText } = render(
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
    fireEvent.press(item2);

    // Cancel
    const closeButton = getByLabelText("close");
    fireEvent.press(closeButton);

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders custom confirm text", () => {
    const { getByText } = render(
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
