import { render } from "@/utils/testUtils";
import React from "react";
import { ListDivider } from "./ListDivider";

describe("<ListDivider />", () => {
  it("renders component", () => {
    const { toJSON } = render(<ListDivider />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders multiple dividers independently", () => {
    const { toJSON } = render(
      <>
        <ListDivider />
        <ListDivider />
        <ListDivider />
      </>
    );
    expect(toJSON()).toBeTruthy();
  });
});
