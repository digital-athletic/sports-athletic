import IconBarbell from "@tabler/icons-react-native/IconBarbell";
import { type ReactElement } from "react";
import { render } from "../utils/testUtils";
import { AppIcon } from "./AppIcon";

// Renders the icon as a named host node, so the test reads the props it gets.
jest.mock("@tabler/icons-react-native/IconBarbell", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconBarbell", props),
}));

const renderIcon = async (element: ReactElement) => {
  const { container } = await render(element);
  return (type: string) => container.queryAll((node) => node.type === type);
};

describe("AppIcon: rendering", () => {
  it("renders a Tabler icon in the given size and color", async () => {
    const findIcons = await renderIcon(
      <AppIcon icon={IconBarbell} size={32} color="#FF0000" />,
    );

    const [icon] = findIcons("IconBarbell");
    expect(icon.props.size).toBe(32);
    expect(icon.props.color).toBe("#FF0000");
  });
});

describe("AppIcon: screen reader behaviour", () => {
  it("passes the accessibility label of a Tabler icon as its title", async () => {
    const findIcons = await renderIcon(
      <AppIcon icon={IconBarbell} accessibilityLabel="Workout Builder" />,
    );

    expect(findIcons("IconBarbell")[0].props.title).toBe("Workout Builder");
  });

  it("hides a decorative Tabler icon", async () => {
    const { getByTestId } = await render(
      <AppIcon icon={IconBarbell} decorative />,
    );

    const wrapper = getByTestId("decorative-icon", {
      includeHiddenElements: true,
    });
    expect(wrapper.props.accessible).toBe(false);
    expect(wrapper.props.importantForAccessibility).toBe("no-hide-descendants");
  });
});
