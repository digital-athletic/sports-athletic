/**
 * Unit tests for authStore offline resilience
 */

/* eslint-disable import/first */
const mockGetSession = jest.fn();
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn((_table: string) => ({ select: mockSelect }));
jest.mock("../services/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock("../services/Logger", () => ({
  Logger: {
    logError: jest.fn(),
  },
}));

const mockSetAnonymisedDataUse = jest.fn();
jest.mock("./userSettingsStore", () => ({
  useUserSettingsStore: {
    getState: () => ({ setAnonymisedDataUse: mockSetAnonymisedDataUse }),
  },
}));

import { useAuthStore } from "./authStore";

beforeEach(() => {
  jest.clearAllMocks();
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  useAuthStore.setState({
    auth: null,
    isInitialized: false,
    _hasHydrated: false,
  });
});

describe("initializeFromSupabase", () => {
  it("sets auth and isInitialized=true when getSession succeeds", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "tok-1" },
      },
    });

    await useAuthStore.getState().initializeFromSupabase();

    expect(useAuthStore.getState().auth).toEqual({
      userId: "user-1",
      token: "tok-1",
    });
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it("preserves persisted auth and sets isInitialized=true when getSession throws Network request failed", async () => {
    useAuthStore.setState({ auth: { userId: "existing", token: "old" } });
    mockGetSession.mockRejectedValue(new TypeError("Network request failed"));

    await useAuthStore.getState().initializeFromSupabase();

    expect(useAuthStore.getState().auth).toEqual({
      userId: "existing",
      token: "old",
    });
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it("sets auth to null and isInitialized=true when getSession returns null session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await useAuthStore.getState().initializeFromSupabase();

    expect(useAuthStore.getState().auth).toBeNull();
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it("syncs consent_health_accepted from user_profiles to userSettingsStore on login", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "tok-1" },
      },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { consent_health_accepted: true },
      error: null,
    });

    await useAuthStore.getState().initializeFromSupabase();

    expect(mockFrom).toHaveBeenCalledWith("user_profiles");
    expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
  });

  it("does not update userSettingsStore when user_profiles has no consent value", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "tok-1" },
      },
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await useAuthStore.getState().initializeFromSupabase();

    expect(mockSetAnonymisedDataUse).not.toHaveBeenCalled();
  });

  it("still initializes auth when user_profiles fetch fails", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "tok-1" },
      },
    });
    mockMaybeSingle.mockRejectedValue(new Error("network"));

    await useAuthStore.getState().initializeFromSupabase();

    expect(useAuthStore.getState().auth).toEqual({
      userId: "user-1",
      token: "tok-1",
    });
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });
});
