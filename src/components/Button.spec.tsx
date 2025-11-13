import { render } from "../utils/testUtils";
import { Button } from "./Button";

describe("<Button />", () => {
  it("renders children as text", () => {
    const { getByText } = render(<Button>{"Click Me"}</Button>);
    const buttonText = getByText("Click Me");
    expect(buttonText).toBeTruthy();
  });
});
