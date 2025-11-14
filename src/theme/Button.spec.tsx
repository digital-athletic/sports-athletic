import { Button } from "../theme/Button";
import { render } from "../utils/testUtils";

describe("<Button />", () => {
  it("renders children as text", () => {
    const { getByText } = render(<Button>{"Click Me"}</Button>);
    const buttonText = getByText("Click Me");
    expect(buttonText).toBeTruthy();
  });
});
