import { render } from "@testing-library/react-native";
import { PrimaryButton } from "./PrimaryButton";

describe("<PrimaryButton />", () => {
  it("renders children as text", () => {
    const { getByText } = render(<PrimaryButton>Click Me</PrimaryButton>);
    const buttonText = getByText("Click Me");
    expect(buttonText).toBeTruthy();
  });
});
