import { Alert } from "@/common/Alert";
import { SUPPORT_EMAIL } from "@/constants/AppConstants";
import { Linking } from "react-native";
import { fireEvent, render, waitFor } from "../../utils/testUtils";
import { ListItem } from "./ListItem";

jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: jest.fn() }),
}));

jest.mock("@/constants/AppConstants", () => ({
  ...jest.requireActual("@/constants/AppConstants"),
  SUPPORT_EMAIL: "support@example.com",
}));

describe("ListItem: external link", () => {
  const renderItem = (externalUrl: string) =>
    render(
      <ListItem
        title="Kontakt"
        externalUrl={externalUrl}
        iconName="mail"
        iconBackground="primary"
      />,
    );

  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens the url", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { getByRole } = await renderItem("https://example.com");
    await fireEvent.press(getByRole("link"));
    expect(openURL).toHaveBeenCalledWith("https://example.com");
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("shows an alert when a web link does not open", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no browser"));
    const { getByRole } = await renderItem("https://example.com");
    await fireEvent.press(getByRole("link"));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledTimes(1));
    expect(Alert.alert).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.stringContaining(SUPPORT_EMAIL),
    );
  });

  it("shows the support address when the mail link does not open", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no mail app"));
    const { getByRole } = await renderItem(`mailto:${SUPPORT_EMAIL}`);
    await fireEvent.press(getByRole("link"));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledTimes(1));
    expect(Alert.alert).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(SUPPORT_EMAIL),
    );
  });
});
