import { fireEvent, render, screen } from "@/utils/testUtils";
import { type ComponentProps } from "react";
import { RegistrationScreen } from "./RegisterScreen";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

type Props = ComponentProps<typeof RegistrationScreen>;

const renderScreen = async (overrides: Partial<Props> = {}) => {
  const onRegister = jest.fn();
  const onBack = jest.fn();
  await render(
    <RegistrationScreen
      email=""
      acceptedPrivacy={false}
      acceptedAnalytics={false}
      registrationError={null}
      errorFields={[]}
      onEmailChange={jest.fn()}
      onPrivacyToggle={jest.fn()}
      onAnalyticsToggle={jest.fn()}
      onRegister={onRegister}
      onBack={onBack}
      processing={false}
      {...overrides}
    />,
  );
  return { onRegister, onBack };
};

describe("RegistrationScreen", () => {
  it("shows a headline that explains the registration", async () => {
    await renderScreen();

    expect(
      screen.getByRole("header", { name: "Create your account" }),
    ).toBeTruthy();
    expect(screen.getByText("Registration")).toBeTruthy();
    expect(
      screen.getByText(
        "You only need your e-mail address. We send you a code to confirm it.",
      ),
    ).toBeTruthy();
  });

  it("starts the registration when the register button is pressed", async () => {
    const { onRegister } = await renderScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Register" }));

    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it("goes back to the login with the back arrow", async () => {
    const { onBack } = await renderScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows a registration error as an alert", async () => {
    await renderScreen({ registrationError: "The e-mail is not valid." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The e-mail is not valid.",
    );
  });
});
