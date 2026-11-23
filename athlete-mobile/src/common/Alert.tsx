import { Alert as RNAlert, Platform } from "react-native";
import { enqueueAlert } from "./alertQueue";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

/** iOS and Android show the native alert; web is drawn by AlertHost */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== "web") {
      RNAlert.alert(title, message, buttons);
    } else {
      enqueueAlert(title, message, buttons);
    }
  },
};
