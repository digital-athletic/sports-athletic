import { SegmentedControl } from "@/form/SegmentedControl";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { type TFunction } from "i18next";
import { type FC, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, useWindowDimensions } from "react-native";
import { BodyPartsTagChips } from "./BodyPartsTagChips";
import { BodySilhouette } from "./silhouette/BodySilhouette";
import { regionsForTag, toMuscleTag } from "./silhouette/regionMapping";
import { type SilhouetteRegionId } from "./silhouette/types";
import { type MuscleType, type Side } from "./types";

type MuscleSorenessSelectorProps = {
  tags: MuscleType[];
  onChange?: (tags: MuscleType[]) => void;
};

// Web conveys the state via aria-checked; native react-native-svg drops
// accessibilityState, so screen readers get it via the label instead.
function regionLabel(
  t: TFunction,
  side: Side,
  region: SilhouetteRegionId,
  selected: boolean,
): string {
  const label = t(`muscles.${toMuscleTag(region, side)}`);
  return selected && Platform.OS !== "web"
    ? `${label}, ${t("common.bodyParts.selected")}`
    : label;
}

type SelectorLayoutProps = {
  isLandscape: boolean;
  silhouetteHeight: number;
  figure: ReactNode;
  sideToggle: ReactNode;
  chips: ReactNode;
};

// The screen around the selector scrolls, so the figure keeps its size when
// many chips are selected. In landscape the chips sit beside the figure.
const SelectorLayout: FC<SelectorLayoutProps> = ({
  isLandscape,
  silhouetteHeight,
  figure,
  sideToggle,
  chips,
}) => (
  <Box flexDirection={isLandscape ? "row" : "column"} gap="m">
    <Box flex={isLandscape ? 1 : undefined} gap="m">
      {sideToggle}
      <Card
        variant="outlined"
        backgroundColor="surfaceContainerLow"
        overflow="hidden"
      >
        <Box height={silhouetteHeight} padding="m" testID="soreness-figure">
          {figure}
        </Box>
      </Card>
    </Box>
    <Box flex={isLandscape ? 1 : undefined}>{chips}</Box>
  </Box>
);

/**
 * Soreness selection on a touchable, gender-aware body silhouette with a
 * front/back toggle. Emits lateralized MuscleType values (left biceps stays
 * left); tags outside the silhouette vocabulary (legacy persisted values)
 * pass through untouched.
 */
export const MuscleSorenessSelector: FC<MuscleSorenessSelectorProps> = ({
  tags,
  onChange,
}) => {
  const { t } = useTranslation();
  const { personalData } = useUserProfileStore();
  const [side, setSide] = useState<Side>("FRONT");
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Half of the longer screen side, so the regions stay as large in landscape
  // as in portrait.
  const silhouetteHeight = Math.round(Math.max(width, height) * 0.5);

  const selectedRegions = tags.flatMap((tag) => regionsForTag(tag, side));

  const toggleRegion = (region: SilhouetteRegionId) => {
    const tag = toMuscleTag(region, side);
    const next = tags.includes(tag)
      ? tags.filter((entry) => entry !== tag)
      : [...tags, tag];
    onChange?.(next);
  };

  const figure = (
    <BodySilhouette
      gender={personalData.gender}
      side={side}
      highlights={[{ regions: selectedRegions, color: "primary" }]}
      width="100%"
      height="100%"
      testID="muscle-silhouette"
      regionTestIDPrefix="silhouette-region-"
      onRegionPress={toggleRegion}
      getRegionLabel={(region, selected) =>
        regionLabel(t, side, region, selected)
      }
    />
  );
  const sideToggle = (
    <SegmentedControl<Side>
      accessibilityLabel={t("common.bodyParts.side")}
      value={side}
      onChange={setSide}
      options={[
        { value: "FRONT", label: t("common.bodyParts.front") },
        { value: "BACK", label: t("common.bodyParts.back") },
      ]}
    />
  );
  const chips = (
    <Box testID="selected-muscles">
      <BodyPartsTagChips
        tags={tags}
        onClick={(tag) => onChange?.(tags.filter((entry) => entry !== tag))}
      />
    </Box>
  );

  return (
    <SelectorLayout
      isLandscape={isLandscape}
      silhouetteHeight={silhouetteHeight}
      figure={figure}
      sideToggle={sideToggle}
      chips={chips}
    />
  );
};
