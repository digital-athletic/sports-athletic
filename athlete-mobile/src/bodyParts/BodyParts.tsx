import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { type BodyPartType, type MuscleType } from "./types";

// Curated regions shown as selectable chips. Each value is a MuscleType the
// generator recognises via getAreasFor, so selections still drive soreness
// filtering without the proprietary body diagram.
const SELECTABLE_REGIONS: MuscleType[] = [
  "NECK",
  "CHEST",
  "UPPER_BACK",
  "SHOULDER_FRONT",
  "RECTUS_ABDOMINIS",
  "OBLIQUES",
  "LOWER_BACK",
  "GLUTES",
  "HAMSTRINGS",
  "ADDUCTORS",
  "ABDUCTORS",
  "CALVES",
  "SHIN",
];

type BodyPartsProps = {
  type: BodyPartType;
  tags: MuscleType[];
  onChange?: (tags: string[]) => void;
};

/**
 * Chip based stand in for the proprietary body diagram removed for the OSS
 * release. Users pick sore or hurting regions from labelled chips instead of
 * tapping an SVG; the resulting tags feed the generator exactly as before.
 */
export const BodyParts: FC<BodyPartsProps> = ({ type, tags, onChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const toggle = (tag: MuscleType) => {
    const next = tags.includes(tag)
      ? tags.filter((entry) => entry !== tag)
      : [...tags, tag];
    onChange?.(next);
  };

  const coaching =
    type === "PAIN"
      ? t("common.bodyParts.selectHurtingParts")
      : t("common.bodyParts.whereAreAchingMuscles");

  return (
    <Box paddingVertical="l">
      <Text variant="body" marginBottom="m">
        {coaching}
      </Text>
      <Box flexDirection="row" flexWrap="wrap">
        {SELECTABLE_REGIONS.map((tag) => {
          const selected = tags.includes(tag);
          const label = t(`muscles.${tag}`);
          return (
            <TouchableOpacity
              key={tag}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => toggle(tag)}
              style={{
                backgroundColor: selected
                  ? theme.colors.primary
                  : theme.colors.lightGrey2,
                paddingHorizontal: theme.spacing.l,
                paddingVertical: theme.spacing.s,
                marginRight: theme.spacing.s,
                marginBottom: theme.spacing.s,
                borderRadius: theme.borderRadii.l,
              }}
            >
              <Text variant="body" color={selected ? "white" : "darkGrey3"}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Box>
    </Box>
  );
};
