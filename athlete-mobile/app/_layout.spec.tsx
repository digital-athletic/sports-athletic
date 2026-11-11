import { useAuthStore } from "@/store/authStore";
import { useUserSettingsStore } from "@/store/userSettingsStore";
import { render } from "@/utils/testUtils";
import RootLayout from "./_layout";

const mockRootScreenNames: string[] = [];

jest.mock("expo-router", () => {
  const { createElement, Fragment } = jest.requireActual("react");
  const Passthrough = ({ children }: { children?: unknown }) =>
    createElement(Fragment, null, children);
  const Screen = ({ name }: { name: string }) => {
    mockRootScreenNames.push(name);
    return null;
  };
  const Stack = Object.assign(Passthrough, {
    Protected: Passthrough,
    Screen,
  });
  return { Stack };
});

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardProvider: ({ children }: { children?: unknown }) => children,
}));
jest.mock("@/auth/useAuthStateListener", () => ({
  useAuthStateListener: jest.fn(),
}));
jest.mock("@/services/OTAService", () => ({ useOTAService: jest.fn() }));
jest.mock("@/services/useSyncManager", () => ({ useSyncManager: jest.fn() }));
jest.mock("@/features/training/hooks/usePendingPlanCheck", () => ({
  usePendingPlanCheck: jest.fn(),
}));
jest.mock("@/common/OfflineBanner", () => ({ OfflineBanner: () => null }));
jest.mock("@/common/Alert", () => ({ AlertHost: () => null }));

describe("RootLayout: root stack screens", () => {
  beforeEach(() => {
    mockRootScreenNames.length = 0;
    useAuthStore.setState({
      _hasHydrated: true,
      auth: { userId: "user-1" },
    } as Partial<ReturnType<typeof useAuthStore.getState>>);
    useUserSettingsStore.setState({ consentStatus: "accepted" });
  });

  it("registers training directly on the root stack so a workout abort can pop it", async () => {
    await render(<RootLayout />);

    expect(mockRootScreenNames).toContain("training");
  });
});
