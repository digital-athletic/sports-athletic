import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { type TrainingSectionType } from "./models/TrainingSection";
import { SectionWeekBars } from "./SectionWeekBars";
import { getPassedWeeksSinceDate } from "./utils/timeUtils";
import { getIntensityForSection } from "./utils/trainingSectionUtils";

const SECTION_TILE_WIDTH = 120;

interface TrainingSectionTileProps {
  section: TrainingSectionType;
  sectionIndex: number;
  weekCount: number;
  isActive: boolean;
  onPress: () => void;
}

export const TrainingSectionTile: FC<TrainingSectionTileProps> = ({
  section,
  sectionIndex,
  weekCount,
  isActive,
  onPress,
}) => {
  const { t } = useTranslation();
  const weeksPassed = getPassedWeeksSinceDate(section.start);
  const intensity = getIntensityForSection(section.type);

  return (
    <TouchableBox
      width={SECTION_TILE_WIDTH}
      justifyContent="center"
      alignItems="center"
      padding="s"
      marginRight="m"
      onPress={onPress}
      backgroundColor="white"
      shadowColor="black"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={3}
    >
      <Box flex={3} justifyContent="center" alignSelf="stretch">
        <SectionWeekBars
          sectionWeeksCount={section.numOfWeeks}
          startWeek={weekCount}
          sectionIndex={sectionIndex}
          activeWeek={weeksPassed}
          intensity={intensity}
        />
      </Box>
      <Box
        flex={1}
        justifyContent="center"
        alignSelf="stretch"
        paddingVertical="s"
        borderBottomColor={isActive ? "primary" : undefined}
        borderBottomWidth={2}
      >
        <Text variant="xSmall" textAlign="center" mt="s">
          {t(`training.sections.${section.type}`)}
        </Text>
      </Box>
    </TouchableBox>
  );
};
