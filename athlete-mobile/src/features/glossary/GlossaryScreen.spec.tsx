/**
 * Unit tests for GlossaryScreen
 */

import { screen } from "@testing-library/react-native";
import { render } from "@/utils/testUtils";
import { GlossaryScreen } from "./GlossaryScreen";
import { GLOSSARY_TERM_IDS } from "./glossaryTerms";

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
}));

describe("GlossaryScreen: terms", () => {
  it("renders the intro text", () => {
    render(<GlossaryScreen />);

    expect(
      screen.getByText("Here we explain words from the app in plain language."),
    ).toBeTruthy();
  });

  it("renders a term with its explanation", () => {
    render(<GlossaryScreen />);

    expect(screen.getByText("Anamnesis")).toBeTruthy();
    expect(
      screen.getByText(
        "These are the questions at the start. For example, you tell us your sport, your level and whether you have pain.",
      ),
    ).toBeTruthy();
  });

  it("marks each term as a header", () => {
    render(<GlossaryScreen />);

    expect(screen.getByRole("header", { name: "Anamnesis" })).toBeTruthy();
  });

  it("renders the terms as a list", () => {
    render(<GlossaryScreen />);

    expect(
      screen.UNSAFE_getAllByProps({ accessibilityRole: "list" }).length,
    ).toBeGreaterThan(0);
  });

  it("uses unique term ids", () => {
    expect(new Set(GLOSSARY_TERM_IDS).size).toBe(GLOSSARY_TERM_IDS.length);
  });
});
