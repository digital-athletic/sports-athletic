import {
  dismissCurrentAlert,
  enqueueAlert,
  getCurrentAlert,
  subscribeAlerts,
  toDialogSlots,
} from "./alertQueue";

afterEach(() => {
  while (getCurrentAlert()) {
    dismissCurrentAlert();
  }
});

describe("alertQueue: queueing", () => {
  it("shows the first alert until it is dismissed, then the next one", () => {
    enqueueAlert("First");
    enqueueAlert("Second");

    expect(getCurrentAlert()?.title).toBe("First");

    dismissCurrentAlert();

    expect(getCurrentAlert()?.title).toBe("Second");

    dismissCurrentAlert();

    expect(getCurrentAlert()).toBeNull();
  });

  it("adds an OK button when no buttons are given", () => {
    enqueueAlert("Title", "Message");

    expect(getCurrentAlert()).toEqual({
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
    dismissCurrentAlert();

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

  it("falls back to an OK confirm button without buttons", () => {
    expect(toDialogSlots([])).toEqual({
      confirm: { text: "OK" },
      dismiss: undefined,
    });
  });
});
