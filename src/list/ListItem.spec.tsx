import { render } from "@/utils/testUtils";
import React from "react";
import { ListItem, ListItemProps } from "./ListItem";

describe("<ListItem />", () => {
  const defaultProps: ListItemProps = {
    title: "My Equipment",
    navPath: "/anamnesis/sport",
    iconName: "fitness",
    iconBackground: "primary",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders component", () => {
    const { toJSON } = render(<ListItem {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with Ionicon when iconName provided", () => {
    const { getByLabelText } = render(<ListItem {...defaultProps} />);
    const icon = getByLabelText("My Equipment icon");
    expect(icon).toBeTruthy();
  });

  it("renders with AwesomeIcon when awesomeIconName provided", () => {
    const { getByLabelText } = render(
      <ListItem
        {...defaultProps}
        iconName={undefined}
        awesomeIconName="id-card"
      />
    );
    const icon = getByLabelText("My Equipment icon");
    expect(icon).toBeTruthy();
  });

  it("renders with image when picPath provided", () => {
    const { getByLabelText } = render(
      <ListItem
        {...defaultProps}
        iconName={undefined}
        picPath={{ uri: "https://example.com/image.png" }}
      />
    );
    const image = getByLabelText("My Equipment image");
    expect(image).toBeTruthy();
  });
});
