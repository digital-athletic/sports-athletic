import { fireEvent, render, screen } from "@/utils/testUtils";
import { PainChipSelector } from "./PainChipSelector";

describe("PainChipSelector: chip behavior", () => {
  it("shows the coaching prompt", () => {
    render(<PainChipSelector tags={[]} />);
    expect(
      screen.getByText("Please select the areas that are hurting you"),
    ).toBeTruthy();
  });

  it("renders the 13 curated region chips with translated labels", () => {
    render(<PainChipSelector tags={[]} />);
    expect(screen.getAllByRole("button")).toHaveLength(13);
    expect(screen.getByLabelText("neck")).toBeTruthy();
    expect(screen.getByLabelText("breast")).toBeTruthy();
    expect(screen.getByLabelText("upper back")).toBeTruthy();
  });

  it("adds a tag when an unselected chip is tapped", () => {
    const onChange = jest.fn();
    render(<PainChipSelector tags={[]} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText("neck"));
    expect(onChange).toHaveBeenCalledWith(["NECK"]);
  });

  it("removes a tag when a selected chip is tapped", () => {
    const onChange = jest.fn();
    render(<PainChipSelector tags={["NECK"]} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText("neck"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
