import { acceptInvitation, getUserTeams, leaveTeam } from "./TeamService";

function makeEdgeFunctionError(code: string) {
  return { context: { json: () => Promise.resolve({ error: code }) } };
}

const mockFunctionsInvoke = jest.fn();
const mockGetSession = jest.fn();

const mockOrder = jest.fn();
const mockIn = jest.fn((): { order: jest.Mock } => ({ order: mockOrder }));
const mockEq = jest.fn();
const mockSelect = jest.fn((): { eq: jest.Mock; in: jest.Mock } => ({
  eq: mockEq,
  in: mockIn,
}));
const mockFrom = jest.fn((_table: string): { select: jest.Mock } => ({
  select: mockSelect,
}));

jest.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
    from: (table: string) => mockFrom(table),
  },
}));

describe("getUserTeams", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array when getSession returns no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const result = await getUserTeams();

    expect(result).toEqual([]);
  });

  it("returns empty array when team_members query returns an error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" }, access_token: "tok" } },
    });
    mockEq.mockResolvedValue({ data: null, error: { message: "DB error" } });

    mockFrom.mockReturnValueOnce({ select: mockSelect });

    const result = await getUserTeams();

    expect(result).toEqual([]);
  });

  it("returns empty array when team_members query returns empty array", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" }, access_token: "tok" } },
    });
    mockEq.mockResolvedValue({ data: [], error: null });

    mockFrom.mockReturnValueOnce({ select: mockSelect });

    const result = await getUserTeams();

    expect(result).toEqual([]);
  });

  it("returns empty array when teams query returns an error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" }, access_token: "tok" } },
    });
    mockEq.mockResolvedValue({
      data: [{ team_id: "team-1" }],
      error: null,
    });
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const membersSelect = jest.fn(() => ({ eq: mockEq }));
    const teamsIn = jest.fn(() => ({ order: mockOrder }));
    const teamsSelect = jest.fn(() => ({ in: teamsIn }));

    mockFrom
      .mockReturnValueOnce({ select: membersSelect })
      .mockReturnValueOnce({ select: teamsSelect });

    const result = await getUserTeams();

    expect(result).toEqual([]);
  });

  it("returns mapped UserTeam array on happy path with two teams", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" }, access_token: "tok" } },
    });

    const membersEq = jest.fn().mockResolvedValue({
      data: [{ team_id: "team-1" }, { team_id: "team-2" }],
      error: null,
    });
    const membersSelect = jest.fn(() => ({ eq: membersEq }));

    const teamsOrder = jest.fn().mockResolvedValue({
      data: [
        { id: "team-1", name: "Alpha Squad", owner_id: "owner-1" },
        { id: "team-2", name: "Beta Squad", owner_id: "owner-2" },
      ],
      error: null,
    });
    const teamsIn = jest.fn(() => ({ order: teamsOrder }));
    const teamsSelect = jest.fn(() => ({ in: teamsIn }));

    mockFrom
      .mockReturnValueOnce({ select: membersSelect })
      .mockReturnValueOnce({ select: teamsSelect });

    const result = await getUserTeams();

    expect(result).toEqual([
      { id: "team-1", name: "Alpha Squad", ownerId: "owner-1" },
      { id: "team-2", name: "Beta Squad", ownerId: "owner-2" },
    ]);
  });

  it("queries team_members table with the correct user_id", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-99" }, access_token: "tok" } },
    });

    const membersEq = jest.fn().mockResolvedValue({ data: [], error: null });
    const membersSelect = jest.fn(() => ({ eq: membersEq }));

    mockFrom.mockReturnValueOnce({ select: membersSelect });

    await getUserTeams();

    expect(mockFrom).toHaveBeenCalledWith("team_members");
    expect(membersSelect).toHaveBeenCalledWith("team_id");
    expect(membersEq).toHaveBeenCalledWith("user_id", "user-99");
  });

  it("queries teams table with the team IDs from memberships", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" }, access_token: "tok" } },
    });

    const membersEq = jest.fn().mockResolvedValue({
      data: [{ team_id: "team-A" }, { team_id: "team-B" }],
      error: null,
    });
    const membersSelect = jest.fn(() => ({ eq: membersEq }));

    const teamsOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const teamsIn = jest.fn(() => ({ order: teamsOrder }));
    const teamsSelect = jest.fn(() => ({ in: teamsIn }));

    mockFrom
      .mockReturnValueOnce({ select: membersSelect })
      .mockReturnValueOnce({ select: teamsSelect });

    await getUserTeams();

    expect(mockFrom).toHaveBeenCalledWith("teams");
    expect(teamsSelect).toHaveBeenCalledWith("id, name, owner_id");
    expect(teamsIn).toHaveBeenCalledWith("id", ["team-A", "team-B"]);
  });
});

