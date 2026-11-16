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
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_PERFORMANCE_TESTS_ENABLED;
  });

  it("lists the performance tests entry", async () => {
    const { getByText } = await render(<MoreScreen />);

    expect(getByText("Performance tests")).toBeTruthy();
  });

  it("hides the performance tests entry when the feature flag is off", async () => {
    process.env.EXPO_PUBLIC_PERFORMANCE_TESTS_ENABLED = "false";

    const { queryByText } = await render(<MoreScreen />);

    expect(queryByText("Performance tests")).toBeNull();
  });
});
