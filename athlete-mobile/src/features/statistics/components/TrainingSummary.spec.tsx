import i18n from "@/i18n";
import { act, render, within } from "@/utils/testUtils";
import { TrainingSummary } from "./TrainingSummary";

describe("TrainingSummary: cards", () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage("en"));
  });

  it("shows each value with its label in its own card", async () => {
    const { getByTestId } = await render(
      <TrainingSummary
        duration="1 h 30 min"
        count="6"
        xp="150"
        weight="1.35 t"
        testID="overall-summary"
      />,
    );

    expect(getByTestId("overall-summary-duration")).toHaveTextContent(
      "1 h 30 min",
    );
    expect(getByTestId("overall-summary-count")).toHaveTextContent("6");
    expect(getByTestId("overall-summary-xp")).toHaveTextContent("150");
    expect(getByTestId("overall-summary-weight")).toHaveTextContent("1.35 t");

    const summary = within(getByTestId("overall-summary"));
    expect(summary.getByText("Duration")).toBeTruthy();
    expect(summary.getByText("Exercises")).toBeTruthy();
    expect(summary.getByText("Points")).toBeTruthy();
    expect(summary.getByText("Moved weight")).toBeTruthy();
  });

  it("shows the german labels in german", async () => {
    await act(() => i18n.changeLanguage("de"));
    const { getByText } = await render(
      <TrainingSummary duration="30 min" count="2" xp="50" weight="450 kg" />,
    );

    expect(getByText("Dauer")).toBeTruthy();
    expect(getByText("Übungen")).toBeTruthy();
    expect(getByText("Punkte")).toBeTruthy();
    expect(getByText("Bewegtes Gewicht")).toBeTruthy();
  });
});
