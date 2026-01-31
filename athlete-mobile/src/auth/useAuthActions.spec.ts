import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useLogout, useDeleteAccount } from "./useAuthActions";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock AuthService
const mockSupabaseLogout = jest.fn();
jest.mock("@/services/AuthService", () => ({
  logout: () => mockSupabaseLogout(),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock("@/common/Alert", () => ({
  Alert: {
    alert: (...args: unknown[]) => mockAlert(...args),
  },
}));

// Mock all stores
const mockClearAuth = jest.fn();
jest.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: { clearAuth: () => void }) => unknown) =>
    selector({ clearAuth: mockClearAuth }),
}));

const mockClearProgress = jest.fn();
jest.mock("@/store/exerciseProgressStore", () => ({
  useExerciseProgressStore: () => ({
    clearProgress: mockClearProgress,
  }),
}));

const mockClearAnamnesisData = jest.fn();
jest.mock("@/store/anamnesisStore", () => ({
  useAnamnesisStore: () => ({
    clearAnamnesisData: mockClearAnamnesisData,
  }),
}));

const mockClearProfile = jest.fn();
jest.mock("@/store/userProfileStore", () => ({
  useUserProfileStore: () => ({
    clearProfile: mockClearProfile,
  }),
}));

const mockClearUserWorkoutData = jest.fn();
jest.mock("@/store/userWorkoutStore", () => ({
  useUserWorkoutStore: () => ({
    clearUserWorkoutData: mockClearUserWorkoutData,
  }),
}));

const mockClearWorkoutHistory = jest.fn();
jest.mock("@/store/completedWorkoutsStore", () => ({
  useCompletedWorkoutsStore: () => ({
    clearWorkoutHistory: mockClearWorkoutHistory,
  }),
}));

const mockClearTrainingSchedule = jest.fn();
jest.mock("@/store/trainingScheduleStore", () => ({
  useTrainingScheduleStore: () => ({
    clearTrainingSchedule: mockClearTrainingSchedule,
  }),
}));

const mockClearPlaces = jest.fn();
jest.mock("@/store/placesStore", () => ({
  usePlacesStore: () => ({
    clearPlaces: mockClearPlaces,
  }),
}));

const mockClearSettings = jest.fn();
jest.mock("@/store/userSettingsStore", () => ({
  useUserSettingsStore: () => ({
    clearSettings: mockClearSettings,
  }),
}));

describe("useLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseLogout.mockResolvedValue(undefined);
  });

  it("should show confirmation dialog when logout is called", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "more.logoutQuestionTitle",
      "more.logoutQuestionMessage",
      expect.arrayContaining([
        expect.objectContaining({ text: "common.yes" }),
        expect.objectContaining({ text: "common.no" }),
      ]),
    );
  });

  it("should call supabase logout and clear auth when confirmed", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout();
    });

    // Simulate user pressing "Yes" on the confirmation dialog
    const yesButton = mockAlert.mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === "common.yes",
    );
    await act(async () => {
      await yesButton.onPress();
    });

    await waitFor(() => {
      expect(mockSupabaseLogout).toHaveBeenCalled();
    });

    expect(mockClearAuth).toHaveBeenCalled();
    // Navigation is handled automatically by Stack.Protected in _layout.tsx
  });

  it("should show error alert if logout fails", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout();
    });

    // Simulate user pressing "Yes"
    const yesButton = mockAlert.mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === "common.yes",
    );
    await act(async () => {
      await yesButton.onPress();
    });

    await waitFor(() => {
      expect(mockSupabaseLogout).toHaveBeenCalled();
    });

    // Error alert should be shown (confirmation + error = 2 calls)
    expect(mockAlert).toHaveBeenCalledTimes(2);
    expect(mockAlert).toHaveBeenLastCalledWith(
      "onboarding.alertErrorTitle",
      "more.logoutFailed",
    );
  });

  it("should not clear auth if logout fails", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout();
    });

    const yesButton = mockAlert.mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === "common.yes",
    );
    await act(async () => {
      await yesButton.onPress();
    });

    await waitFor(() => {
      expect(mockSupabaseLogout).toHaveBeenCalled();
    });

    // Auth should NOT be cleared on error
    expect(mockClearAuth).not.toHaveBeenCalled();
  });
});

describe("useDeleteAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseLogout.mockResolvedValue(undefined);
  });

  it("should show confirmation dialog when deleteAccount is called", async () => {
    const { result } = renderHook(() => useDeleteAccount());

    await act(async () => {
      result.current.deleteAccount();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "more.deleteQuestionTitle",
      "more.deleteQuestionMessage",
      expect.arrayContaining([
        expect.objectContaining({ text: "common.yes" }),
        expect.objectContaining({ text: "common.no" }),
      ]),
    );
  });

  it("should call supabase logout when delete is confirmed", async () => {
    const { result } = renderHook(() => useDeleteAccount());

    await act(async () => {
      result.current.deleteAccount();
    });

    const yesButton = mockAlert.mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === "common.yes",
    );
    await act(async () => {
      await yesButton.onPress();
    });

    await waitFor(() => {
      expect(mockSupabaseLogout).toHaveBeenCalled();
    });
  });

  it("should clear all stores when delete is confirmed", async () => {
    const { result } = renderHook(() => useDeleteAccount());

    await act(async () => {
      result.current.deleteAccount();
    });

    const yesButton = mockAlert.mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === "common.yes",
    );
    await act(async () => {
      await yesButton.onPress();
    });

    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalled();
    });

    expect(mockClearUserWorkoutData).toHaveBeenCalled();
    expect(mockClearProgress).toHaveBeenCalled();
    expect(mockClearAnamnesisData).toHaveBeenCalled();
    expect(mockClearProfile).toHaveBeenCalled();
    expect(mockClearWorkoutHistory).toHaveBeenCalled();
    expect(mockClearTrainingSchedule).toHaveBeenCalled();
    expect(mockClearPlaces).toHaveBeenCalled();
    expect(mockClearSettings).toHaveBeenCalled();
    // Navigation is handled automatically by Stack.Protected in _layout.tsx
  });

  it("should show error alert if supabase logout fails", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Supabase error"));

    const { result } = renderHook(() => useDeleteAccount());

    await act(async () => {
      result.current.deleteAccount();
    });

    const yesButton = mockAlert.mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === "common.yes",
    );
    await act(async () => {
      await yesButton.onPress();
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledTimes(2);
    });

    expect(mockAlert).toHaveBeenLastCalledWith(
      "onboarding.alertErrorTitle",
      "more.deleteFailed",
    );
  });

  it("should not clear stores if supabase logout fails", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Supabase error"));

    const { result } = renderHook(() => useDeleteAccount());

    await act(async () => {
      result.current.deleteAccount();
    });

    const yesButton = mockAlert.mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === "common.yes",
    );
    await act(async () => {
      await yesButton.onPress();
    });

    await waitFor(() => {
      expect(mockSupabaseLogout).toHaveBeenCalled();
    });

    // Stores should NOT be cleared on error
    expect(mockClearAuth).not.toHaveBeenCalled();
    expect(mockClearUserWorkoutData).not.toHaveBeenCalled();
  });
});
