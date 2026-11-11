import i18n from "@/i18n";
import { Linking } from "react-native";
import { fireEvent, render } from "../../utils/testUtils";
import { IntroVideoLinks } from "./IntroVideoLinks";

jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: jest.fn() }),
}));

// Renders each icon as a named host node, so the test finds it in the tree.
jest.mock("@tabler/icons-react-native/IconPlayerPlay", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconPlayerPlay", props),
}));

describe("IntroVideoLinks: links above the introduction videos", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_TRAINERS;
    delete process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_PLAYERS;
    jest.restoreAllMocks();
  });

  it("opens the trainer and the player videos in the browser", async () => {
    process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_TRAINERS =
      "https://example.com/trainer-videos";
    process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_PLAYERS =
      "https://example.com/player-videos";
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { getByText } = await render(<IntroVideoLinks />);
    await fireEvent.press(getByText(i18n.t("more.introVideosTrainers")));
    await fireEvent.press(getByText(i18n.t("more.introVideosPlayers")));

    expect(openURL.mock.calls).toEqual([
      ["https://example.com/trainer-videos"],
      ["https://example.com/player-videos"],
    ]);
  });

  it("shows a play icon on every link", async () => {
    process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_TRAINERS =
      "https://example.com/trainer-videos";
    process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_PLAYERS =
      "https://example.com/player-videos";

    const { container } = await render(<IntroVideoLinks />);

    const icons = container.queryAll((node) => node.type === "IconPlayerPlay");
    expect(icons).toHaveLength(2);
  });

  it("shows only the link whose variable is set", async () => {
    process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_PLAYERS =
      "https://example.com/player-videos";

    const { getAllByRole, getByText } = await render(<IntroVideoLinks />);

    expect(getAllByRole("link")).toHaveLength(1);
    expect(getByText(i18n.t("more.introVideosPlayers"))).toBeTruthy();
  });

  it("renders nothing when both variables are unset", async () => {
    const { toJSON } = await render(<IntroVideoLinks />);

    expect(toJSON()).toBeNull();
  });
});
