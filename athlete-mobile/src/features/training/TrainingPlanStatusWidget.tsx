import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { type FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useActiveSectionIndex } from "./hooks";
import { type TrainingSectionType } from "./models/TrainingSection";
import { SectionLegend } from "./SectionLegend";
import { TrainingSectionTile } from "./TrainingSectionTile";

// Design constants from legacy - match original dimensions
const SECTION_TILE_WIDTH = 120; // Matches DesignConstants.SIZES.SECTION_TILE_WIDTH for narrow screens

interface TrainingPlanStatusWidgetProps {
  trainingSections: TrainingSectionType[];
  seasonPhase?: string; // currently not used
  goToSectionDetails: (sectionIndex: number) => void;
  activeSection?: number;
}

export const TrainingPlanStatusWidget: FC<TrainingPlanStatusWidgetProps> = ({
  trainingSections,
  goToSectionDetails,
  activeSection,
}) => {
  const { t } = useTranslation();
  const calculatedActiveSection = useActiveSectionIndex(trainingSections);

  const scrollOffset = useMemo(() => {
    const sectionToHighlight =
      activeSection !== undefined ? activeSection : calculatedActiveSection;
    return sectionToHighlight > 0 ? sectionToHighlight * SECTION_TILE_WIDTH : 0;
  }, [activeSection, calculatedActiveSection]);

  if (trainingSections.length === 0) {
    return (
      <Box
        width={SECTION_TILE_WIDTH}
        justifyContent="center"
        alignItems="center"
        alignSelf="stretch"
        padding="s"
        backgroundColor="white"
      >
        <Text variant="small">{t("training.status.noSections")}</Text>
      </Box>
    );
  }

  const sections: React.ReactElement[] = [];
  let weekCount = 1;

  for (let i = 0; i < trainingSections.length; i++) {
    const isActive =
      (activeSection !== undefined
        ? activeSection
        : calculatedActiveSection) === i;
    sections.push(
      <TrainingSectionTile
        key={`section_${i}`}
        section={trainingSections[i]}
        sectionIndex={i}
        weekCount={weekCount}
        isActive={isActive}
        onPress={() => goToSectionDetails(i)}
      />,
    );
    weekCount += trainingSections[i].numOfWeeks;
  }

  return (
    <ScrollBox
      flex={1}
      contentContainerStyle={{ paddingVertical: 5 }}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: scrollOffset, y: 0 }}
    >
      <SectionLegend />
      {sections}
    </ScrollBox>
  );
};
