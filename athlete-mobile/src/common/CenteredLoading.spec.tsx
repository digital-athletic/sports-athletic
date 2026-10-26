import { render } from "../utils/testUtils";
import { CenteredLoading } from "./CenteredLoading";

describe("CenteredLoading", () => {
  it("renders the translated loading text", async () => {
    const { getByText } = await render(<CenteredLoading />);
    expect(getByText("Loading")).toBeTruthy();
  });
});
