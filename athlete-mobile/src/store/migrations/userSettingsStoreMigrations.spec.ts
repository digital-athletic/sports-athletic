import type { State } from "../userSettingsStore";
import { userSettingsStoreMigrations } from "./userSettingsStoreMigrations";

type StateWithoutConsent = Omit<State, "consentStatus">;

describe("userSettingsStoreMigrations", () => {
  describe("v14 → v15: adds consentStatus", () => {
    it("adds consentStatus: loading to state without it", () => {
      const oldState: StateWithoutConsent = {
        reviewStatus: { hasReviewed: false, promptCount: 0 },
        anonymisedDataUse: false,
      };

      const result = userSettingsStoreMigrations[14](oldState as State);

      expect(result.consentStatus).toBe("loading");
    });

    it("preserves existing reviewStatus and anonymisedDataUse", () => {
      const oldState: StateWithoutConsent = {
        reviewStatus: {
          hasReviewed: true,
          lastPromptDate: "2024-01-01",
          promptCount: 2,
        },
        anonymisedDataUse: true,
      };

      const result = userSettingsStoreMigrations[14](oldState as State);

      expect(result.reviewStatus).toEqual(oldState.reviewStatus);
      expect(result.anonymisedDataUse).toBe(true);
    });

    it("does not overwrite consentStatus when already present in state", () => {
      const stateWithConsent: State = {
        reviewStatus: { hasReviewed: false, promptCount: 0 },
        anonymisedDataUse: false,
        consentStatus: "accepted",
      };

      const result = userSettingsStoreMigrations[14](stateWithConsent);

      expect(result.consentStatus).toBe("accepted");
    });
  });
});
