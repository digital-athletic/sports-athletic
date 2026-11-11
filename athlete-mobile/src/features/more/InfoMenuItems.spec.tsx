import i18n from "@/i18n";
import { Linking } from "react-native";
import { fireEvent, render } from "../../utils/testUtils";
import { InfoMenuItems } from "./InfoMenuItems";

jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: jest.fn() }),
}));

describe("InfoMenuItems: online form links", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_LINK_CONSENT_U16;
    delete process.env.EXPO_PUBLIC_LINK_FEEDBACK_REPORT;
    delete process.env.EXPO_PUBLIC_LINK_SURVEY;
    jest.restoreAllMocks();
  });

  it("lists the three form links first when their variables are set", async () => {
    process.env.EXPO_PUBLIC_LINK_CONSENT_U16 = "https://example.com/consent";
    process.env.EXPO_PUBLIC_LINK_FEEDBACK_REPORT =
      "https://example.com/feedback";
    process.env.EXPO_PUBLIC_LINK_SURVEY = "https://example.com/survey";

    const { getAllByRole } = await render(<InfoMenuItems />);

    const links = getAllByRole("link");
    expect(links[0]).toHaveTextContent(i18n.t("more.consentU16"));
    expect(links[1]).toHaveTextContent(i18n.t("more.feedbackReport"));
    expect(links[2]).toHaveTextContent(i18n.t("more.survey"));
  });

  it("opens the survey in the browser", async () => {
    process.env.EXPO_PUBLIC_LINK_SURVEY = "https://example.com/survey";
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { getByText } = await render(<InfoMenuItems />);
    await fireEvent.press(getByText(i18n.t("more.survey")));

    expect(openURL).toHaveBeenCalledWith("https://example.com/survey");
  });

  it("hides the form links when their variables are unset", async () => {
    const { queryByText } = await render(<InfoMenuItems />);

    expect(queryByText(i18n.t("more.consentU16"))).toBeNull();
    expect(queryByText(i18n.t("more.feedbackReport"))).toBeNull();
    expect(queryByText(i18n.t("more.survey"))).toBeNull();
  });

  it("hides a form link whose variable is empty", async () => {
    process.env.EXPO_PUBLIC_LINK_SURVEY = "";

    const { queryByText } = await render(<InfoMenuItems />);

    expect(queryByText(i18n.t("more.survey"))).toBeNull();
  });
});
