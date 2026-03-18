/**
 * Unit tests for authStore offline resilience
 */

/* eslint-disable import/first */
const mockGetSession = jest.fn();
jest.mock("../services/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

jest.mock("../services/Logger", () => ({
  Logger: {
    logError: jest.fn(),
  },
}));

import { useAuthStore } from "./authStore";

beforeEach(() => {
  jest.clearAllMocks();
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
});
