import {
  parseViewBox,
  SILHOUETTES,
} from "@/bodyParts/silhouette/silhouetteData";
import i18n from "@/i18n";
import { useUserProfileStore } from "@/store/userProfileStore";
import { fireEvent, render, screen } from "@/utils/testUtils";
import { PreventionBodyPartScreen } from "./PreventionBodyPartScreen";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ navigate: mockNavigate, back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

function setGender(gender: "MALE" | "FEMALE") {
  useUserProfileStore.setState({
    personalData: {
      ...useUserProfileStore.getState().personalData,
      gender,
    },
  });
}

beforeEach(async () => {
  mockNavigate.mockClear();
  setGender("MALE");
  await i18n.changeLanguage("en");
});

describe("PreventionBodyPartScreen: content", () => {
  it("shows the eyebrow, the headline and the subtitle in English", async () => {
    await render(
      <PreventionBodyPartScreen
        title="Prevention Training"
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText("Prevention training")).toBeTruthy();
    expect(
      screen.getByRole("header", { name: "Where do you feel pain?" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Pick the body part. The training targets it."),
    ).toBeTruthy();
  });

  it("shows the headline and the body parts in German", async () => {
    await i18n.changeLanguage("de");
    await render(
      <PreventionBodyPartScreen
        title="Präventionstraining"
        onBack={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("header", { name: "Wo hast du Beschwerden?" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Knie & Hüfte" })).toBeTruthy();
  });

  it("lists the five body parts as buttons from shoulder to ankle", async () => {
    await render(
      <PreventionBodyPartScreen
        title="Prevention Training"
        onBack={jest.fn()}
      />,
    );

    const names = screen
      .getAllByRole("button")
      .map((button) => button.props.accessibilityLabel as string)
      .filter((label) => label !== undefined);
    expect(names).toEqual([
      "Shoulder",
      "Spine",
      "Wrist & Elbow",
      "Knee & Hip",
      "Ankle",
    ]);
  });
});

describe("PreventionBodyPartScreen: navigation", () => {
  it("opens the muscle soreness step of the knee and hip training", async () => {
    await render(
      <PreventionBodyPartScreen
        title="Prevention Training"
        onBack={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Knee & Hip" }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type: "PREVKNEE" },
    });
  });
});

describe("PreventionBodyPartScreen: gender", () => {
  it("draws every silhouette with the gender from the anamnesis", async () => {
    setGender("FEMALE");
    await render(
      <PreventionBodyPartScreen
        title="Prevention Training"
        onBack={jest.fn()}
      />,
    );

    const femaleWidths = [
      SILHOUETTES.FEMALE.FRONT.viewBox,
      SILHOUETTES.FEMALE.BACK.viewBox,
    ].map((viewBox) => parseViewBox(viewBox).width);
    const thumbnails = screen.getAllByTestId("silhouette-thumbnail", {
      includeHiddenElements: true,
    });

    expect(thumbnails).toHaveLength(5);
    thumbnails.forEach((node) => {
      expect(femaleWidths).toContainEqual(node.props.vbWidth);
    });
  });
});
