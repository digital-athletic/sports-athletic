import { render } from "../utils/testUtils";
import { Loading } from "./Loading";

describe("<Loading />", () => {
  it("should not render when show is false", () => {
    const { toJSON } = render(<Loading show={false} text="Loading..." />);
    expect(toJSON()).toBeNull();
  });

  it("should render loading text when show is true", () => {
    const { getByText } = render(<Loading show={true} text="Please wait..." />);
    expect(getByText("Please wait...")).toBeTruthy();
  });

  it("should render cancel button when onClose is provided", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <Loading show={true} text="Loading..." onClose={onClose} />
    );
    expect(getByText("common.cancel")).toBeTruthy();
  });

  it("should not render cancel button when onClose is not provided", () => {
    const { queryByText } = render(<Loading show={true} text="Loading..." />);
    expect(queryByText("common.cancel")).toBeNull();
  });
});
