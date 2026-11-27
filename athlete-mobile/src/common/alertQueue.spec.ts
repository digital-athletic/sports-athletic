import {
  type AlertRequest,
  dismissAlert,
  enqueueAlert,
  getCurrentAlert,
  subscribeAlerts,
  toDialogSlots,
} from "./alertQueue";

afterEach(() => {
  for (let alert = getCurrentAlert(); alert; alert = getCurrentAlert()) {
    dismissAlert(alert);
  }
});

function requireCurrentAlert(): AlertRequest {
  const alert = getCurrentAlert();
  if (!alert) throw new Error("No alert is shown");
  return alert;
}

describe("alertQueue: queueing", () => {
  it("shows the first alert until it is dismissed, then the next one", () => {
    enqueueAlert("First");
    enqueueAlert("Second");

    expect(getCurrentAlert()?.title).toBe("First");

    expect(dismissAlert(requireCurrentAlert())).toBe(true);

    expect(getCurrentAlert()?.title).toBe("Second");

    dismissAlert(requireCurrentAlert());

    expect(getCurrentAlert()).toBeNull();
  });

  it("keeps the next alert when a closed alert is dismissed again", () => {
    enqueueAlert("First");
    enqueueAlert("Second");
    const first = requireCurrentAlert();

    dismissAlert(first);

    expect(dismissAlert(first)).toBe(false);
    expect(getCurrentAlert()?.title).toBe("Second");
  });

  it("adds an OK button when no buttons are given", () => {
    enqueueAlert("Title", "Message");

    expect(getCurrentAlert()).toEqual({
      id: expect.any(Number),
      title: "Title",
      message: "Message",
      buttons: [{ text: "OK" }],
    });
  });

  it("notifies subscribers until they unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeAlerts(listener);

    enqueueAlert("Title");
    unsubscribe();
    dismissAlert(requireCurrentAlert());

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("alertQueue: toDialogSlots", () => {
  it("puts a single button into the confirm slot", () => {
    const ok = { text: "OK" };

    expect(toDialogSlots([ok])).toEqual({ confirm: ok, dismiss: undefined });
  });

  it("puts the last button into confirm and the one before into dismiss", () => {
    const cancel = { text: "Cancel", style: "cancel" as const };
    const remove = { text: "Delete", style: "destructive" as const };

    expect(toDialogSlots([cancel, remove])).toEqual({
      confirm: remove,
      dismiss: cancel,
    });
  });

  it("puts the first of three buttons into the neutral slot", () => {
    const later = { text: "Later" };
    const cancel = { text: "Cancel", style: "cancel" as const };
    const save = { text: "Save" };

    expect(toDialogSlots([later, cancel, save])).toEqual({
      confirm: save,
      dismiss: cancel,
      neutral: later,
    });
  });

  it("drops every button after the third, like React Native on Android", () => {
    const later = { text: "Later" };
    const cancel = { text: "Cancel" };
    const save = { text: "Save" };
    const extra = { text: "Extra" };

    expect(toDialogSlots([later, cancel, save, extra])).toEqual({
      confirm: save,
      dismiss: cancel,
      neutral: later,
    });
  });

  it("falls back to an OK confirm button without buttons", () => {
    expect(toDialogSlots([])).toEqual({
      confirm: { text: "OK" },
      dismiss: undefined,
    });
  });
});
