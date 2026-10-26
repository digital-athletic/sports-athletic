import { render } from "../utils/testUtils";
import { Ionicon } from "./Ionicon";

describe("<Ionicon />", () => {
  it("renders with required name prop", async () => {
    const { toJSON } = await render(<Ionicon name="heart" />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it("renders with custom size", async () => {
    const { toJSON } = await render(<Ionicon name="home" size={32} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("renders with custom color", async () => {
    const { toJSON } = await render(<Ionicon name="star" color="#FF0000" />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("renders with all props", async () => {
    const { toJSON } = await render(
      <Ionicon name="search" size={48} color="#00FF00" />,
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });
});

describe("Ionicon: screen reader behaviour", () => {
  it("uses the given accessibility label", async () => {
    const { getByLabelText } = await render(
      <Ionicon name="close" accessibilityLabel="Schließen" />,
    );
    expect(getByLabelText("Schließen")).toBeTruthy();
  });

  it("falls back to the icon name when no label is given", async () => {
    const { getByLabelText } = await render(<Ionicon name="close" />);
    expect(getByLabelText("close")).toBeTruthy();
  });

  it("hides a decorative icon from screen readers", async () => {
    const { container, queryByLabelText } = await render(
      <Ionicon name="close" decorative />,
    );
    const [icon] = container.queryAll((node) => node.type === "Ionicons");
    expect(icon.props.accessibilityElementsHidden).toBe(true);
    expect(icon.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(icon.props.accessible).toBe(false);
    expect(queryByLabelText("close")).toBeNull();
  });

  it("ignores a label on a decorative icon", async () => {
    const { queryByLabelText } = await render(
      <Ionicon name="close" accessibilityLabel="Schließen" decorative />,
    );
    expect(queryByLabelText("Schließen")).toBeNull();
  });
});
