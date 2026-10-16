import { fireEvent, render } from "@/utils/testUtils";
import { PrivacyCheckbox } from "./PrivacyCheckbox";

const mount = (
  label: "ANONYMISED_DATA_USE" | "PRIVACY_SIMPLE" | "PRIVACY_FULL",
  onCheck = jest.fn(),
) =>
  render(
    <PrivacyCheckbox
      checked={false}
      onCheck={onCheck}
      onPrivacyPress={jest.fn()}
      onAgbPress={jest.fn()}
      label={label}
    />,
  );

describe("PrivacyCheckbox: screen reader labels", () => {
  it("names the checkbox for anonymised data use", () => {
    const { getByLabelText } = mount("ANONYMISED_DATA_USE");
    expect(
      getByLabelText("Share usage data to improve the app"),
    ).toBeTruthy();
  });

  it("names the checkbox for terms and privacy", () => {
    const { getByLabelText } = mount("PRIVACY_FULL");
    expect(
      getByLabelText("Accept terms and conditions and privacy regulations"),
    ).toBeTruthy();
  });

  it("names the checkbox for privacy only", () => {
    const { getByLabelText } = mount("PRIVACY_SIMPLE");
    expect(getByLabelText("Accept privacy regulations")).toBeTruthy();
  });

  it("reports the checked change when the labelled checkbox is pressed", () => {
    const onCheck = jest.fn();
    const { getByLabelText } = mount("PRIVACY_SIMPLE", onCheck);
    fireEvent.press(getByLabelText("Accept privacy regulations"));
    expect(onCheck).toHaveBeenCalledWith(true);
  });
});
