import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  calculateUserLevel,
  getXpForNextLevel,
  getXpInLevel,
} from "./utils/userProgressUtils";

interface LevelProgressProps {
  startValue: number;
  endValue: number;
  onClose: () => void;
}

/**
 * Level Progress Overlay
 *
 * Displays XP progression and level-up animation after completing a workout.
 * Shows the user's current level, XP progress within the level, and animates
 * the transition from start to end values.
 *
 * Legacy: components/LevelProgress
 */
export const LevelProgress: FC<LevelProgressProps> = ({
  startValue,
  endValue,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [value, setValue] = useState(() => getXpInLevel(startValue));
  const [level, setLevel] = useState(() => calculateUserLevel(startValue));
  const [levelMax, setLevelMax] = useState(() => getXpForNextLevel(startValue));

  // Reset to the start values whenever a new start/end pair comes in.
  const [prevProps, setPrevProps] = useState({ startValue, endValue });
  if (prevProps.startValue !== startValue || prevProps.endValue !== endValue) {
    setPrevProps({ startValue, endValue });
    setValue(getXpInLevel(startValue));
    setLevel(calculateUserLevel(startValue));
    setLevelMax(getXpForNextLevel(startValue));
  }

  const elementHeight = useResponsiveProp({ phone: 48, tablet: 56 }) ?? 48;
  const fontSize = useResponsiveProp({ phone: 16, tablet: 18 });

  useEffect(() => {
    // TODO: Animate to end values after 2 seconds
    const timer = setTimeout(() => {
      const endXpInLevel = getXpInLevel(endValue);
      const endLevel = calculateUserLevel(endValue);
      const endLevelMax = getXpForNextLevel(endValue);

      setValue(endXpInLevel);
      setLevel(endLevel);
      setLevelMax(endLevelMax);
    }, 2000);

    return () => clearTimeout(timer);
  }, [startValue, endValue]);

  return (
    <Box
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      backgroundColor="overlay"
      justifyContent="center"
      alignItems="stretch"
    >
      <Box
        flex={1}
        marginVertical="xxl"
        marginHorizontal="m"
        padding="m"
        borderRadius="m"
        backgroundColor="white"
        justifyContent="center"
        alignItems="stretch"
      >
        {/* Progress Container */}
        <Box flex={6} justifyContent="center" alignItems="stretch">
          {/* Congratulations Text */}
          <Box justifyContent="center" alignItems="center" marginBottom="m">
            <Text
              variant="body"
              fontSize={fontSize}
              style={{ color: colors.darkGrey3 }}
            >
              {t("common.levelProgress.congratulations")}
            </Text>
          </Box>

          {/* XP Progress */}
          <Box justifyContent="center" alignItems="center" marginBottom="m">
            <Text
              variant="body"
              fontSize={fontSize}
              style={{ color: colors.darkGrey3 }}
            >
              {value} / {levelMax}
            </Text>
          </Box>

          {/* Level Display */}
          <Box justifyContent="center" alignItems="center" marginBottom="m">
            <Text
              variant="body"
              fontSize={fontSize}
              style={{ color: colors.darkGrey3 }}
            >
              {t("common.levelProgress.level", { level })}
            </Text>
          </Box>

          {/* Progress Bar */}
          <Box
            position="relative"
            height={elementHeight}
            borderRadius="m"
            borderWidth={1}
            borderColor="darkGrey1"
            flexDirection="row"
          >
            {/* Filled Portion */}
            <Box
              flex={value}
              height={elementHeight - 2} // Account for border
              borderTopLeftRadius="m"
              borderBottomLeftRadius="m"
              backgroundColor="primary"
            />

            {/* Empty Portion */}
            <Box
              flex={levelMax - value}
              height={elementHeight - 2}
              borderTopRightRadius="m"
              borderBottomRightRadius="m"
              backgroundColor="transparent"
            />
          </Box>
        </Box>

        {/* Close Button Container */}
        <Box flex={1} justifyContent="flex-end" alignItems="stretch">
          <Button onPress={onClose}>{t("common.levelProgress.close")}</Button>
        </Box>
      </Box>
    </Box>
  );
};
