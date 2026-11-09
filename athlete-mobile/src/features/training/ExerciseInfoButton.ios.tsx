import { useTheme } from "@/theme/theme";
import { Button, Host, Icon } from "@expo/ui";
import { accessibilityLabel as a11yLabel } from "@expo/ui/swift-ui/modifiers";
import { type FC } from "react";
import { type ExerciseInfoButtonProps } from "./ExerciseInfoButton";

export const ExerciseInfoButton: FC<ExerciseInfoButtonProps> = ({
  onPress,
  accessibilityLabel,
  testID,
}) => {
  const { colors } = useTheme();

  return (
    <Host matchContents>
      <Button
        variant="text"
        onPress={onPress}
        testID={testID}
        modifiers={[a11yLabel(accessibilityLabel)]}
      >
        <Icon name="info.circle" size={24} color={colors.black} />
      </Button>
    </Host>
  );
};
