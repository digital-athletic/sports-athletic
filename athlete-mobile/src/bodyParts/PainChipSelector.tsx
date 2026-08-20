import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { type MuscleType } from "./types";

// Curated regions shown as selectable chips. Each value is a MuscleType the
// generator recognises via getAreasFor, so selections still drive pain
// filtering without a body diagram.
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

type PainChipSelectorProps = {
  tags: MuscleType[];
  onChange?: (tags: MuscleType[]) => void;
};

/**
 * Chip based selector for hurting body regions, kept for the anamnesis pain
 * flow. The silhouette assets only depict muscle bellies, so the joint-region
 * pain vocabulary stays on chips until dedicated artwork exists.
 */
export const PainChipSelector: FC<PainChipSelectorProps> = ({
  tags,
  onChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const toggle = (tag: MuscleType) => {
    const next = tags.includes(tag)
      ? tags.filter((entry) => entry !== tag)
      : [...tags, tag];
    onChange?.(next);
  };

  return (
    <Box paddingVertical="l">
      <Text variant="body" marginBottom="m">
        {t("common.bodyParts.selectHurtingParts")}
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
