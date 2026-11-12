import { liveRegionProps } from "@/common/announce";
import { AppIcon } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { ActivityIndicator } from "react-native";
import IconCircle from "@tabler/icons-react-native/IconCircle";
import IconCircleCheckFilled from "@tabler/icons-react-native/IconCircleCheckFilled";

type GeneratingStagesProps = {
  stages: readonly string[];
  /** Index of the stage that runs now. The stages before it are done. */
  activeIndex: number;
};

const StageMark: FC<{ done: boolean; active: boolean }> = ({
  done,
  active,
}) => {
  const { colors } = useTheme();

  if (active) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }
  return (
    <AppIcon
      icon={done ? IconCircleCheckFilled : IconCircle}
      size={24}
      color={done ? colors.primary : colors.outline}
      decorative
    />
  );
};

/** Checklist of the plan generation: done, running and upcoming stages. */
export const GeneratingStages: FC<GeneratingStagesProps> = ({
  stages,
  activeIndex,
}) => (
  <Box
    gap="m"
    padding="l"
    borderRadius="xl"
    borderWidth={1.5}
    borderColor="outlineVariant"
    alignSelf="stretch"
  >
    {stages.map((stage, index) => {
      const active = index === activeIndex;
      return (
        <Box key={stage} flexDirection="row" alignItems="center" gap="m">
          <Box width={24} height={24} justifyContent="center">
            <StageMark done={index < activeIndex} active={active} />
          </Box>
          <Box flex={1}>
            <Text
              variant="body"
              fontWeight={active ? "600" : "400"}
              color={index > activeIndex ? "onSurfaceVariant" : "onSurface"}
              {...(active ? liveRegionProps : {})}
            >
              {stage}
            </Text>
          </Box>
        </Box>
      );
    })}
  </Box>
);
