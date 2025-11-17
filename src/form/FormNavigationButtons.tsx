import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { type FC } from "react";
import { StyleSheet } from "react-native";

interface FormNavigationButtonsProps {
  back: () => void;
  backText: string;
  forward: () => void;
  forwardText: string;
}

/**
 * Form navigation buttons (back/forward)
 */
export const FormNavigationButtons: FC<FormNavigationButtonsProps> = ({
  back,
  backText,
  forward,
  forwardText,
}) => {
  return (
    <Box flexDirection="row" flex={1}>
      <Box flex={1}>
        <Button variant="secondary" onPress={back} style={styles.button}>
          {backText}
        </Button>
      </Box>
      <Box flex={1}>
        <Button variant="primary" onPress={forward} style={styles.button}>
          {forwardText}
        </Button>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 0,
  },
});
