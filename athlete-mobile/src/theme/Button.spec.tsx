import { Button } from "../theme/Button";
import { render } from "../utils/testUtils";

describe("<Button />", () => {
  it("renders children as text", async () => {
    const { getByText } = await render(<Button>{"Click Me"}</Button>);
    const buttonText = getByText("Click Me");
    expect(buttonText).toBeTruthy();
  });
});
