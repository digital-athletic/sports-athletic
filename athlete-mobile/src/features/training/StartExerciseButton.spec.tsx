import { fireEvent, render } from "../../utils/testUtils";
import {
  StartExerciseButton,
  type StartExerciseButtonProps,
} from "./StartExerciseButton";

// Props of a quiet start button, e.g. generateButtonProps({ isFeatured: true })
// is the filled button of the next exercise.
const generateButtonProps = (
  overrides: Partial<StartExerciseButtonProps> = {},
): StartExerciseButtonProps => ({
  isFeatured: false,
  onPress: jest.fn(),
  testId: "start",
  ...overrides,
});

describe("StartExerciseButton: the filled button", () => {
  it("shows the Start text", async () => {
    const { getByTestId } = await render(
      <StartExerciseButton {...generateButtonProps({ isFeatured: true })} />,
    );

    expect(getByTestId("start")).toHaveTextContent("Start");
  });

  it("is named as the start of the next exercise", async () => {
    const { getByRole } = await render(
      <StartExerciseButton {...generateButtonProps({ isFeatured: true })} />,
    );

    expect(getByRole("button", { name: "Start next exercise" })).toBeTruthy();
  });

  it("shows the saved time in place of the Start text for a paused set", async () => {
    const { getByTestId } = await render(
      <StartExerciseButton
        {...generateButtonProps({ isFeatured: true, resumeSeconds: 42 })}
      />,
    );

    expect(getByTestId("start")).toHaveTextContent("00:42");
  });

  it("is named Continue with the saved time for a paused set", async () => {
    const { getByRole } = await render(
      <StartExerciseButton
        {...generateButtonProps({ isFeatured: true, resumeSeconds: 42 })}
      />,
    );

    expect(
      getByRole("button", { name: "Continue exercise at 00:42" }),
    ).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();

    const { getByTestId } = await render(
      <StartExerciseButton
        {...generateButtonProps({ isFeatured: true, onPress })}
      />,
    );
    await fireEvent.press(getByTestId("start"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("StartExerciseButton: the quiet button", () => {
  it("shows no text", async () => {
    const { getByTestId } = await render(
      <StartExerciseButton {...generateButtonProps()} />,
    );

    expect(getByTestId("start")).toHaveTextContent("");
  });

  it("is named Start exercise", async () => {
    const { getByRole } = await render(
      <StartExerciseButton {...generateButtonProps()} />,
    );

    expect(getByRole("button", { name: "Start exercise" })).toBeTruthy();
  });

  it("shows the saved time of a paused set", async () => {
    const { getByTestId } = await render(
      <StartExerciseButton {...generateButtonProps({ resumeSeconds: 42 })} />,
    );

    expect(getByTestId("start-resume-time")).toHaveTextContent("00:42");
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();

    const { getByTestId } = await render(
      <StartExerciseButton {...generateButtonProps({ onPress })} />,
    );
    await fireEvent.press(getByTestId("start"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
