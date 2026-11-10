import { fireEvent, render, screen } from "@/utils/testUtils";
import { Text } from "react-native";
import { HeadlineScreen } from "./HeadlineScreen";

type ScreenOptions = { headerShown?: boolean };

const mockScreenOptions = jest.fn<void, [ScreenOptions]>();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options: ScreenOptions }) => {
      mockScreenOptions(options);
      return null;
    },
  },
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("HeadlineScreen: content", () => {
  it("announces the heading as a header", async () => {
    await render(<HeadlineScreen title="Sport" heading="Your sport" />);

    expect(screen.getByRole("header", { name: "Your sport" })).toBeTruthy();
  });

  it("shows the description below the heading", async () => {
    await render(
      <HeadlineScreen
        title="Sport"
        heading="Your sport"
        description="Pick the sport you train for."
      />,
    );

    expect(screen.getByText("Pick the sport you train for.")).toBeTruthy();
  });

  it("renders its children", async () => {
    await render(
      <HeadlineScreen title="Sport" heading="Your sport">
        <Text>Question</Text>
      </HeadlineScreen>,
    );

    expect(screen.getByText("Question")).toBeTruthy();
  });

  it("shows the step counter as eyebrow", async () => {
    await render(
      <HeadlineScreen
        title="Sport"
        heading="Your sport"
        step={{ current: 2, total: 5 }}
      />,
    );

    expect(screen.getByText(/2.*5/)).toBeTruthy();
  });

  it("shows a given eyebrow text above the heading", async () => {
    await render(
      <HeadlineScreen title="Hub" heading="Focus" eyebrow="Training" />,
    );

    expect(screen.getByText("Training")).toBeTruthy();
  });

  it("keeps the step counter when an eyebrow is given as well", async () => {
    await render(
      <HeadlineScreen
        title="Sport"
        heading="Your sport"
        eyebrow="Training"
        step={{ current: 2, total: 5 }}
      />,
    );

    expect(screen.getByText(/2.*5/)).toBeTruthy();
  });
});

describe("HeadlineScreen: footer button", () => {
  it("calls the action when the button is pressed", async () => {
    const onPress = jest.fn();
    await render(
      <HeadlineScreen
        title="Sport"
        heading="Your sport"
        action={{ label: "Next", onPress }}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Next" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has no button without an action", async () => {
    await render(<HeadlineScreen title="Sport" heading="Your sport" />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("HeadlineScreen: stack header", () => {
  beforeEach(() => mockScreenOptions.mockClear());

  it("shows the stack header by default", async () => {
    await render(<HeadlineScreen title="Sport" heading="Your sport" />);

    expect(mockScreenOptions.mock.calls.at(-1)?.[0].headerShown).toBe(true);
  });

  it("hides the stack header when asked to", async () => {
    await render(
      <HeadlineScreen
        title="Statistics"
        heading="Progress"
        headerShown={false}
      />,
    );

    expect(mockScreenOptions.mock.calls.at(-1)?.[0].headerShown).toBe(false);
  });
});
