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
const mockSupabaseDeleteAccount = jest.fn();
jest.mock("@/services/AuthService", () => ({
  deleteAccount: () => mockSupabaseDeleteAccount(),
  logout: () => mockSupabaseLogout(),
}));

// Mock SyncManager
const mockSyncManager = { isOnline: true };
jest.mock("@/services/SyncManager", () => ({
  get syncManager() {
    return mockSyncManager;
  },
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

const mockResetProgress = jest.fn();
jest.mock("@/store/exerciseProgressStore", () => ({
  useExerciseProgressStore: () => ({
    resetProgress: mockResetProgress,
  }),
}));

const mockResetAnamnesisData = jest.fn();
jest.mock("@/store/anamnesisStore", () => ({
  useAnamnesisStore: () => ({
    resetAnamnesisData: mockResetAnamnesisData,
  }),
}));

const mockResetProfile = jest.fn();
jest.mock("@/store/userProfileStore", () => ({
  useUserProfileStore: () => ({
    resetProfile: mockResetProfile,
  }),
}));

const mockResetUserWorkoutData = jest.fn();
jest.mock("@/store/userWorkoutStore", () => ({
  useUserWorkoutStore: () => ({
    resetUserWorkoutData: mockResetUserWorkoutData,
  }),
}));

const mockClearWorkoutHistory = jest.fn();
jest.mock("@/store/completedWorkoutsStore", () => ({
  useCompletedWorkoutsStore: () => ({
    clearWorkoutHistory: mockClearWorkoutHistory,
  }),
}));

const mockResetTrainingSchedule = jest.fn();
jest.mock("@/store/trainingScheduleStore", () => ({
  useTrainingScheduleStore: () => ({
    resetTrainingSchedule: mockResetTrainingSchedule,
  }),
}));

const mockResetPlaces = jest.fn();
jest.mock("@/store/placesStore", () => ({
  usePlacesStore: () => ({
    resetPlaces: mockResetPlaces,
  }),
}));

const mockResetSettings = jest.fn();
jest.mock("@/store/userSettingsStore", () => ({
  useUserSettingsStore: () => ({
    resetSettings: mockResetSettings,
  }),
}));

const mockClearSyncQueue = jest.fn();
jest.mock("@/store/syncQueueStore", () => ({
  useSyncQueueStore: () => ({
    clearSyncQueue: mockClearSyncQueue,
  }),
}));

const mockResetSubscription = jest.fn();
jest.mock("@/features/subscription/subscriptionStore", () => ({
  useSubscriptionStore: () => ({
    resetSubscription: mockResetSubscription,
  }),
}));

const mockClearTraining = jest.fn();
jest.mock("@/features/training/trainingStore", () => ({
  useTrainingStore: () => ({
    clearTraining: mockClearTraining,
  }),
}));

const mockResetSynchronization = jest.fn();
jest.mock("@/features/training/synchronizationStore", () => ({
  useSynchronizationStore: () => ({
    resetSynchronization: mockResetSynchronization,
  }),
}));

describe("useLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncManager.isOnline = true;
    mockSupabaseLogout.mockResolvedValue(undefined);
  });

  it("should show no-connection alert when offline", async () => {
    mockSyncManager.isOnline = false;

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "more.logoutQuestionTitle",
      "common.noConnection",
    );
    expect(mockSupabaseLogout).not.toHaveBeenCalled();
  });

  it("should show confirmation dialog when online and logout is called", async () => {
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
    mockSyncManager.isOnline = true;
    mockSupabaseDeleteAccount.mockResolvedValue(undefined);
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

  it("should call deleteAccount and logout when confirmed", async () => {
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
      expect(mockSupabaseDeleteAccount).toHaveBeenCalled();
    });

    expect(mockSupabaseLogout).toHaveBeenCalled();
  });

  it("should clear all stores when delete is confirmed", async () => {
    const allStoreResets = [
      mockClearAuth,
      mockResetUserWorkoutData,
      mockResetProgress,
      mockResetAnamnesisData,
      mockResetProfile,
      mockClearWorkoutHistory,
      mockResetTrainingSchedule,
      mockResetPlaces,
      mockResetSettings,
      mockClearSyncQueue,
      mockResetSubscription,
      mockClearTraining,
      mockResetSynchronization,
    ];

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

    const uncalledResets = allStoreResets
      .filter((mock) => mock.mock.calls.length === 0)
      .map((mock) => mock.getMockName());
    expect(uncalledResets).toEqual([]);
  });

  it("should show error alert if deleteAccount fails", async () => {
    mockSupabaseDeleteAccount.mockRejectedValue(new Error("Delete failed"));

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

  it("should not logout or clear stores if deleteAccount fails", async () => {
    mockSupabaseDeleteAccount.mockRejectedValue(new Error("Delete failed"));

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
      expect(mockSupabaseDeleteAccount).toHaveBeenCalled();
    });

    expect(mockSupabaseLogout).not.toHaveBeenCalled();
    expect(mockClearAuth).not.toHaveBeenCalled();
    expect(mockResetUserWorkoutData).not.toHaveBeenCalled();
  });

  it("should show no-connection alert when offline", async () => {
    mockSyncManager.isOnline = false;

    const { result } = renderHook(() => useDeleteAccount());

    await act(async () => {
      result.current.deleteAccount();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "more.deleteQuestionTitle",
      "common.noConnection",
    );
    expect(mockSupabaseDeleteAccount).not.toHaveBeenCalled();
  });

  it("should not clear stores if logout fails after deleteAccount succeeds", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Logout error"));

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
      expect(mockSupabaseDeleteAccount).toHaveBeenCalled();
    });

    expect(mockClearAuth).not.toHaveBeenCalled();
    expect(mockResetUserWorkoutData).not.toHaveBeenCalled();
  });
});
