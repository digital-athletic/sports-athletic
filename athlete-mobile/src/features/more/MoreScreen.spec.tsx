import MoreScreen from "../../../app/(tabs)/(more)/more";
import { render } from "../../utils/testUtils";

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ navigate: jest.fn() }),
}));

jest.mock("@/auth/useAuthActions", () => ({
  useLogout: () => ({ logout: jest.fn(), isLoading: false }),
  useDeleteAccount: () => ({ deleteAccount: jest.fn(), isLoading: false }),
}));

describe("MoreScreen: menu", () => {
  it("lists the performance tests entry", async () => {
    const { getByText } = await render(<MoreScreen />);

    expect(getByText("Performance tests")).toBeTruthy();
  });
});
