import { Alert as RNAlert, Platform } from "react-native";
import { enqueueAlert } from "./alertQueue";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

/** iOS shows the native alert; Android and web are drawn by AlertHost */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS === "ios") {
      RNAlert.alert(title, message, buttons);
    } else {
      enqueueAlert(title, message, buttons);
    }
  },
};
