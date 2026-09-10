import { type PainRegion } from "@/features/training/utils/painUtils";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

type PainChip = {
  key: PainRegion | "HIP";
  regions: PainRegion[];
};

// Hip pain is one category for the generator (it feeds knee prevention), so a
// single chip stores both sides and keeps the lateralized contract intact.
const PAIN_CHIPS: PainChip[] = [
  { key: "SHOULDER_LEFT", regions: ["SHOULDER_LEFT"] },
  { key: "SHOULDER_RIGHT", regions: ["SHOULDER_RIGHT"] },
  { key: "ELBOW_LEFT", regions: ["ELBOW_LEFT"] },
  { key: "ELBOW_RIGHT", regions: ["ELBOW_RIGHT"] },
  { key: "WRIST_LEFT", regions: ["WRIST_LEFT"] },
  { key: "WRIST_RIGHT", regions: ["WRIST_RIGHT"] },
  { key: "SPINE", regions: ["SPINE"] },
  { key: "HIP", regions: ["HIP_LEFT", "HIP_RIGHT"] },
  { key: "KNEE_LEFT", regions: ["KNEE_LEFT"] },
  { key: "KNEE_RIGHT", regions: ["KNEE_RIGHT"] },
  { key: "ANKLE_LEFT", regions: ["ANKLE_LEFT"] },
  { key: "ANKLE_RIGHT", regions: ["ANKLE_RIGHT"] },
];

type PainChipSelectorProps = {
  tags: PainRegion[];
  onChange?: (tags: PainRegion[]) => void;
};

/**
 * Chip based selector for hurting joint regions in the anamnesis pain flow.
 * The silhouette assets only depict muscle bellies, so the joint vocabulary
 * the generator understands stays on chips until dedicated artwork exists.
 */
export const PainChipSelector: FC<PainChipSelectorProps> = ({
  tags,
  onChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const isSelected = (chip: PainChip) =>
    chip.regions.every((region) => tags.includes(region));

  const toggle = (chip: PainChip) => {
    const next = isSelected(chip)
      ? tags.filter((entry) => !chip.regions.includes(entry))
      : [...tags, ...chip.regions.filter((region) => !tags.includes(region))];
    onChange?.(next);
  };

  return (
    <Box paddingVertical="l">
      <Text variant="body" marginBottom="m">
        {t("common.bodyParts.selectHurtingParts")}
      </Text>
      <Box flexDirection="row" flexWrap="wrap">
        {PAIN_CHIPS.map((chip) => {
          const selected = isSelected(chip);
          const label = t(`muscles.${chip.key}`);
          return (
            <TouchableOpacity
              key={chip.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => toggle(chip)}
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
