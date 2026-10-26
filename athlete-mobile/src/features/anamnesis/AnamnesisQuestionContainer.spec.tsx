import { Text } from "@/theme/Text";
import { render } from "@/utils/testUtils";
import React from "react";
import { AnamnesisQuestionContainer } from "./AnamnesisQuestionContainer";

describe("<AnamnesisQuestionContainer />", () => {
  const mockTitle = {
    default: "What is your sport?",
    de: "Was ist dein Sport?",
    en: "What is your sport?",
  };

  const mockDescription = {
    default: "Please select your primary sport",
    de: "Bitte wähle deinen primären Sport",
    en: "Please select your primary sport",
  };

  it("renders the title in the current language", async () => {
    const { getByText } = await render(
      <AnamnesisQuestionContainer title={mockTitle} />,
    );
    expect(getByText("What is your sport?")).toBeTruthy();
  });

  it("renders the description when provided", async () => {
    const { getByText } = await render(
      <AnamnesisQuestionContainer
        title={mockTitle}
        description={mockDescription}
      />,
    );
    expect(getByText("Please select your primary sport")).toBeTruthy();
  });

  it("does not render description when not provided", async () => {
    const { queryByText } = await render(
      <AnamnesisQuestionContainer title={mockTitle} />,
    );
    expect(queryByText("Please select your primary sport")).toBeFalsy();
  });

  it("renders children correctly", async () => {
    const { getByText } = await render(
      <AnamnesisQuestionContainer title={mockTitle}>
        <Text>Test Child Content</Text>
      </AnamnesisQuestionContainer>,
    );
    expect(getByText("Test Child Content")).toBeTruthy();
  });

  it("renders title and children together", async () => {
    const { getByText } = await render(
      <AnamnesisQuestionContainer title={mockTitle}>
        <Text>Input Field</Text>
      </AnamnesisQuestionContainer>,
    );
    expect(getByText("What is your sport?")).toBeTruthy();
    expect(getByText("Input Field")).toBeTruthy();
  });

  it("renders title, description, and children together", async () => {
    const { getByText } = await render(
      <AnamnesisQuestionContainer
        title={mockTitle}
        description={mockDescription}
      >
        <Text>Form Input</Text>
      </AnamnesisQuestionContainer>,
    );
    expect(getByText("What is your sport?")).toBeTruthy();
    expect(getByText("Please select your primary sport")).toBeTruthy();
    expect(getByText("Form Input")).toBeTruthy();
  });

  it("falls back to default language when current language not available", async () => {
    const titleWithoutCurrent = {
      default: "Default Title",
    };
    const { getByText } = await render(
      <AnamnesisQuestionContainer title={titleWithoutCurrent} />,
    );
    expect(getByText("Default Title")).toBeTruthy();
  });

  it("handles empty children gracefully", async () => {
    const { getByText } = await render(
      <AnamnesisQuestionContainer title={mockTitle}>
        {undefined}
      </AnamnesisQuestionContainer>,
    );
    expect(getByText("What is your sport?")).toBeTruthy();
  });

  it("handles multiple children", async () => {
    const { getByText } = await render(
      <AnamnesisQuestionContainer title={mockTitle}>
        <Text>First Child</Text>
        <Text>Second Child</Text>
        <Text>Third Child</Text>
      </AnamnesisQuestionContainer>,
    );
    expect(getByText("First Child")).toBeTruthy();
    expect(getByText("Second Child")).toBeTruthy();
    expect(getByText("Third Child")).toBeTruthy();
  });

  it("renders with only default locale in title", async () => {
    const minimalTitle = {
      default: "Required Question",
    };
    const { getByText } = await render(
      <AnamnesisQuestionContainer title={minimalTitle} />,
    );
    expect(getByText("Required Question")).toBeTruthy();
  });

  it("renders with only default locale in description", async () => {
    const minimalDescription = {
      default: "Supporting text",
    };
    const { getByText } = await render(
      <AnamnesisQuestionContainer
        title={mockTitle}
        description={minimalDescription}
      />,
    );
    expect(getByText("Supporting text")).toBeTruthy();
  });
});
