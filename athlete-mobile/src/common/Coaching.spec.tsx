import { render } from "../utils/testUtils";
import { Coaching } from "./Coaching";

describe("<Coaching />", () => {
  it("renders with provided text", async () => {
    const { getByText } = await render(<Coaching text="Hello Coach!" />);
    expect(getByText("Hello Coach!")).toBeTruthy();
  });

  it("renders the coach face image", async () => {
    const { getByLabelText } = await render(<Coaching text="Test message" />);
    const image = getByLabelText("Coach face");
    expect(image).toBeTruthy();
  });

  it("passes text to SpeechBubble component", async () => {
    const testText = "Training tip of the day";
    const { getByText } = await render(<Coaching text={testText} />);
    expect(getByText(testText)).toBeTruthy();
  });
});
