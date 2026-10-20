import { act } from "@testing-library/react-native";
import { useUserProfileStore } from "./userProfileStore";

const store = () => useUserProfileStore.getState();

beforeEach(() => {
  act(() => store().resetProfile());
});

describe("userProfileStore", () => {
  it("starts with an empty male profile", () => {
    expect(store().personalData.username).toBe("");
    expect(store().personalData.gender).toBe("MALE");
  });

  it("has no measurements before they are set", () => {
    expect(
      store().personalData.height ?? store().personalData.weight,
    ).toBeUndefined();
  });

  it("stores height through its setter", () => {
    act(() => store().setHeight(182));
    expect(store().personalData.height).toBe(182);
  });

  it("stores weight through its setter", () => {
    act(() => store().setWeight(78));
    expect(store().personalData.weight).toBe(78);
  });

  it("merges partial patches over existing data", () => {
    act(() => store().setPersonalData({ gender: "FEMALE" }));
    expect(store().personalData.gender).toBe("FEMALE");
  });

  it("clears measurements on reset", () => {
    act(() => {
      store().setWeight(90);
      store().resetProfile();
    });
    expect(store().personalData.weight).toBeUndefined();
  });

  it("keeps the hydration flag across a reset", () => {
    act(() => {
      store().setHasHydrated(true);
      store().resetProfile();
    });
    expect(store()._hasHydrated).toBe(true);
  });

  it("starts with the pain alert not seen", () => {
    expect(store().warnings).toEqual({ painAlertSeen: false });
  });

  it("marks a warning as seen through its setter", () => {
    act(() => store().setWarningSeen("painAlertSeen", true));
    expect(store().warnings.painAlertSeen).toBe(true);
  });

  it("marks a seen warning as unseen again", () => {
    act(() => {
      store().setWarningSeen("painAlertSeen", true);
      store().setWarningSeen("painAlertSeen", false);
    });
    expect(store().warnings.painAlertSeen).toBe(false);
  });

  it("clears seen warnings on reset", () => {
    act(() => {
      store().setWarningSeen("painAlertSeen", true);
      store().resetProfile();
    });
    expect(store().warnings.painAlertSeen).toBe(false);
  });

  it("derives age in whole years from the birthday", () => {
    const today = new Date();
    const year = today.getFullYear() - 28;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    act(() => store().setBirthday(`${year}-${month}-${day}`));
    expect(store().getAge()).toBe(28);
  });
});
