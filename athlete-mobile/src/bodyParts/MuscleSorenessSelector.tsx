import { Ionicon } from "@/common/Ionicon";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type TFunction } from "i18next";
import { type FC, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { BodyPartsTagChips } from "./BodyPartsTagChips";
import { BodySilhouette } from "./silhouette/BodySilhouette";
import { regionsForTag, toMuscleTag } from "./silhouette/regionMapping";
import { type SilhouetteRegionId } from "./silhouette/types";
import { type MuscleType, type Side } from "./types";

type MuscleSorenessSelectorProps = {
  tags: MuscleType[];
  onChange?: (tags: MuscleType[]) => void;
};

type FlipSideButtonProps = {
  side: Side;
  onFlip: () => void;
};

// The accessible name sits on the touchable: the icon would otherwise expose
// its glyph name ("sync") as its own label.
const FlipSideButton: FC<FlipSideButtonProps> = ({ side, onFlip }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const label =
    side === "FRONT"
      ? t("common.bodyParts.flipToBack")
      : t("common.bodyParts.flipToFront");

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onFlip}
    >
      <Box padding="s">
        <Ionicon
          name="sync"
          size={28}
          color={theme.colors.darkGrey1}
          decorative
        />
      </Box>
    </TouchableOpacity>
  );
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
  flipButton: ReactNode;
  prompt: ReactNode;
  chips: ReactNode;
};

// One ScrollView around everything in portrait, so the figure keeps its size
// when many chips are selected. In landscape the figure is taller than the
// screen, so it gets a scrolling column of its own.
const SelectorLayout: FC<SelectorLayoutProps> = ({
  isLandscape,
  silhouetteHeight,
  figure,
  flipButton,
  prompt,
  chips,
}) => {
  // Placed over the figure. In a row beside the figure, the button would push
  // the figure off the screen center by half the button's width. It comes
  // first in the tree so screen readers reach it before the regions.
  const pinnedFlipButton = (
    <Box position="absolute" top={0} left={0} zIndex={1}>
      {flipButton}
    </Box>
  );
  return isLandscape ? (
    <Box flex={1} flexDirection="row" paddingVertical="s">
      <Box flex={1}>
        {pinnedFlipButton}
        <ScrollView>
          <Box height={silhouetteHeight} testID="soreness-figure">
            {figure}
          </Box>
        </ScrollView>
      </Box>
      <Box flex={1} paddingLeft="m">
        <ScrollView>
          {prompt}
          {chips}
        </ScrollView>
      </Box>
    </Box>
  ) : (
    <Box flex={1} paddingVertical="s">
      <ScrollView>
        {prompt}
        <Box height={silhouetteHeight} testID="soreness-figure">
          {pinnedFlipButton}
          {figure}
        </Box>
        {chips}
      </ScrollView>
    </Box>
  );
};

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

  // 60% of the longer screen side, so the regions stay as large in landscape
  // as in portrait. In portrait this leaves the first rows of chips visible
  // below the figure.
  const silhouetteHeight = Math.round(Math.max(width, height) * 0.6);

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
  const flipButton = (
    <FlipSideButton
      side={side}
      onFlip={() => setSide(side === "FRONT" ? "BACK" : "FRONT")}
    />
  );
  const prompt = (
    <Text variant="body" marginBottom="s">
      {t("common.bodyParts.whereAreAchingMuscles")}
    </Text>
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
      flipButton={flipButton}
      prompt={prompt}
      chips={chips}
    />
  );
};
