import React from "react";
import { fireEvent, render } from "../utils/testUtils";

import { SelectionInputField } from "./SelectionInputField";

describe("SelectionInputField", () => {
  const mockItems = [
    {
      value: "sport1",
      displayName: { en: "Football", de: "Fußball", default: "Football" },
    },
    {
      value: "sport2",
      displayName: {
        en: "Basketball",
        de: "Basketball",
        default: "Basketball",
      },
    },
    {
      value: "sport3",
      displayName: { en: "Tennis", de: "Tennis", default: "Tennis" },
    },
  ];

  it("renders select button with default text when no items selected", () => {
    const { getByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={[]}
        onChange={jest.fn()}
      />,
    );

    expect(getByText("Choose")).toBeTruthy();
  });

  it("renders select button with single selected item text", () => {
    const { getByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={["sport1"]}
        onChange={jest.fn()}
        singleSelection={true}
      />,
    );

    expect(getByText("Football")).toBeTruthy();
  });

  it("renders select button with multi-selection count text (one item)", () => {
    const { getByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={["sport1"]}
        onChange={jest.fn()}
        singleSelection={false}
      />,
    );

    expect(getByText("1 selected")).toBeTruthy();
  });

  it("renders select button with multi-selection count text (multiple items)", () => {
    const { getByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={["sport1", "sport2"]}
        onChange={jest.fn()}
        singleSelection={false}
      />,
    );

    expect(getByText("2 selected")).toBeTruthy();
  });

  it("opens modal when select button is pressed", () => {
    const { getByText, queryByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={[]}
        onChange={jest.fn()}
      />,
    );

    const selectButton = getByText("Choose").parent?.parent;
    fireEvent.press(selectButton);

    // Modal items should be visible
    expect(queryByText("Football")).toBeTruthy();
    expect(queryByText("Basketball")).toBeTruthy();
    expect(queryByText("Tennis")).toBeTruthy();
  });

  it("calls onChange when items are selected in modal", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={[]}
        onChange={onChange}
      />,
    );

    // Open modal
    const selectButton = getByText("Choose").parent?.parent;
    fireEvent.press(selectButton);

    // Select item
    const footballItem = getByText("Football").parent;
    fireEvent.press(footballItem);

    // Confirm
    const okButton = getByText("OK");
    fireEvent.press(okButton);

    expect(onChange).toHaveBeenCalledWith(["sport1"]);
  });

  it("calls onToggle when modal is opened and closed", () => {
    const onToggle = jest.fn();
    const { getByLabelText, getAllByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={[]}
        onChange={jest.fn()}
        onToggle={onToggle}
      />,
    );

    // Open modal
    const chooseButtons = getAllByText("Choose");
    fireEvent.press(chooseButtons[0].parent?.parent);
    expect(onToggle).toHaveBeenCalledWith(true);

    const closeIcon = getByLabelText("Close");
    fireEvent.press(closeIcon);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("handles single selection mode correctly", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={[]}
        onChange={onChange}
        singleSelection={true}
      />,
    );

    // Open modal
    const selectButton = getByText("Choose").parent?.parent;
    fireEvent.press(selectButton);

    // Select football
    const footballItem = getByText("Football").parent;
    fireEvent.press(footballItem);

    // Confirm
    const okButton = getByText("OK");
    fireEvent.press(okButton);

    expect(onChange).toHaveBeenCalledWith(["sport1"]);
  });

  it("handles multi-selection mode correctly", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={[]}
        onChange={onChange}
        singleSelection={false}
      />,
    );

    // Open modal
    const selectButton = getByText("Choose").parent?.parent;
    fireEvent.press(selectButton);

    // Select multiple items
    const footballItem = getByText("Football").parent;
    const basketballItem = getByText("Basketball").parent;
    fireEvent.press(footballItem);
    fireEvent.press(basketballItem);

    // Confirm
    const okButton = getByText("OK");
    fireEvent.press(okButton);

    expect(onChange).toHaveBeenCalledWith(["sport1", "sport2"]);
  });

  it("uses localized display names based on current language", () => {
    const { getByText } = render(
      <SelectionInputField
        items={mockItems}
        selectedItems={[]}
        onChange={jest.fn()}
      />,
    );

    // Open modal
    const selectButton = getByText("Choose").parent?.parent;
    fireEvent.press(selectButton);

    // Should display localized name
    expect(getByText("Football")).toBeTruthy();
  });
});
