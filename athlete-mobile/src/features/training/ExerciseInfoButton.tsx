import { HeaderIconButton } from "@/common/HeaderIconButton";
import { type FC } from "react";

export type ExerciseInfoButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
};

// Web fallback: the @expo/ui Icon renders nothing on web.
export const ExerciseInfoButton: FC<ExerciseInfoButtonProps> = (props) => (
  <HeaderIconButton iconName="information-circle-outline" {...props} />
);
