import { fireEvent, render } from "../utils/testUtils";
import { CheckBox } from "./CheckBox";

const mount = async (checked: boolean, changed = jest.fn()) => ({
  changed,
  ...(await render(<CheckBox checked={checked} changed={changed} />)),
});

describe("CheckBox", () => {
  it("is unchecked when checked is false", async () => {
    const { getByRole } = await mount(false);
    expect(getByRole("checkbox").props.accessibilityState.checked).toBe(false);
  });

  it("is checked when checked is true", async () => {
    const { getByRole } = await mount(true);
    expect(getByRole("checkbox").props.accessibilityState.checked).toBe(true);
  });

  it("requests the inverse value when pressed", async () => {
    const { changed, getByRole } = await mount(false);
    await fireEvent.press(getByRole("checkbox"));
    expect(changed).toHaveBeenCalledWith(true);
  });

  it("requests false when an already checked box is pressed", async () => {
    const { changed, getByRole } = await mount(true);
    await fireEvent.press(getByRole("checkbox"));
    expect(changed).toHaveBeenCalledWith(false);
  });

  it("exposes the given accessibility label", async () => {
    const { getByLabelText } = await render(
      <CheckBox
        checked={false}
        changed={jest.fn()}
        accessibilityLabel="Datenschutz akzeptieren"
      />,
    );
    expect(getByLabelText("Datenschutz akzeptieren")).toBeTruthy();
  });

  it("hides the checkmark from screen readers", async () => {
    const { container } = await mount(true);
    const [icon] = container.queryAll((node) => node.type === "Ionicons");
    expect(icon.props.accessibilityElementsHidden).toBe(true);
  });
});
