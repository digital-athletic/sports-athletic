import { render } from "@/utils/testUtils";
import React from "react";
import { ListDivider } from "./ListDivider";

describe("<ListDivider />", () => {
  it("renders component", async () => {
    const { toJSON } = await render(<ListDivider />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders multiple dividers independently", async () => {
    const { toJSON } = await render(
      <>
        <ListDivider />
        <ListDivider />
        <ListDivider />
      </>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders without a leading icon offset", async () => {
    const { toJSON } = await render(<ListDivider hasLeadingIcon={false} />);
    expect(toJSON()).toBeTruthy();
  });
});
