import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTranslation } from "react-i18next";
import { ScaleType } from "../models/WorkoutsData";

type Props = {
  scale: ScaleType;
  isActive: boolean;
  setScale: (scale: ScaleType) => void;
};

export const ScaleButton: React.FC<Props> = ({ isActive, scale, setScale }) => {
  const borderColor = isActive ? "primary" : ("lightGrey3" as const);
  const { t } = useTranslation();

  return (
    <TouchableBox
      onPress={() => setScale(scale)}
      accessibilityLabel={t(`statistics.workouts.scales.${scale}`)}
      accessibilityRole="button"
      marginRight={scale !== "total" ? "s" : "none"}
      borderColor={borderColor}
      borderRadius="m"
      borderWidth={1}
      padding="s"
      alignItems="center"
      justifyContent="center"
      alignSelf="stretch"
      flex={1}
    >
      <Text variant="small" textAlign="center" color={borderColor}>
        {t(`statistics.workouts.scales.${scale}`)}
      </Text>
    </TouchableBox>
  );
};
