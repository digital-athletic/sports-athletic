import { render } from "@/utils/testUtils";
import React from "react";
import { ComingSoon } from "./ComingSoon";

describe("<ComingSoon />", () => {
  it("renders component", async () => {
    const { toJSON } = await render(<ComingSoon />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders the coming soon message", async () => {
    const { getByText } = await render(<ComingSoon />);
    const text = getByText("Coming soon");
    expect(text).toBeTruthy();
  });
});
