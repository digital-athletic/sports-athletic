import { render } from "../utils/testUtils";
import { AwesomeIcon } from "./AwesomeIcon";

describe("<AwesomeIcon />", () => {
  it("renders with required name prop", () => {
    const { toJSON } = render(<AwesomeIcon name="heart" />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it("renders with custom size", () => {
    const { toJSON } = render(<AwesomeIcon name="user" size={32} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("renders with custom color", () => {
    const { toJSON } = render(<AwesomeIcon name="star" color="#FF0000" />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("renders with all props", () => {
    const { toJSON } = render(
      <AwesomeIcon name="home" size={48} color="#00FF00" />,
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("accepts valid FontAwesome icon names", () => {
    const validIcons = ["heart", "user", "star", "home", "search"];

    validIcons.forEach((iconName) => {
      const { toJSON } = render(<AwesomeIcon name={iconName as any} />);
      expect(toJSON()).toBeTruthy();
    });
  });
});
