import { useTheme } from "@/theme/theme";
import { Button, Host, Icon } from "@expo/ui";
import { type FC } from "react";
import { type ExerciseInfoButtonProps } from "./ExerciseInfoButton";

const INFO_ICON = require("../../../assets/icons/info.xml");

export const ExerciseInfoButton: FC<ExerciseInfoButtonProps> = ({
  onPress,
  accessibilityLabel,
  testID,
}) => {
  const { colors } = useTheme();

  return (
    <Host matchContents>
      <Button variant="text" onPress={onPress} testID={testID}>
        <Icon
          name={INFO_ICON}
          size={24}
          color={colors.black}
          accessibilityLabel={accessibilityLabel}
        />
      </Button>
    </Host>
  );
};
