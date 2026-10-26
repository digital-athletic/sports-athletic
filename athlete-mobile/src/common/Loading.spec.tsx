import { fireEvent, render } from "../utils/testUtils";
import { Loading } from "./Loading";

describe("Loading", () => {
  it("renders nothing while hidden", async () => {
    const { toJSON } = await render(<Loading show={false} text="Loading" />);
    expect(toJSON()).toBeNull();
  });

  it("shows the supplied text when visible", async () => {
    const { getByText } = await render(<Loading show text="Please wait" />);
    expect(getByText("Please wait")).toBeTruthy();
  });

  it("omits the cancel control without an onClose handler", async () => {
    const { queryByText } = await render(<Loading show text="Please wait" />);
    expect(queryByText("Cancel")).toBeNull();
  });

  it("invokes onClose when the cancel control is pressed", async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <Loading show text="Please wait" onClose={onClose} />,
    );
    await fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
