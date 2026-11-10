import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { type TrainingSectionType } from "./models/TrainingSection";
import { SectionWeekBars } from "./SectionWeekBars";
import { getPassedWeeksSinceDate } from "./utils/timeUtils";
import { getIntensityForSection } from "./utils/trainingSectionUtils";

export const SECTION_TILE_WIDTH = 132;
// The bars and the label split the tile height, so the tile needs its own.
const SECTION_TILE_HEIGHT = 160;

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
      height={SECTION_TILE_HEIGHT}
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="m"
      paddingTop="m"
      paddingBottom="xs"
      marginRight="m"
      onPress={onPress}
      backgroundColor={isActive ? "primaryTint" : "white"}
      borderRadius="l"
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
      >
        <Text
          variant="xSmall"
          textAlign="center"
          mt="s"
          fontWeight={isActive ? "700" : "400"}
          color={isActive ? "primary" : "darkGrey3"}
        >
          {t(`training.sections.${section.type}`)}
        </Text>
      </Box>
    </TouchableBox>
  );
};
