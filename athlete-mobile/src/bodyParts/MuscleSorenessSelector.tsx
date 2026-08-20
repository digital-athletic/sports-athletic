import { Ionicon } from "@/common/Ionicon";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { BodyPartsTagChips } from "./BodyPartsTagChips";
import { MuscleSilhouette } from "./silhouette/MuscleSilhouette";
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
        <Ionicon name="sync" size={28} color={theme.colors.darkGrey1} />
      </Box>
    </TouchableOpacity>
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
  const { height: windowHeight } = useWindowDimensions();

  // Sized off the window (not the flex layout) so the figure stays constant
  // regardless of selections: ~60% of the screen leaves the first chip rows
  // visible above the fold.
  const silhouetteHeight = Math.round(windowHeight * 0.6);

  const selectedRegions = tags.flatMap((tag) => regionsForTag(tag, side));

  const toggleRegion = (region: SilhouetteRegionId) => {
    const tag = toMuscleTag(region, side);
    const next = tags.includes(tag)
      ? tags.filter((entry) => entry !== tag)
      : [...tags, tag];
    onChange?.(next);
  };

  const getRegionLabel = (region: SilhouetteRegionId, selected: boolean) => {
    const label = t(`muscles.${toMuscleTag(region, side)}`);
    // Web conveys the state via aria-checked; native react-native-svg drops
    // accessibilityState, so screen readers get it via the label instead.
    return selected && Platform.OS !== "web"
      ? `${label}, ${t("common.bodyParts.selected")}`
      : label;
  };

  return (
    <Box flex={1} paddingVertical="s">
      {/* The whole content scrolls so many chips never squeeze the figure. */}
      <ScrollView>
        <Text variant="body" marginBottom="s">
          {t("common.bodyParts.whereAreAchingMuscles")}
        </Text>
        <Box
          height={silhouetteHeight}
          flexDirection="row"
          alignItems="flex-start"
        >
          <FlipSideButton
            side={side}
            onFlip={() => setSide(side === "FRONT" ? "BACK" : "FRONT")}
          />
          <Box flex={1} alignSelf="stretch">
            <MuscleSilhouette
              gender={personalData.gender}
              side={side}
              selectedRegions={selectedRegions}
              onRegionPress={toggleRegion}
              getRegionLabel={getRegionLabel}
            />
          </Box>
        </Box>
        <Box testID="selected-muscles">
          <BodyPartsTagChips
            tags={tags}
            onClick={(tag) => onChange?.(tags.filter((entry) => entry !== tag))}
          />
        </Box>
      </ScrollView>
    </Box>
  );
};
