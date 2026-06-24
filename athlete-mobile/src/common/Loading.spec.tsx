import { fireEvent, render } from "../utils/testUtils";
import { Loading } from "./Loading";

describe("Loading", () => {
  it("renders nothing while hidden", () => {
    const { toJSON } = render(<Loading show={false} text="Loading" />);
    expect(toJSON()).toBeNull();
  });

  it("shows the supplied text when visible", () => {
    const { getByText } = render(<Loading show text="Please wait" />);
    expect(getByText("Please wait")).toBeTruthy();
  });

  it("omits the cancel control without an onClose handler", () => {
    const { queryByText } = render(<Loading show text="Please wait" />);
    expect(queryByText("Cancel")).toBeNull();
  });

  it("invokes onClose when the cancel control is pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <Loading show text="Please wait" onClose={onClose} />,
    );
    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
