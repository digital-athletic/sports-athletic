import { useTheme } from "@/theme/theme";
import {
  AlertDialog,
  Host,
  Row,
  Text,
  TextButton,
} from "@expo/ui/jetpack-compose";
import { useSyncExternalStore } from "react";
import { type AlertButton } from "./Alert";
import {
  type AlertRequest,
  dismissAlert,
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

// Gap between dialog buttons in Material 3
const BUTTON_SPACING = 8;

/** Android: draws queued alerts as a Material 3 dialog. Render once at app root */
export function AlertHost() {
  const current = useSyncExternalStore(subscribeAlerts, getCurrentAlert);
  const { colors } = useTheme();

  // A second tap before the dialog closes must not close the next queued alert
  const press = (request: AlertRequest, button: AlertButton) => {
    if (dismissAlert(request)) {
      button.onPress?.();
    }
  };

  const renderButton = (request: AlertRequest, button: AlertButton) => (
    <TextButton
      colors={
        button.style === "destructive"
          ? { contentColor: colors.error }
          : undefined
      }
      onClick={() => press(request, button)}
    >
      <Text>{button.text}</Text>
    </TextButton>
  );

  const slots = current ? toDialogSlots(current.buttons) : null;

  // The app has a light design only, so the dialog ignores the device dark mode.
  return (
    <Host matchContents colorScheme="light">
      {current && slots && (
        // A fresh dialog per alert, so a late tap reaches the closed one
        <AlertDialog key={current.id} properties={DIALOG_PROPERTIES}>
          <AlertDialog.Title>
            <Text>{current.title}</Text>
          </AlertDialog.Title>
          {current.message && (
            <AlertDialog.Text>
              <Text>{current.message}</Text>
            </AlertDialog.Text>
          )}
          <AlertDialog.ConfirmButton>
            {renderButton(current, slots.confirm)}
          </AlertDialog.ConfirmButton>
          {slots.dismiss && (
            <AlertDialog.DismissButton>
              {slots.neutral ? (
                <Row horizontalArrangement={{ spacedBy: BUTTON_SPACING }}>
                  {renderButton(current, slots.neutral)}
                  {renderButton(current, slots.dismiss)}
                </Row>
              ) : (
                renderButton(current, slots.dismiss)
              )}
            </AlertDialog.DismissButton>
          )}
        </AlertDialog>
      )}
    </Host>
  );
}
