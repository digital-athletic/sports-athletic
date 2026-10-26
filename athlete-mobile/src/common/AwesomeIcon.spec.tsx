import { render } from "../utils/testUtils";
import { AwesomeIcon, type FontAwesomeIconName } from "./AwesomeIcon";

describe("<AwesomeIcon />", () => {
  it("renders with required name prop", async () => {
    const { toJSON } = await render(<AwesomeIcon name="heart" />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it("renders with custom size", async () => {
    const { toJSON } = await render(<AwesomeIcon name="user" size={32} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("renders with custom color", async () => {
    const { toJSON } = await render(
      <AwesomeIcon name="star" color="#FF0000" />,
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("renders with all props", async () => {
    const { toJSON } = await render(
      <AwesomeIcon name="home" size={48} color="#00FF00" />,
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });

  it("accepts valid FontAwesome icon names", async () => {
    const validIcons: FontAwesomeIconName[] = [
      "heart",
      "user",
      "star",
      "home",
      "search",
    ];

    for (const iconName of validIcons) {
      const { toJSON } = await render(<AwesomeIcon name={iconName} />);
      expect(toJSON()).toBeTruthy();
    }
  });
});
