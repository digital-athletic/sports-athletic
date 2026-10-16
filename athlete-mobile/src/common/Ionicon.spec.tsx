import Ionicons from "@expo/vector-icons/Ionicons";
import { render } from "../utils/testUtils";
import { Ionicon } from "./Ionicon";

describe("<Ionicon />", () => {
  it("renders with required name prop", () => {
    const { toJSON } = render(<Ionicon name="heart" />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it("renders with custom size", () => {
    const { toJSON } = render(<Ionicon name="home" size={32} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("renders with custom color", () => {
    const { toJSON } = render(<Ionicon name="star" color="#FF0000" />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("renders with all props", () => {
    const { toJSON } = render(
      <Ionicon name="search" size={48} color="#00FF00" />,
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });
});

describe("Ionicon: screen reader behaviour", () => {
  it("uses the given accessibility label", () => {
    const { getByLabelText } = render(
      <Ionicon name="close" accessibilityLabel="Schließen" />,
    );
    expect(getByLabelText("Schließen")).toBeTruthy();
  });

  it("falls back to the icon name when no label is given", () => {
    const { getByLabelText } = render(<Ionicon name="close" />);
    expect(getByLabelText("close")).toBeTruthy();
  });

  it("hides a decorative icon from screen readers", () => {
    const { UNSAFE_getByType, queryByLabelText } = render(
      <Ionicon name="close" decorative />,
    );
    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.accessibilityElementsHidden).toBe(true);
    expect(icon.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(icon.props.accessible).toBe(false);
    expect(queryByLabelText("close")).toBeNull();
  });

  it("ignores a label on a decorative icon", () => {
    const { queryByLabelText } = render(
      <Ionicon name="close" accessibilityLabel="Schließen" decorative />,
    );
    expect(queryByLabelText("Schließen")).toBeNull();
  });
});
