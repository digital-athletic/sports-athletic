import { useTheme } from "@/theme/theme";
import { AlertDialog, Host, Text, TextButton } from "@expo/ui/jetpack-compose";
import { useSyncExternalStore } from "react";
import { type AlertButton } from "./Alert";
import {
  dismissCurrentAlert,
  getCurrentAlert,
  subscribeAlerts,
  toDialogSlots,
} from "./alertQueue";

// React Native alerts on Android are not cancelable by default, and callers
// rely on a button callback running.
const DIALOG_PROPERTIES = {
  dismissOnClickOutside: false,
  dismissOnBackPress: false,
};

/** Android: draws queued alerts as a Material 3 dialog. Render once at app root */
export function AlertHost() {
  const current = useSyncExternalStore(subscribeAlerts, getCurrentAlert);
  const { colors } = useTheme();

  const press = (button: AlertButton) => {
    dismissCurrentAlert();
    button.onPress?.();
  };

  const renderButton = (button: AlertButton) => (
    <TextButton
      colors={
        button.style === "destructive"
          ? { contentColor: colors.error }
          : undefined
      }
      onClick={() => press(button)}
    >
      <Text>{button.text}</Text>
    </TextButton>
  );

  const slots = current ? toDialogSlots(current.buttons) : null;

  // The app has a light design only, so the dialog ignores the device dark mode.
  return (
    <Host matchContents colorScheme="light">
      {current && slots && (
        <AlertDialog properties={DIALOG_PROPERTIES}>
          <AlertDialog.Title>
            <Text>{current.title}</Text>
          </AlertDialog.Title>
          {current.message && (
            <AlertDialog.Text>
              <Text>{current.message}</Text>
            </AlertDialog.Text>
          )}
          <AlertDialog.ConfirmButton>
            {renderButton(slots.confirm)}
          </AlertDialog.ConfirmButton>
          {slots.dismiss && (
            <AlertDialog.DismissButton>
              {renderButton(slots.dismiss)}
            </AlertDialog.DismissButton>
          )}
        </AlertDialog>
      )}
    </Host>
  );
}