describe("acceptInvitation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws more.joinTeam.errorGeneric when no session exists", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(acceptInvitation("CODE123")).rejects.toThrow(
      "more.joinTeam.errorGeneric",
    );
    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
  });

  it("calls functions.invoke with accept-invitation, correct body and Authorization header", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: "tok-abc" },
      },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        member_id: "m-1",
        team_id: "t-1",
        team_name: "Warriors",
        role: "member",
        joined_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });

    await acceptInvitation("CODE123");

    expect(mockFunctionsInvoke).toHaveBeenCalledWith("accept-invitation", {
      body: { code: "CODE123" },
      headers: { Authorization: "Bearer tok-abc" },
    });
  });

  it("returns mapped JoinTeamResult on success", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: "tok-abc" },
      },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        member_id: "m-1",
        team_id: "t-1",
        team_name: "Warriors",
        role: "member",
        joined_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await acceptInvitation("CODE123");

    expect(result).toEqual({
      teamId: "t-1",
      teamName: "Warriors",
    });
  });

  it("throws more.joinTeam.errorInvalidCode for INVITE_CODE_INVALID error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-abc" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("INVITE_CODE_INVALID"),
    });

    await expect(acceptInvitation("BAD")).rejects.toThrow(
      "more.joinTeam.errorInvalidCode",
    );
  });

  it("throws more.joinTeam.errorInactive for INVITE_CODE_INACTIVE error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-abc" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("INVITE_CODE_INACTIVE"),
    });

    await expect(acceptInvitation("INACTIVE")).rejects.toThrow(
      "more.joinTeam.errorInactive",
    );
  });

  it("throws more.joinTeam.errorExpired for INVITE_CODE_EXPIRED error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-abc" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("INVITE_CODE_EXPIRED"),
    });

    await expect(acceptInvitation("EXPIRED")).rejects.toThrow(
      "more.joinTeam.errorExpired",
    );
  });

  it("throws more.joinTeam.errorMaxUses for INVITE_CODE_MAX_USES error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-abc" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("INVITE_CODE_MAX_USES"),
    });

    await expect(acceptInvitation("MAXED")).rejects.toThrow(
      "more.joinTeam.errorMaxUses",
    );
  });

  it("throws more.joinTeam.errorAlreadyMember for ALREADY_TEAM_MEMBER error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-abc" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("ALREADY_TEAM_MEMBER"),
    });

    await expect(acceptInvitation("DUPE")).rejects.toThrow(
      "more.joinTeam.errorAlreadyMember",
    );
  });

  it("throws more.joinTeam.errorGeneric for unknown error codes", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-abc" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("SOME_UNKNOWN_ERROR"),
    });

    await expect(acceptInvitation("CODE")).rejects.toThrow(
      "more.joinTeam.errorGeneric",
    );
  });
});

describe("leaveTeam", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws more.joinTeam.errorGeneric when no session exists", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(leaveTeam("team-1")).rejects.toThrow(
      "more.joinTeam.errorGeneric",
    );
    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
  });

  it("calls functions.invoke with leave-team, correct body and Authorization header", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-xyz" } },
    });
    mockFunctionsInvoke.mockResolvedValue({ data: {}, error: null });

    await leaveTeam("team-42");

    expect(mockFunctionsInvoke).toHaveBeenCalledWith("leave-team", {
      body: { team_id: "team-42" },
      headers: { Authorization: "Bearer tok-xyz" },
    });
  });

  it("resolves successfully when no error is returned", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-xyz" } },
    });
    mockFunctionsInvoke.mockResolvedValue({ data: {}, error: null });

    await expect(leaveTeam("team-1")).resolves.toBeUndefined();
  });

  it("throws more.joinTeam.leaveErrorNotMember for NOT_TEAM_MEMBER error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-xyz" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("NOT_TEAM_MEMBER"),
    });

    await expect(leaveTeam("team-1")).rejects.toThrow(
      "more.joinTeam.leaveErrorNotMember",
    );
  });

  it("throws more.joinTeam.leaveErrorNotFound for TEAM_NOT_FOUND error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-xyz" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("TEAM_NOT_FOUND"),
    });

    await expect(leaveTeam("team-1")).rejects.toThrow(
      "more.joinTeam.leaveErrorNotFound",
    );
  });

  it("throws more.joinTeam.leaveErrorOwner for OWNER_CANNOT_LEAVE error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-xyz" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: makeEdgeFunctionError("OWNER_CANNOT_LEAVE"),
    });

    await expect(leaveTeam("team-1")).rejects.toThrow(
      "more.joinTeam.leaveErrorOwner",
    );
  });

  it("throws more.joinTeam.errorGeneric for unknown leave error codes", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-xyz" } },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { context: { error: "SOMETHING_ELSE" } },
    });

    await expect(leaveTeam("team-1")).rejects.toThrow(
      "more.joinTeam.errorGeneric",
    );
  });
});
