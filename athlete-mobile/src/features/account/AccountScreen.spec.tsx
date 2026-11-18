import i18n from "@/i18n";
import { fireEvent, render } from "@/utils/testUtils";
import { AccountScreen } from "./AccountScreen";

const mockExportData = jest.fn();
const mockDeleteAccount = jest.fn();
const mockUseStatisticsExport = jest.fn();
let mockIsDeleting = false;
let mockIsExporting = false;

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ navigate: jest.fn() }),
}));

jest.mock("@/auth/useAuthActions", () => ({
  useDeleteAccount: () => ({
    deleteAccount: mockDeleteAccount,
    isLoading: mockIsDeleting,
  }),
}));

jest.mock("@/features/statistics/hooks/useStatisticsExport", () => ({
  useStatisticsExport: (...args: unknown[]) => mockUseStatisticsExport(...args),
}));

jest.mock("@/features/account/hooks/useServerDataExport", () => ({
  useServerDataExport: () => ({
    exportData: mockExportData,
    isExporting: mockIsExporting,
  }),
}));

describe("AccountScreen: data export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsExporting = false;
  });

  it("downloads the server data with one button", async () => {
    const { getByText, getByRole } = await render(<AccountScreen />);

    expect(getByText(i18n.t("more.account.dataExport.title"))).toBeTruthy();
    await fireEvent.press(
      getByRole("button", { name: i18n.t("more.account.dataExport.download") }),
    );

    expect(mockExportData).toHaveBeenCalledTimes(1);
  });

  it("never exports the workouts or strength tests stored on the device", async () => {
    await render(<AccountScreen />);

    expect(mockUseStatisticsExport).not.toHaveBeenCalled();
  });

  it("disables the download while it runs", async () => {
    mockIsExporting = true;
    const { getByRole } = await render(<AccountScreen />);

    const button = getByRole("button", {
      name: i18n.t("more.account.dataExport.download"),
    });
    await fireEvent.press(button);

    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    expect(mockExportData).not.toHaveBeenCalled();
  });
});

describe("AccountScreen: delete account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDeleting = false;
  });

  it("deletes the account on press", async () => {
    const { getByRole } = await render(<AccountScreen />);

    await fireEvent.press(
      getByRole("button", { name: i18n.t("more.deleteUser") }),
    );

    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it("shows the deleting message while the account is deleted", async () => {
    mockIsDeleting = true;

    const { getByText } = await render(<AccountScreen />);

    expect(getByText(i18n.t("more.deletingAccount"))).toBeTruthy();
  });
});
