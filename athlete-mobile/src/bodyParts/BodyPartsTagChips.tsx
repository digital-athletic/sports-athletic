import { AppIcon } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableWithoutFeedback } from "react-native";
import { MuscleType } from "./types";
import IconCircleXFilled from "@tabler/icons-react-native/IconCircleXFilled";

type BodyPartsTagChipsProps = {
  tags: MuscleType[];
  onClick?: (tag: MuscleType) => void;
};

export const BodyPartsTagChips: FC<BodyPartsTagChipsProps> = ({
  tags,
  onClick,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const renderTag = (tag: MuscleType) => (
    <TouchableWithoutFeedback
      key={`tag_${tag}`}
      // Read-only usages (e.g. exercise info) must not announce as buttons.
      accessibilityRole={onClick ? "button" : undefined}
      accessibilityLabel={t(`muscles.${tag}`)}
      onPress={() => onClick?.(tag)}
      disabled={!onClick}
    >
      <Box
        flexDirection="row"
        alignItems="center"
        gap="xs"
        minHeight={36}
        paddingLeft="m"
        paddingRight={onClick ? "s" : "m"}
        marginRight="s"
        marginBottom="s"
        borderRadius="round"
        borderWidth={1.5}
        borderColor={onClick ? "primary" : "outlineVariant"}
        backgroundColor={
          onClick ? "primaryContainer" : "surfaceContainerLowest"
        }
      >
        <Text
          variant="small"
          fontWeight="600"
          color={onClick ? "primary" : "onSurface"}
        >
          {t(`muscles.${tag}`)}
        </Text>
        {onClick && (
          <AppIcon
            icon={IconCircleXFilled}
            size={18}
            color={theme.colors.primary}
            decorative
          />
        )}
      </Box>
    </TouchableWithoutFeedback>
  );

  return tags.length > 0 ? (
    <Box flexDirection="row" flexWrap="wrap" paddingVertical="s">
      {tags.map(renderTag)}
    </Box>
  ) : null;
};
