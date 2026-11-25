import { useTheme } from "@/theme/theme";
import { useSyncExternalStore } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { dismissAlert, getCurrentAlert, subscribeAlerts } from "./alertQueue";

/** Web: draws queued alerts as a modal. Render once at app root */
export function AlertHost() {
  const current = useSyncExternalStore(subscribeAlerts, getCurrentAlert);
  const { colors } = useTheme();

  if (!current) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.scrim,
            { backgroundColor: colors.scrim },
          ]}
        />
        <View
          key={current.id}
          style={[
            styles.dialog,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {current.title}
          </Text>
          {current.message && (
            <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
              {current.message}
            </Text>
          )}
          <View style={styles.buttons}>
            {current.buttons.map((button) => (
              <Pressable
                key={button.text}
                accessibilityRole="button"
                style={[
                  styles.button,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
                onPress={() => {
                  if (dismissAlert(current)) {
                    button.onPress?.();
                  }
                }}
              >
                <Text style={[styles.buttonText, { color: colors.onSurface }]}>
                  {button.text}
                </Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  scrim: {
    opacity: 0.5,
  },
  dialog: {
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
    textAlign: "center",
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  button: {
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
