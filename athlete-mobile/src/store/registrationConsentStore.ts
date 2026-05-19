import { create } from "zustand";

type RegistrationConsent = {
  analyticsAccepted: boolean;
  termsAccepted: boolean;
};

type RegistrationConsentState = {
  pendingConsent: RegistrationConsent | null;
  setPendingConsent: (consent: RegistrationConsent) => void;
  clearPendingConsent: () => void;
};

// Non-persisted, in-memory only — prevents URL param manipulation from bypassing consent UI.
export const useRegistrationConsentStore = create<RegistrationConsentState>()(
  (set, get) => ({
    pendingConsent: null,
    setPendingConsent: (consent) => set({ pendingConsent: consent }),
    clearPendingConsent: () => {
      if (get().pendingConsent !== null) {
        set({ pendingConsent: null });
      }
    },
  }),
);
