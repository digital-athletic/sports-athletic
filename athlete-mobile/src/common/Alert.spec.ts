import { Alert as RNAlert, Platform } from "react-native";
import { Alert } from "./Alert";
import { dismissAlert, getCurrentAlert } from "./alertQueue";

afterEach(() => {
  jest.restoreAllMocks();
  for (let alert = getCurrentAlert(); alert; alert = getCurrentAlert()) {
    dismissAlert(alert);
  }
});

describe("Alert: platform routing", () => {
  it("shows the React Native alert on iOS", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const nativeAlert = jest
      .spyOn(RNAlert, "alert")
      .mockImplementation(() => {});
    const buttons = [{ text: "OK" }];

    Alert.alert("Title", "Message", buttons);

    expect(nativeAlert).toHaveBeenCalledWith("Title", "Message", buttons);
    expect(getCurrentAlert()).toBeNull();
  });

  it.each(["android", "web"] as const)(
    "queues the alert for the AlertHost on %s",
    (os) => {
      jest.replaceProperty(Platform, "OS", os);
      const nativeAlert = jest
        .spyOn(RNAlert, "alert")
        .mockImplementation(() => {});

      Alert.alert("Title", "Message");

      expect(nativeAlert).not.toHaveBeenCalled();
      expect(getCurrentAlert()?.title).toBe("Title");
    },
  );
});
