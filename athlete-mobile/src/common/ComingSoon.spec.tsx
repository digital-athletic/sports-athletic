import { render } from "@/utils/testUtils";
import React from "react";
import { ComingSoon } from "./ComingSoon";

describe("<ComingSoon />", () => {
  it("renders component", () => {
    const { toJSON } = render(<ComingSoon />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders the coming soon message", () => {
    const { getByText } = render(<ComingSoon />);
    const text = getByText("Coming soon");
    expect(text).toBeTruthy();
  });
});
