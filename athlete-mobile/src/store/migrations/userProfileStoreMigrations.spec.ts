import { STORE_VERSIONS } from "../storeVersions";
import { DEFAULT_STATE, type State } from "../userProfileStore";
import { createMigrate } from "./createMigrate";
import { userProfileStoreMigrations } from "./userProfileStoreMigrations";

const migrate = createMigrate(
  STORE_VERSIONS.USER_PROFILE,
  userProfileStoreMigrations,
  () => ({ ...DEFAULT_STATE }),
);

const oldState: Omit<State, "warnings"> = {
  personalData: { username: "anna", gender: "FEMALE", birthday: "1990-01-01" },
  anamnesisCompleted: true,
  teamId: "team-1",
  _hasHydrated: false,
};

describe("userProfileStoreMigrations: adds warnings", () => {
  it("adds warnings with the pain alert not seen to version 14 state", () => {
    expect(migrate(oldState, 14).warnings).toEqual({ painAlertSeen: false });
  });

  it("adds warnings to legacy version 13 state", () => {
    expect(migrate(oldState, 13).warnings).toEqual({ painAlertSeen: false });
  });

  it("preserves the existing profile data", () => {
    const result = migrate(oldState, 14);

    expect(result.personalData).toEqual(oldState.personalData);
    expect(result.anamnesisCompleted).toBe(true);
    expect(result.teamId).toBe("team-1");
  });

  it("does not overwrite warnings already present in state", () => {
    const stateWithWarnings: State = {
      ...oldState,
      warnings: { painAlertSeen: true },
    };

    expect(migrate(stateWithWarnings, 14).warnings).toEqual({
      painAlertSeen: true,
    });
  });
});
