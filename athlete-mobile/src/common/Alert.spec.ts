import { Alert as RNAlert, Platform } from "react-native";
import { Alert } from "./Alert";
import { dismissCurrentAlert, getCurrentAlert } from "./alertQueue";

afterEach(() => {
  jest.restoreAllMocks();
  while (getCurrentAlert()) {
    dismissCurrentAlert();
  }
});

describe("Alert: platform routing", () => {
  it.each(["ios", "android"] as const)(
    "shows the React Native alert on %s",
    (os) => {
      jest.replaceProperty(Platform, "OS", os);
      const nativeAlert = jest
        .spyOn(RNAlert, "alert")
        .mockImplementation(() => {});
      const buttons = [{ text: "OK" }];

      Alert.alert("Title", "Message", buttons);

      expect(nativeAlert).toHaveBeenCalledWith("Title", "Message", buttons);
      expect(getCurrentAlert()).toBeNull();
    },
  );

  it("queues the alert for the AlertHost on web", () => {
    jest.replaceProperty(Platform, "OS", "web");
    const nativeAlert = jest
      .spyOn(RNAlert, "alert")
      .mockImplementation(() => {});

    Alert.alert("Title", "Message");

    expect(nativeAlert).not.toHaveBeenCalled();
    expect(getCurrentAlert()?.title).toBe("Title");
  });
});
