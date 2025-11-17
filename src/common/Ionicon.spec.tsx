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
      <Ionicon name="search" size={48} color="#00FF00" />
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree).toMatchSnapshot();
  });
});
