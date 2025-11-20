import { render } from "@/utils/testUtils";
import React from "react";
import { Hint } from "./Hint";

describe("<Hint />", () => {
  const hintMessage = "This is a hint message";
  const warningMessage = "This is a warning message";

  it("renders component", () => {
    const { toJSON } = render(<Hint type="HINT" message={hintMessage} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders HINT type with correct message", () => {
    const { getByText } = render(<Hint type="HINT" message={hintMessage} />);
    expect(getByText(hintMessage)).toBeTruthy();
  });

  it("renders WARNING type with correct message", () => {
    const { getByText } = render(
      <Hint type="WARNING" message={warningMessage} />
    );
    expect(getByText(warningMessage)).toBeTruthy();
  });

  it("displays info icon for HINT type", () => {
    const { getByLabelText } = render(
      <Hint type="HINT" message={hintMessage} />
    );
    expect(getByLabelText("Hint icon")).toBeTruthy();
  });

  it("displays warning icon for WARNING type", () => {
    const { getByLabelText } = render(
      <Hint type="WARNING" message={warningMessage} />
    );
    expect(getByLabelText("Warning icon")).toBeTruthy();
  });
});
