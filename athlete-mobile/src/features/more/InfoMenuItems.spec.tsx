import i18n from "@/i18n";
import { Linking } from "react-native";
import { fireEvent, render } from "../../utils/testUtils";
import { InfoMenuItems } from "./InfoMenuItems";

jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: jest.fn() }),
}));

// Renders each icon as a named host node, so the test finds it in the tree.
jest.mock("@tabler/icons-react-native/IconEdit", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconEdit", props),
}));
jest.mock("@tabler/icons-react-native/IconBug", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconBug", props),
}));
jest.mock("@tabler/icons-react-native/IconClipboard", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconClipboard", props),
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

  it("shows an icon on each of the three form links", async () => {
    process.env.EXPO_PUBLIC_LINK_CONSENT_U16 = "https://example.com/consent";
    process.env.EXPO_PUBLIC_LINK_FEEDBACK_REPORT =
      "https://example.com/feedback";
    process.env.EXPO_PUBLIC_LINK_SURVEY = "https://example.com/survey";

    const { container } = await render(<InfoMenuItems />);

    const iconCount = (type: string) =>
      container.queryAll((node) => node.type === type).length;
    expect(iconCount("IconEdit")).toBe(1);
    expect(iconCount("IconBug")).toBe(1);
    expect(iconCount("IconClipboard")).toBe(1);
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
