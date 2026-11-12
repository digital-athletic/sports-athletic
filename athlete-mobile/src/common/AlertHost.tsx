import { useSyncExternalStore } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  dismissCurrentAlert,
  getCurrentAlert,
  subscribeAlerts,
} from "./alertQueue";

/** Web: draws queued alerts as a modal. Render once at app root */
export function AlertHost() {
  const current = useSyncExternalStore(subscribeAlerts, getCurrentAlert);

  if (!current) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{current.title}</Text>
          {current.message && (
            <Text style={styles.message}>{current.message}</Text>
          )}
          <View style={styles.buttons}>
            {current.buttons.map((button) => (
              <Pressable
                key={button.text}
                accessibilityRole="button"
                style={styles.button}
                onPress={() => {
                  dismissCurrentAlert();
                  button.onPress?.();
                }}
              >
                <Text style={styles.buttonText}>{button.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
