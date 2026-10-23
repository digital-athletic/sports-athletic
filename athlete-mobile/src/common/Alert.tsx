import { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert as RNAlert,
  Platform,
  type AlertOptions,
} from "react-native";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (state: AlertState) => void;

const initialState: AlertState = {
  visible: false,
  title: "",
  message: undefined,
  buttons: [],
};

let currentState = initialState;
let listener: Listener | null = null;

function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  currentState = {
    visible: true,
    title,
    message,
    buttons: buttons || [{ text: "OK" }],
  };
  listener?.(currentState);
}

function hideAlert() {
  currentState = { ...currentState, visible: false };
  listener?.(currentState);
}

/** Render this once at app root for web alert support */
export function AlertHost() {
  const [state, setState] = useState(currentState);

  useEffect(() => {
    listener = setState;
    return () => {
      listener = null;
    };
  }, []);

  if (!state.visible) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{state.title}</Text>
          {state.message && <Text style={styles.message}>{state.message}</Text>}
          <View style={styles.buttons}>
            {state.buttons.map((btn, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                style={styles.button}
                onPress={() => {
                  hideAlert();
                  btn.onPress?.();
                }}
              >
                <Text style={styles.buttonText}>{btn.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const Alert = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) {
    if (Platform.OS === "web") {
      showAlert(title, message, buttons);
    } else {
      RNAlert.alert(title, message, buttons, options);
    }
  },
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    minWidth: 250,
    maxWidth: 300,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  button: {
    backgroundColor: "#e5e5e5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
  },
});
