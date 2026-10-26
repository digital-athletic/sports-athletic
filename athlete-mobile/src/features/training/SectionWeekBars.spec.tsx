import React from "react";
import { render } from "../../utils/testUtils";
import { SectionWeekBars, SectionWeekBarsProps } from "./SectionWeekBars";

describe("<SectionWeekBars />", () => {
  const defaultProps: SectionWeekBarsProps = {
    sectionWeeksCount: 4,
    startWeek: 1,
    intensity: 3,
    sectionIndex: 0,
    activeWeek: 0,
  };

  it("renders without crashing", async () => {
    const { toJSON } = await render(<SectionWeekBars {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with all required props", async () => {
    const { toJSON } = await render(
      <SectionWeekBars
        sectionWeeksCount={5}
        startWeek={2}
        intensity={4}
        sectionIndex={1}
        activeWeek={1}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles activeWeek 0 (first active week)", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} activeWeek={0} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles activeWeek -1 (before training starts)", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} activeWeek={-1} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles middle active week", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} activeWeek={2} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles single week section", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} sectionWeeksCount={1} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles large week count", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} sectionWeeksCount={12} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles first section (sectionIndex 0)", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} sectionIndex={0} activeWeek={0} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles non-first section (sectionIndex > 0)", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} sectionIndex={2} activeWeek={0} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with low intensity", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} intensity={1} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with high intensity", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} intensity={12} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles different startWeek values", async () => {
    const { toJSON } = await render(
      <SectionWeekBars {...defaultProps} startWeek={10} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("combines all edge case parameters", async () => {
    const { toJSON } = await render(
      <SectionWeekBars
        sectionWeeksCount={1}
        startWeek={20}
        intensity={1}
        sectionIndex={0}
        activeWeek={-1}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
