import { fireEvent, render, screen } from "@/utils/testUtils";
import { LoginScreen } from "./LoginScreen";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

const renderScreen = async (processing = false) => {
  const onLogin = jest.fn();
  const onSignup = jest.fn();
  await render(
    <LoginScreen
      email=""
      onEmailChange={jest.fn()}
      onLogin={onLogin}
      onSignup={onSignup}
      processing={processing}
    />,
  );
  return { onLogin, onSignup };
};

describe("LoginScreen", () => {
  it("starts the login when the login button is pressed", async () => {
    const { onLogin } = await renderScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Send code" }));

    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("opens the registration when the register button is pressed", async () => {
    const { onSignup } = await renderScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));

    expect(onSignup).toHaveBeenCalledTimes(1);
  });

  it("keeps the register button available while a login is processing", async () => {
    const { onSignup } = await renderScreen(true);

    await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));

    expect(onSignup).toHaveBeenCalledTimes(1);
  });
});
