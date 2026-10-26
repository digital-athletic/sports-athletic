import { fireEvent, render, screen } from "@/utils/testUtils";
import { PainChipSelector } from "./PainChipSelector";

describe("PainChipSelector: chip behavior", () => {
  it("shows the coaching prompt", async () => {
    await render(<PainChipSelector tags={[]} />);
    expect(screen.getByText("Select the areas that hurt")).toBeTruthy();
  });

  it("renders the 12 joint chips from shoulders down to ankles", async () => {
    await render(<PainChipSelector tags={[]} />);
    const chips = screen.getAllByRole("button");
    expect(chips).toHaveLength(12);
    expect(chips[0]).toHaveAccessibleName("left shoulder");
    expect(chips[11]).toHaveAccessibleName("right ankle");
  });

  it("does not offer muscle regions", async () => {
    await render(<PainChipSelector tags={[]} />);
    expect(screen.queryByLabelText("neck")).toBeNull();
    expect(screen.queryByLabelText("buttock")).toBeNull();
  });

  it("adds the lateralized value when an unselected chip is tapped", async () => {
    const onChange = jest.fn();
    await render(<PainChipSelector tags={[]} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText("left knee"));
    expect(onChange).toHaveBeenCalledWith(["KNEE_LEFT"]);
  });

  it("removes the value when a selected chip is tapped", async () => {
    const onChange = jest.fn();
    await render(<PainChipSelector tags={["KNEE_LEFT"]} onChange={onChange} />);
    expect(screen.getByLabelText("left knee")).toBeSelected();
    fireEvent.press(screen.getByLabelText("left knee"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe("PainChipSelector: hip chip", () => {
  it("stores both hip sides behind one chip", async () => {
    const onChange = jest.fn();
    await render(<PainChipSelector tags={["SPINE"]} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText("hip"));
    expect(onChange).toHaveBeenCalledWith(["SPINE", "HIP_LEFT", "HIP_RIGHT"]);
  });

  it("shows the chip selected only when both sides are stored", async () => {
    await render(<PainChipSelector tags={["HIP_LEFT"]} onChange={jest.fn()} />);
    expect(screen.getByLabelText("hip")).not.toBeSelected();
  });

  it("removes both hip sides when the selected chip is tapped", async () => {
    const onChange = jest.fn();
    await render(
      <PainChipSelector
        tags={["HIP_LEFT", "HIP_RIGHT", "SPINE"]}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByLabelText("hip"));
    expect(onChange).toHaveBeenCalledWith(["SPINE"]);
  });
});
