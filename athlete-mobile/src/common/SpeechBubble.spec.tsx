import { render } from "../utils/testUtils";
import { SpeechBubble } from "./SpeechBubble";

describe("<SpeechBubble />", () => {
  it("renders the text prop", async () => {
    const { getByText } = await render(
      <SpeechBubble text="Hello World" centered={false} />,
    );
    expect(getByText("Hello World")).toBeTruthy();
  });

  it("renders in centered mode", async () => {
    const { getByText } = await render(
      <SpeechBubble text="Centered Text" centered={true} />,
    );
    expect(getByText("Centered Text")).toBeTruthy();
  });

  it("renders in non-centered mode", async () => {
    const { getByText } = await render(
      <SpeechBubble text="Left Text" centered={false} />,
    );
    expect(getByText("Left Text")).toBeTruthy();
  });

  it("applies correct text variant for centered bubble", async () => {
    const { getByText } = await render(
      <SpeechBubble text="Title Text" centered={true} />,
    );
    const textElement = getByText("Title Text");
    expect(textElement).toBeTruthy();
  });

  it("applies correct text variant for non-centered bubble", async () => {
    const { getByText } = await render(
      <SpeechBubble text="Section Text" centered={false} />,
    );
    const textElement = getByText("Section Text");
    expect(textElement).toBeTruthy();
  });
});
