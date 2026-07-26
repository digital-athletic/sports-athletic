import { render } from "../utils/testUtils";
import { CenteredLoading } from "./CenteredLoading";

describe("CenteredLoading", () => {
  it("renders the translated loading text", () => {
    const { getByText } = render(<CenteredLoading />);
    expect(getByText("Loading")).toBeTruthy();
  });
});
