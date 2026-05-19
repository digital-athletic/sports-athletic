import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useLogout, useDeleteAccount } from "./useAuthActions";

// Mock expo-router
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

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

// Mock useNetworkState
let mockIsOnline = true;
jest.mock("@/hooks/useNetworkState", () => ({
  useNetworkState: () => mockIsOnline,
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
  useUserProfileStore: (
    selector?: (state: { resetProfile: () => void }) => unknown,
  ) => {
    const state = { resetProfile: mockResetProfile };
    return selector ? selector(state) : state;
  },
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
const mockSetConsentStatus = jest.fn();
jest.mock("@/store/userSettingsStore", () => ({
  useUserSettingsStore: (
    selector?: (state: {
      resetSettings: () => void;
      setConsentStatus: (s: string) => void;
    }) => unknown,
  ) => {
    const state = {
      resetSettings: mockResetSettings,
      setConsentStatus: mockSetConsentStatus,
    };
    return selector ? selector(state) : state;
  },
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

function storeCallCounts() {
  return {
    clearAuth: mockClearAuth.mock.calls.length,
    resetUserWorkoutData: mockResetUserWorkoutData.mock.calls.length,
    resetProgress: mockResetProgress.mock.calls.length,
    resetAnamnesisData: mockResetAnamnesisData.mock.calls.length,
    resetProfile: mockResetProfile.mock.calls.length,
    clearWorkoutHistory: mockClearWorkoutHistory.mock.calls.length,
    resetTrainingSchedule: mockResetTrainingSchedule.mock.calls.length,
    resetPlaces: mockResetPlaces.mock.calls.length,
    resetSettings: mockResetSettings.mock.calls.length,
    clearSyncQueue: mockClearSyncQueue.mock.calls.length,
    resetSubscription: mockResetSubscription.mock.calls.length,
    clearTraining: mockClearTraining.mock.calls.length,
    resetSynchronization: mockResetSynchronization.mock.calls.length,
  };
}

const ALL_STORES_CALLED_ONCE = {
  clearAuth: 1,
  resetUserWorkoutData: 1,
  resetProgress: 1,
  resetAnamnesisData: 1,
  resetProfile: 1,
  clearWorkoutHistory: 1,
  resetTrainingSchedule: 1,
  resetPlaces: 1,
  resetSettings: 1,
  clearSyncQueue: 1,
  resetSubscription: 1,
  clearTraining: 1,
  resetSynchronization: 1,
};

const ALL_STORES_NOT_CALLED = Object.fromEntries(
  Object.keys(ALL_STORES_CALLED_ONCE).map((k) => [k, 0]),
) as typeof ALL_STORES_CALLED_ONCE;

async function confirmLogout() {
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
}

async function confirmDeleteAccount() {
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
}

describe("useLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    mockSupabaseLogout.mockResolvedValue(undefined);
  });

  it("should show no-connection alert when offline", async () => {
    mockIsOnline = false;
    const { result } = renderHook(() => useLogout());
    await act(async () => {
      result.current.logout();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "more.logoutQuestionTitle",
      "common.noConnection",
    );
  });

  it("should not call supabaseLogout when offline", async () => {
    mockIsOnline = false;
    const { result } = renderHook(() => useLogout());
    await act(async () => {
      result.current.logout();
    });

    expect(mockSupabaseLogout).not.toHaveBeenCalled();
  });

  it("should show confirmation dialog when online", async () => {
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

  it("should call supabaseLogout when confirmed", async () => {
    await confirmLogout();

    await waitFor(() => {
      expect(mockSupabaseLogout).toHaveBeenCalled();
    });
  });

  it("should clear auth and reset consent when confirmed", async () => {
    await confirmLogout();

    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalled();
    });
    expect(mockSetConsentStatus).toHaveBeenCalledWith("loading");
  });

  it("should navigate to onboarding when confirmed", async () => {
    await confirmLogout();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("should show error alert when logout fails", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Network error"));
    await confirmLogout();

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "onboarding.alertErrorTitle",
        "more.logoutFailed",
      );
    });
  });

  it("should still clear auth and reset consent when logout fails", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Network error"));
    await confirmLogout();

    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalled();
    });
    expect(mockSetConsentStatus).toHaveBeenCalledWith("loading");
  });

  it("calls resetProfile on successful logout", async () => {
    await confirmLogout();
    await waitFor(() => {
      expect(mockResetProfile).toHaveBeenCalled();
    });
  });

  it("calls resetProfile even when supabase logout fails", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Network error"));
    await confirmLogout();
    await waitFor(() => {
      expect(mockResetProfile).toHaveBeenCalled();
    });
  });

  it("should still navigate to onboarding when logout fails", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Network error"));
    await confirmLogout();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/onboarding");
    });
  });
});

describe("useDeleteAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
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

  it("should show no-connection alert when offline", async () => {
    mockIsOnline = false;
    const { result } = renderHook(() => useDeleteAccount());
    await act(async () => {
      result.current.deleteAccount();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "more.deleteQuestionTitle",
      "common.noConnection",
    );
  });

  it("should not call supabaseDeleteAccount when offline", async () => {
    mockIsOnline = false;
    const { result } = renderHook(() => useDeleteAccount());
    await act(async () => {
      result.current.deleteAccount();
    });

    expect(mockSupabaseDeleteAccount).not.toHaveBeenCalled();
  });

  it("should call supabaseDeleteAccount when confirmed", async () => {
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockSupabaseDeleteAccount).toHaveBeenCalled();
    });
  });

  it("should call supabaseLogout when confirmed", async () => {
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockSupabaseLogout).toHaveBeenCalled();
    });
  });

  it("should clear all stores when confirmed", async () => {
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalled();
    });
    expect(storeCallCounts()).toEqual(ALL_STORES_CALLED_ONCE);
  });

  it("should clear auth before navigating to onboarding when confirmed", async () => {
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalled();
    });
    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });

  it("should show error alert when deleteAccount fails", async () => {
    mockSupabaseDeleteAccount.mockRejectedValue(new Error("Delete failed"));
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "onboarding.alertErrorTitle",
        "more.deleteFailed",
      );
    });
  });

  it("should not call supabaseLogout when deleteAccount fails", async () => {
    mockSupabaseDeleteAccount.mockRejectedValue(new Error("Delete failed"));
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockSupabaseDeleteAccount).toHaveBeenCalled();
    });
    expect(mockSupabaseLogout).not.toHaveBeenCalled();
  });

  it("should not clear any store when deleteAccount fails", async () => {
    mockSupabaseDeleteAccount.mockRejectedValue(new Error("Delete failed"));
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockSupabaseDeleteAccount).toHaveBeenCalled();
    });
    expect(storeCallCounts()).toEqual(ALL_STORES_NOT_CALLED);
  });

  it("should not navigate when deleteAccount fails", async () => {
    mockSupabaseDeleteAccount.mockRejectedValue(new Error("Delete failed"));
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockSupabaseDeleteAccount).toHaveBeenCalled();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should show error alert when logout fails after deleteAccount succeeds", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Logout error"));
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "onboarding.alertErrorTitle",
        "more.deleteFailed",
      );
    });
  });

  it("should still clear all stores when logout fails after deleteAccount succeeds", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Logout error"));
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalled();
    });
    expect(storeCallCounts()).toEqual(ALL_STORES_CALLED_ONCE);
  });

  it("should still navigate to onboarding when logout fails after deleteAccount succeeds", async () => {
    mockSupabaseLogout.mockRejectedValue(new Error("Logout error"));
    await confirmDeleteAccount();

    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalled();
    });
    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });
});
