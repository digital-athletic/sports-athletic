import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { type FC } from "react";
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

  const sectionToHighlight =
    activeSection !== undefined ? activeSection : calculatedActiveSection;
  const scrollOffset =
    sectionToHighlight > 0 ? sectionToHighlight * SECTION_TILE_WIDTH : 0;

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

  const sectionStartWeeks: number[] = [];
  let nextStartWeek = 1;
  for (const section of trainingSections) {
    sectionStartWeeks.push(nextStartWeek);
    nextStartWeek += section.numOfWeeks;
  }

  const sections = trainingSections.map((section, i) => (
    <TrainingSectionTile
      key={`section_${i}`}
      section={section}
      sectionIndex={i}
      weekCount={sectionStartWeeks[i]}
      isActive={sectionToHighlight === i}
      onPress={() => goToSectionDetails(i)}
    />
  ));

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
