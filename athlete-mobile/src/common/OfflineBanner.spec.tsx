import { render, screen } from "../utils/testUtils";
import { OfflineBanner } from "./OfflineBanner";

import { useNetworkState } from "../hooks/useNetworkState";

jest.mock("../hooks/useNetworkState");
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
const mockUseNetworkState = useNetworkState as jest.MockedFunction<
  typeof useNetworkState
>;

describe("OfflineBanner", () => {
  it("renders offline text when useNetworkState returns false", () => {
    mockUseNetworkState.mockReturnValue(false);
    render(<OfflineBanner />);
    expect(
      screen.getByText("Offline — some features unavailable"),
    ).toBeTruthy();
  });

  it("renders nothing when useNetworkState returns true", () => {
    mockUseNetworkState.mockReturnValue(true);
    render(<OfflineBanner />);
    expect(
      screen.queryByText("Offline — some features unavailable"),
    ).toBeNull();
  });
});
